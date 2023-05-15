---
title: AWS S3 Storage Provider
description: Use Amazon S3 as your storage provider.
---

Amazon S3 is an cloud object storage solution that is widely used for storing files.
WunderGraph comes with built-in support for Amazon S3.

## Add a S3 storage provider

Edit `.wundergraph/wundergraph.config.ts` and add the following configuration to `s3UploadProvider`.

```typescript
const aws = {
  name: 's3', // unique name for the storage provider, this is used in the client.
  endpoint: 's3.amazonaws.com',
  accessKeyID: 'xxx',
  secretAccessKey: 'xxx',
  bucketLocation: 'eu-central-1',
  bucketName: 'wundergraph-test',
  useSSL: true, // you should always enable SSL for cloud storage providers!
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

Once you've added the S3 storage provider, you can upload files to it using the `uploadFile` method of the WunderGraph client.

**TypeScript client**

```typescript
const { fileKeys } = await client.uploadFiles({
  provider: 's3',
  profile: 'avatar',
  files,
});
```

**React (SWR) client**

```typescript
const { upload } = useFileUpload();

const onUpload = async (files: FileList) => {
  const { fileKeys } = await upload({
    provider: 's3',
    profile: 'avatar',
    files,
  });
};
```

## Learn more

{% quick-links %}
{% quick-link title="Reference docs" icon="apis" href="/docs/wundergraph-config-ts-reference/configure-s3-file-upload-providers" description="S3 file upload providers reference." /%}
{% /quick-links %}
