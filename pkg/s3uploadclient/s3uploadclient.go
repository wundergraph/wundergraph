package s3uploadclient

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/cespare/xxhash"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"golang.org/x/net/context"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

const MaxUploadSize = 20 * 1024 * 1024 // 20MB
const MaxS3CreationTimeout = time.Duration(time.Second * 30)

type S3UploadClient struct {
	client         *minio.Client
	bucketName     string
	bucketLocation string
}

type Options struct {
	BucketName      string
	BucketLocation  string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
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

	s := &S3UploadClient{
		client:         client,
		bucketName:     s3Options.BucketName,
		bucketLocation: s3Options.BucketLocation,
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

func (s *S3UploadClient) uploadToS3(ctx context.Context, part *multipart.Part) (*minio.UploadInfo, error) {
	contentTypeBuff := make([]byte, 512)
	_, err := part.Read(contentTypeBuff)
	if err != nil {
		return nil, err
	}
	filetype := http.DetectContentType(contentTypeBuff)
	recycled := io.MultiReader(bytes.NewReader(contentTypeBuff), part)

	extension := filepath.Ext(part.FileName())
	// creates a temporary unique file in the temp folder of the OS
	dst, err := ioutil.TempFile("", fmt.Sprintf("wundergraph-upload.*.%s", extension))
	if err != nil {
		return nil, err
	}
	defer os.Remove(dst.Name())

	_, err = io.Copy(dst, recycled)
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

	_, err = dst.Seek(0, io.SeekStart)
	if err != nil {
		return nil, err
	}

	filename := hex.EncodeToString(hasher.Sum(nil)) + extension

	info, err := s.client.PutObject(ctx, s.bucketName, filename, dst, written, minio.PutObjectOptions{
		ContentType: filetype,
		UserMetadata: map[string]string{
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
		info, err := s.handlePart(r.Context(), part)
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
	w.Write(files)
}

func (s *S3UploadClient) handlePart(ctx context.Context, part *multipart.Part) (*minio.UploadInfo, error) {
	defer part.Close()

	info, err := s.uploadToS3(ctx, part)
	if err != nil {
		return nil, err
	}

	return info, nil
}
