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

	"github.com/cespare/xxhash"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
	"golang.org/x/net/context"
)

const MaxUploadSize = 20 * 1024 * 1024 // 20MB
const MaxS3CreationTimeout = time.Duration(time.Second * 30)

type S3UploadClient struct {
	client         *minio.Client
	bucketName     string
	bucketLocation string
	profiles       map[string]*preparedProfile
}

type preparedProfile struct {
	*UploadProfile
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
		profiles[name] = &preparedProfile{
			UploadProfile: &UploadProfile{
				MaxFileSizeBytes:      profile.MaxFileSizeBytes,
				MaxAllowedFiles:       profile.MaxAllowedFiles,
				AllowedMimeTypes:      allowedMimeTypes,
				AllowedFileExtensions: allowedFileExtensions,
			},
			allowedMimeTypesRegexps: allowedMimeTypesRegexps,
		}
	}

	s := &S3UploadClient{
		client:         client,
		bucketName:     s3Options.BucketName,
		bucketLocation: s3Options.BucketLocation,
		profiles:       profiles,
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

func (s *S3UploadClient) uploadToS3(ctx context.Context, r *http.Request, part *multipart.Part) (*minio.UploadInfo, error) {
	extension := filepath.Ext(part.FileName())

	// find type based on file header, populated when *multipart.Part created
	// if empty, contentType will be assigned by FPutObject
	contentType := part.Header.Get("Content-Type")

	// creates a temporary unique file in the temp folder of the OS
	dst, err := os.CreateTemp("", fmt.Sprintf("wundergraph-upload.*.%s", extension))
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = os.Remove(dst.Name())
	}()

	_, err = io.Copy(dst, part)
	if err != nil {
		return nil, err
	}

	_, err = dst.Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}

	hasher := xxhash.New()
	written, err := io.Copy(hasher, dst)
	if err != nil {
		return nil, err
	}

	if profileName := r.Header.Get("X-Upload-Profile"); profileName != "" {
		profile := s.profiles[profileName]
		if profile == nil {
			return nil, fmt.Errorf("profile %q does not exist in upload provider %s", profileName, s.client.EndpointURL())
		}
		if err := s.validateFile(ctx, profile, part, dst); err != nil {
			return nil, err
		}
	}

	filename := fmt.Sprintf("%s%s", hex.EncodeToString(hasher.Sum(nil)), extension)

	info, err := s.client.FPutObject(ctx, s.bucketName, filename, dst.Name(), minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"metadata":           r.Header.Get("X-Metadata"),
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

func (s *S3UploadClient) validateFile(ctx context.Context, profile *preparedProfile, part *multipart.Part, tempFile *os.File) error {
	// Only stat() if we actually have a file size limit
	if profile.MaxFileSizeBytes >= 0 {
		st, err := os.Stat(tempFile.Name())
		if err != nil {
			return fmt.Errorf("error stat'ing temporary file when validating profile: %w", err)
		}
		if st.Size() > int64(profile.MaxFileSizeBytes) {
			return fmt.Errorf("file with %d bytes exceeds the %d maximum", st.Size(), profile.MaxFileSizeBytes)
		}
	}
	if mc := len(profile.AllowedMimeTypes); mc > 0 {
		contentType := strings.ToLower(part.Header.Get("Content-Type"))
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
			return fmt.Errorf("file withe MIME type %s is not allowed (%s)", contentType, strings.Join(profile.AllowedFileExtensions, ", "))

		}
	}
	if ec := len(profile.AllowedFileExtensions); ec > 0 {
		ext := filepath.Ext(part.FileName())
		pos := sort.SearchStrings(profile.AllowedFileExtensions, ext)
		if pos >= ec || profile.AllowedFileExtensions[pos] != ext {
			return fmt.Errorf("file withe extension %s is not allowed (%s)", ext, strings.Join(profile.AllowedFileExtensions, ", "))
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

func (s *S3UploadClient) handlePart(ctx context.Context, r *http.Request, part *multipart.Part) (*minio.UploadInfo, error) {
	defer part.Close()

	info, err := s.uploadToS3(ctx, r, part)
	if err != nil {
		return nil, err
	}

	return info, nil
}
