---
title: Configure S3 File Upload Providers
pageTitle: WunderGraph - Configure S3 File Upload Providers
description:
---

WunderGraph supports S3 compatible storage providers so that users of WunderGraph Applications can easily upload files.

Find below an annotated `wundergraph.config.ts` file with two S3 providers configured:

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  s3UploadProvider: [
    {
      name: 'minio', // a unique name for the storage provider
      endpoint: '127.0.0.1:9000', // the S3 endpoint
      accessKeyID: 'test', // access key to upload files to the S3 bucket
      secretAccessKey: '12345678', // access secret to upload files to the S3 bucket
      bucketLocation: 'eu-central-1', // the bucket location, some providers don't require it
      bucketName: 'uploads', // the bucket name to which you're uploading files
      useSSL: false, // disable SSL if you're running e.g. Minio on your local machine
    },
    {
      name: 'do', // second unique name for the storage provider
      endpoint: 'fra1.digitaloceanspaces.com',
      accessKeyID: 'xxx',
      secretAccessKey: 'xxx',
      bucketLocation: 'eu-central-1', // ignore this setting on Digital Ocean
      bucketName: 'wundergraph-demo2',
      useSSL: true, // you should always enable SSL for cloud storage providers!
    },
  ],
})
```

Once configured, `wunderctl up` should show the registration of the S3 storage provider without errors like so:

```shell
{"level":"debug","ts":"2021-10-18T12:04:30.362585+02:00","msg":"register S3 provider","provider":"minio"}
{"level":"debug","ts":"2021-10-18T12:04:30.362605+02:00","msg":"register S3 endpoint","path":"/s3/minio/upload"}
```
