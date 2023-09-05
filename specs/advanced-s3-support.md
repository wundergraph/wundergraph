# Advanced S3 support

This spec describes advanced S3 support for WunderGraph, adding enterprise-grade capabilities and flexibily on the existing implementation.

## Problems

There are a few problems with this limited scope:

- we're not able to limit uploads to authenticated users
- we're unable to enforce RBAC (authorization)
- we cannot limit the upload file size and MIME types
- we cannot override or enforce file names
- we cannot set a file path in case our bucket has a file structure
- we might want to get some info on successful/unsuccessful file uploads as a callback, e.g. to associate the uploaded
  file with a database record

What all of these problems have in common is that we need to be able to handle these dynamically, on a per-request
basis.

## Solution

There are different stages in the lifecycle of a file upload, so we need multiple tools to properly implement the
required capabilities.

### Configuration

The first part of the solution is configuration. Multiple profiles (`uploadProfiles`) can be configured per S3 provider,
eg different restrictions for different file types, like profile pictures or blog images.
In the configuration we can define file restrictions and meta information validation. Meta information can be supplied by the client and used to generate file keys, or used post upload to store file metadata in the database.

This configuration can then be used for validation on the server and client side.

In case no `uploadProfiles` configuration is added, upload behaves as the current implementation, where files are upload in the bucket root with their original filename.

```ts
configureWunderGraphApplication({
  s3UploadProvider: [
    new S3UploadProvider({
      name: 'minio',
      uploadProfiles: {
        avatar: {
          maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
          maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
          allowedMimeTypes: ['image/png', 'image/jpeg'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
          allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
        },
        coverPicture: {
          meta: {
            type: 'object',
            properties: {
              postId: {
                type: 'string',
              },
            },
          },
          maxAllowedUploadSizeBytes: 1024 * 1024 * 10, // 10 MB, optional, defaults to 25 MB
          maxAllowedFiles: 1, // limit the number of files to 1, leave undefined for unlimited files
          allowedMimeTypes: ['image/*'], // wildcard is supported, e.g. 'image/*', leave empty/undefined to allow all
          allowedFileExtensions: ['png', 'jpg'], // leave empty/undefined to allow all
        },
      },
    }),
  ],
});
```

### Hooks

Just like operations we can define hooks for uploads that we've defined in our configuration.
These hooks can be used to implement authorization, validation and return the key / path where the file should be stored.

Hooks are called for each file that is uploaded, so we can implement different logic for different files. Only the file meta information is passed to the hook, so we can't access the raw file itself.

Validation of the file according to the configuration is done before the hooks are called, in the Go server.

```ts
export default configureWunderGraphServer(() => ({
  uploads: {
    minio: {
      coverPicture: {
        preUpload({user, file, meta}) {
          if (!user) {
            return {
              error: 'Unauthorized',
            };
          }

          return {
            fileKey: 'my-file-path/' + meta.postId + '/my-file-name' + file.extension,
          }
        }
      },
      postUpload({user, file, fileKey, meta, operations, error}) {
        operations.mutate({
          operationName: 'fileMeta',
          input: {
            key: fileKey
          }
        })
      }
    }
  }
})
```

### TypeScript Client

The `profile` configuration id and meta information can be passed to the `uploadFile` method of the TypeScript client. All properties will be typesafe based on the generated configuration.

```ts
const client = new WunderGraphClient();

const { fileKeys } = await client.uploadFiles({
  files: files,
  provider: 'minio',
  profile: 'avatar',
  meta: {
    postId: '123',
  },
});
```

Files can be validated.

```ts
client.validateFiles({
  files: files,
  provider: 'minio',
  profile: 'avatar',
  meta: {
    postId: '123',
  },
});
```

### React

Calling upload will validate the files client side and throw an error if the files aren't valid.

```ts
const { data, error, isLoading, upload } = useUploadFiles({
  provider: 'minio',
  profile: 'avatar',
});

const keys = await upload({
  files: files,
  meta: {
    postId: '123',
  },
});
```

### Conclusion

To summarize, solution is divided into three parts:

1. uploads configuration
2. pre- and post-upload hooks
3. client side validation

Coming back to our list of problem, let's see if all of them are addressed:

- we're not able to limit uploads to authenticated users (preUploadHook)
- we're unable to enforce RBAC / authorization (preUploadHook)
- we cannot limit the upload file size and MIME types (configuration)
- we cannot override or enforce file names (preUploadHook)
- we cannot set a file path in case our bucket has a file structure (preUploadHook)
- we might want to get some info on successful/unsuccessful file uploads as a callback, e.g. to associate the uploaded
  file with a database record (postUploadHook)

All problems are addressed by the solution.

### References

- [RFC] https://github.com/wundergraph/wundergraph/discussions/312
- https://github.com/wundergraph/wundergraph/issues/112
