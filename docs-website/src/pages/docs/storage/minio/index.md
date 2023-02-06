---
title: MinIO Storage Provider
pageTitle: WunderGraph - MinIO Storage Provider
description: Use MinIO as your storage provider.
---

MinIO is a popular open source cloud object storage solution and is fully s3 compatible.
WunderGraph comes with built-in support for MinIO.

## Add a MinIO storage provider

To add a GraphQL data source, edit `.wundergraph/wundergraph.config.ts` and introspect the GraphQL server like the config below.

```typescript
const aws = {
  name: 'minio', // a unique name for the storage provider
  endpoint: 'localhost:9000', // the S3 endpoint
  accessKeyID: 'test', // access key to upload files to the S3 bucket
  secretAccessKey: '12345678', // access secret to upload files to the S3 bucket
  bucketName: 'uploads', // the bucket name to which you're uploading files
  useSSL: false, // disable SSL if you're running e.g. Minio on your local machine
  uploadProfiles: [
    {
      avatar: {
        requireAuthentication: false, // optional, defaults to true
        maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
        maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
        allowedMimeTypes: ['image/png', 'image/jpeg'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
        allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
      },
    },
  ],
};

configureWunderGraphApplication({
  s3UploadProvider: [aws],
});
```

## Upload a file

Once you've added a S3 storage provider, you can upload files to it using the `uploadFile` method of the WunderGraph client.

**TypeScript client**

```typescript
const { fileKeys } = await client.uploadFiles({
  provider: 'minio',
  profile: 'avatar',
  files,
});
```

**React (SWR) client**

```typescript
const { upload } = useFileUpload();

const onUpload = async (files: FileList) => {
  const { fileKeys } = await upload({
    provider: 'minio',
    profile: 'avatar',
    files,
  });
};
```

## Learn more

{% quick-links %}
{% quick-link title="Reference docs" icon="apis" href="/docs/wundergraph-config-ts-reference/configure-s3-file-upload-providers" description="S3 file upload providers reference." /%}
{% /quick-links %}
