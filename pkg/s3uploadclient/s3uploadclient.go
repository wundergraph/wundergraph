package s3uploadclient

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/buger/jsonparser"
	"github.com/cespare/xxhash"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
	"golang.org/x/net/context"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/hooks"
)

const MaxUploadSize = 20 * 1024 * 1024 // 20MB
const MaxS3CreationTimeout = time.Duration(time.Second * 30)

type S3UploadClient struct {
	client         *minio.Client
	bucketName     string
	bucketLocation string
	profiles       map[string]*preparedProfile
	hooksClient    *hooks.Client
	name           string
}

type preparedProfile struct {
	UploadProfile
	allowedMimeTypesRegexps []*regexp.Regexp
}

// UploadProfile specifies options like maximum file size and allowed
// extensions for a given upload profile
type UploadProfile struct {
	// Maximum size of each file in bytes
	MaxFileSizeBytes int
	// Maximum number of files per upload
	MaxAllowedFiles int
	// Allowed mime types, case insensitive
	AllowedMimeTypes []string
	// Allowed file extensions, case insensitive
	AllowedFileExtensions []string
	// Wether to use the PreUpload middleware hook
	UsePreUploadHook bool
	// Wether to use the PostUpload middleware hook
	UsePostUploadHook bool
}

type Options struct {
	Logger          *zap.Logger
	BucketName      string
	BucketLocation  string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	// Profiles available for this. Key is the profile name while
	// the value is an UploadProfile. Note that it might be empty.
	Profiles map[string]*UploadProfile
	// Client for executing hooks
	HooksClient *hooks.Client
	// Client name, must be set when using hooks because the name
	// is part of the hook URL.
	Name string
}

type UploadResponse struct {
	Files []UploadedFile `json:"Files"`
}

type UploadedFile struct {
	Key string `json:"key"`
}

func NewS3UploadClient(endpoint string, s3Options Options) (*S3UploadClient, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3Options.AccessKeyID, s3Options.SecretAccessKey, ""),
		Secure: s3Options.UseSSL,
	})
	if err != nil {
		return nil, err
	}

	// Normalize profiles
	profiles := make(map[string]*preparedProfile, len(s3Options.Profiles))
	for name, profile := range s3Options.Profiles {
		allowedMimeTypes := make([]string, len(profile.AllowedMimeTypes))
		allowedMimeTypesRegexps := make([]*regexp.Regexp, len(profile.AllowedMimeTypes))
		for ii, mimeType := range profile.AllowedMimeTypes {
			normalized := strings.ToLower(mimeType)
			allowedMimeTypes[ii] = normalized
			if strings.IndexByte(normalized, '*') >= 0 {
				re, err := regexp.Compile(strings.ReplaceAll(normalized, "*", ".*"))
				if err != nil {
					if s3Options.Logger != nil {
						s3Options.Logger.Warn("error compiling mimetype wildcard", zap.String("mimetype", normalized), zap.Error(err))
						continue
					}
				}
				allowedMimeTypesRegexps[ii] = re
			}
		}
		allowedFileExtensions := make([]string, len(profile.AllowedFileExtensions))
		for ii, extension := range profile.AllowedFileExtensions {
			// Since Go's extension functions return the value with a '.' at the
			// start, massage them here to make testing slightly faster
			ext := strings.ToLower(extension)
			if ext != "" && ext[0] != '.' {
				ext = "." + ext
			}
			allowedFileExtensions[ii] = ext
		}
		// Since we're only looking for exact matches here, we can sort the
		// extensions and make search a bit faster
		sort.Strings(allowedFileExtensions)
		pp := &preparedProfile{
			UploadProfile:           *profile,
			allowedMimeTypesRegexps: allowedMimeTypesRegexps,
		}
		pp.AllowedMimeTypes = allowedMimeTypes
		pp.AllowedFileExtensions = allowedFileExtensions
		profiles[name] = pp
	}

	s := &S3UploadClient{
		client:         client,
		bucketName:     s3Options.BucketName,
		bucketLocation: s3Options.BucketLocation,
		profiles:       profiles,
		hooksClient:    s3Options.HooksClient,
		name:           s3Options.Name,
	}

	err = s.createBucket()
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (s *S3UploadClient) createBucket() error {
	ctx, cancel := context.WithTimeout(context.Background(), MaxS3CreationTimeout)
	defer cancel()
	exists, err := s.client.BucketExists(ctx, s.bucketName)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return s.client.MakeBucket(ctx, s.bucketName, minio.MakeBucketOptions{Region: s.bucketLocation})
}

func (s *S3UploadClient) uploadProfile(r *http.Request) (profileName string, profile *preparedProfile, err error) {
	if profileName = r.Header.Get("X-Upload-Profile"); profileName != "" {
		profile = s.profiles[profileName]
		if profile == nil {
			return "", nil, fmt.Errorf("profile %q does not exist in upload provider %s", profileName, s.name)
		}
	}
	return profileName, profile, nil
}

func (s *S3UploadClient) uploadToS3(ctx context.Context, r *http.Request, part *multipart.Part) (*minio.UploadInfo, error) {
	extension := filepath.Ext(part.FileName())

	// find type based on file header, populated when *multipart.Part created
	// if empty, contentType will be assigned by FPutObject
	contentType := contentTypeFromPart(part)

	// creates a temporary unique file in the temp folder of the OS
	tmp, err := os.CreateTemp("", fmt.Sprintf("wundergraph-upload.*.%s", extension))
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = os.Remove(tmp.Name())
	}()

	written, err := io.Copy(tmp, part)
	if err != nil {
		return nil, err
	}

	filename, err := s.preUpload(ctx, r, part, tmp, written)
	if err != nil {
		return nil, err
	}

	info, err := s.client.FPutObject(ctx, s.bucketName, filename, tmp.Name(), minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"metadata":           fileMetadataFromRequest(r),
			"original-filename":  part.FileName(),
			"original-extension": extension,
			"original-size":      strconv.FormatInt(written, 10),
		},
	})
	if err != nil {
		return nil, err
	}

	return &info, nil
}

func (s *S3UploadClient) fileSize(tempFile *os.File) (int64, error) {
	st, err := os.Stat(tempFile.Name())
	if err != nil {
		return 0, fmt.Errorf("error stat'ing temporary file: %w", err)
	}
	return st.Size(), nil
}

func (s *S3UploadClient) preUpload(ctx context.Context, r *http.Request, part *multipart.Part, tempFile *os.File, fileSize int64) (string, error) {
	profileName, profile, err := s.uploadProfile(r)
	if err != nil {
		return "", err
	}

	var fileKey string

	if profile != nil {
		if err := s.validateFile(ctx, profile, part, fileSize); err != nil {
			return "", fmt.Errorf("error validating file: %w", err)
		}

		if profile.UsePreUploadHook {
			var buf []byte
			data, err := hookData(buf, r, part, fileSize, nil)
			if err != nil {
				return "", fmt.Errorf("error preparing preUpload hook data: %w", err)
			}
			resp, err := s.hooksClient.DoUploadRequest(ctx, s.name, profileName, hooks.PreUpload, data)
			if err != nil {
				return "", fmt.Errorf("error in preUpload hook: %w", err)
			}
			// resp.Error is guaranteed to be empty here, since *hooks.Client would
			// handle it and return err != nil if resp.Error was non-empty.
			fileKey = resp.FileKey
		}
	}

	if fileKey == "" {
		hexHash, err := hashContents(tempFile)
		if err != nil {
			return "", err
		}
		fileKey = fmt.Sprintf("%s%s", hexHash, filepath.Ext(part.FileName()))
	}
	return fileKey, nil
}

func (s *S3UploadClient) validateFile(ctx context.Context, profile *preparedProfile, part *multipart.Part, fileSize int64) error {
	if profile.MaxFileSizeBytes >= 0 {
		if fileSize > int64(profile.MaxFileSizeBytes) {
			return fmt.Errorf("file with %d bytes exceeds the %d maximum", fileSize, profile.MaxFileSizeBytes)
		}
	}
	if mc := len(profile.AllowedMimeTypes); mc > 0 {
		contentType := strings.ToLower(contentTypeFromPart(part))
		valid := false
		for ii, mt := range profile.AllowedMimeTypes {
			// Direct match
			if mt == contentType {
				valid = true
				break
			}
			if re := profile.allowedMimeTypesRegexps[ii]; re != nil {
				if re.MatchString(contentType) {
					valid = true
					break
				}
			}
		}
		if !valid {
			return fmt.Errorf("file with MIME type %s is not allowed (%s)", contentType, strings.Join(profile.AllowedFileExtensions, ", "))

		}
	}
	if ec := len(profile.AllowedFileExtensions); ec > 0 {
		ext := filepath.Ext(part.FileName())
		pos := sort.SearchStrings(profile.AllowedFileExtensions, ext)
		if pos >= ec || profile.AllowedFileExtensions[pos] != ext {
			return fmt.Errorf("file with extension %s is not allowed (%s)", ext, strings.Join(profile.AllowedFileExtensions, ", "))
		}
	}
	return nil
}

func (s *S3UploadClient) UploadFile(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, MaxUploadSize)

	var result []UploadedFile
	reader, err := r.MultipartReader()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		// handle only Files
		if part.FileName() == "" {
			continue
		}
		info, err := s.handlePart(r.Context(), r, part)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		result = append(result, UploadedFile{info.Key})
	}

	files, err := json.Marshal(result)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(files)
}

func (s *S3UploadClient) postUpload(ctx context.Context, r *http.Request, part *multipart.Part, info *minio.UploadInfo, uploadError error) error {
	profileName, profile, err := s.uploadProfile(r)
	if err != nil {
		return err
	}

	if profile != nil && profile.UsePostUploadHook {
		var buf []byte
		data, err := hookData(buf, r, part, info.Size, uploadError)
		if err != nil {
			return fmt.Errorf("error preparing postUpload hook data: %w", err)
		}
		_, err = s.hooksClient.DoUploadRequest(ctx, s.name, profileName, hooks.PostUpload, data)
		if err != nil {
			return fmt.Errorf("error in postUpload hook: %w", err)
		}
	}
	return nil
}

func (s *S3UploadClient) handlePart(ctx context.Context, r *http.Request, part *multipart.Part) (*minio.UploadInfo, error) {
	defer part.Close()

	info, err := s.uploadToS3(ctx, r, part)
	// Run PostUpload first
	if err := s.postUpload(ctx, r, part, info, err); err != nil {
		return nil, err
	}
	// Check error from s.uploadToS3()
	if err != nil {
		return nil, err
	}

	return info, nil
}

type hookFile struct {
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	MimeType string `json:"type"`
}

func contentTypeFromPart(part *multipart.Part) string {
	return part.Header.Get("Content-Type")
}

func fileMetadataFromRequest(r *http.Request) string {
	return r.Header.Get("X-Metadata")
}

func hookData(buf []byte, r *http.Request, part *multipart.Part, fileSize int64, uploadError error) ([]byte, error) {
	buf = buf[:0]
	buf = append(buf, []byte(`{"__wg":{}}`)...)
	if user := authentication.UserFromContext(r.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			if buf, err = jsonparser.Set(buf, userJson, "__wg", "user"); err != nil {
				return nil, err
			}
		}
	}
	if part != nil {
		fileData, err := json.Marshal(&hookFile{
			Name:     part.FileName(),
			Size:     fileSize,
			MimeType: contentTypeFromPart(part),
		})
		if err != nil {
			return nil, err
		}
		if buf, err = jsonparser.Set(buf, fileData, "file"); err != nil {
			return nil, err
		}
	}
	if metadata := fileMetadataFromRequest(r); metadata != "" {
		var err error
		if buf, err = jsonparser.Set(buf, []byte(metadata), "meta"); err != nil {
			return nil, err
		}
	}
	if uploadError != nil {
		jsError := struct {
			Name    string `json:"name"`
			Message string `json:"message"`
		}{
			Name:    "UploadError",
			Message: uploadError.Error(),
		}
		jsErrorData, err := json.Marshal(jsError)
		if err != nil {
			return nil, err
		}
		if buf, err = jsonparser.Set(buf, jsErrorData, "error"); err != nil {
			return nil, err
		}
	}
	return buf, nil
}

// hashContents returns the xxhash encoded as an hex string.
// Before calculating the hash, it seeks to rs's start.
func hashContents(rs io.ReadSeeker) (string, error) {
	if _, err := rs.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	hasher := xxhash.New()
	if _, err := io.Copy(hasher, rs); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}
