---
title: Configure S3 File Upload Providers
description: How to configure S3 compatible File Upload Providers.
---

WunderGraph supports S3 compatible storage providers so that users of WunderGraph Applications can easily upload files.

Find below an annotated `wundergraph.config.ts` file with two S3 providers and multiple profiles configured:

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  s3UploadProvider: [
    {
      // A provider without any profiles
      name: 'minio', // a unique name for the storage provider
      endpoint: 'localhost:9000', // the S3 endpoint
      accessKeyID: 'test', // access key to upload files to the S3 bucket
      secretAccessKey: '12345678', // access secret to upload files to the S3 bucket
      bucketLocation: 'eu-central-1', // the bucket location, some providers don't require it
      bucketName: 'uploads', // the bucket name to which you're uploading files
      useSSL: false, // disable SSL if you're running e.g. Minio on your local machine
    },
    {
      // Provider with multiple profiles. Uploads to this provider must
      // specify the profile name to use.
      name: 'do', // second unique name for the storage provider
      endpoint: 'fra1.digitaloceanspaces.com',
      accessKeyID: 'xxx',
      secretAccessKey: 'xxx',
      bucketLocation: 'eu-central-1', // ignore this setting on Digital Ocean
      bucketName: 'wundergraph-demo2',
      useSSL: true, // you should always enable SSL for cloud storage providers!
      uploadProfiles: {
        avatar: {
          maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
          maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
          allowedMimeTypes: ['image/png', 'image/jpeg'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
          allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
          meta: {
            // Optional metadata object schema, defined as JSON schema
            type: 'object',
            properties: {
              postId: {
                type: 'string',
              },
            },
          },
        },
        coverPicture: {
          requireAuthentication: false, // Allows uploads from anonymous users
          maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
          maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
          allowedMimeTypes: ['image/*'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
          allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
          // No metadata schema allows any metadata to be set
        },
        gallery: {
          // Optional metadata object schema, defined with zod
          meta: z.object({
            postId: z.string(),
            position: z.number().positive(),
          }),
        },
      },
    },
  ],
});
```

Once configured, `wunderctl up` should show the registration of the S3 storage provider without errors like so:

```shell
{"level":"debug","ts":"2021-10-18T12:04:30.362585+02:00","msg":"register S3 provider","provider":"minio"}
{"level":"debug","ts":"2021-10-18T12:04:30.362605+02:00","msg":"register S3 endpoint","path":"/s3/minio/upload"}
```
