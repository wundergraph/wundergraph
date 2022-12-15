---
title: File Uploads to S3-compatible File Storages
pageTitle: WunderGraph - Features - File Uploads to S3-compatible File Storages
description:
---

While WunderGraph's main purpose is to deal with structured data,
files / blobs are also an important aspect of building applications.

Your users might not only want to upload content in their applications but also images, PDF files, etc...

We've looked into the various solutions that frameworks offer to make file uploads easy alongside your REST or GraphQL APIs.
What we found is that most solutions are custom and require some extra work either in the client, the server-side or even both.

Our credo is, developer experience first!
For that reason, we've added support for S3 compatible storage providers.

## What is S3?

In case you're already familiar, skip this section.

S3 is a protocol established by AWS that allows clients to upload files to so called "Buckets".
A bucket is simply a folder,
so, S3 allows you to upload files to folders.

However, folders are not really scalable if we're talking about millions of files.
For that reason, AWS made an abstraction on top of distributed file systems that gives you "Buckets" which can be accessed over an HTTP API.

Nowadays, there are many Cloud Providers that implemented the S3 protocol,
allowing you to use S3 without vendor lock-in.

Additionally, there's also Minio, also a storage service provider,
which can be used as a S3 storage on premises or even on your local machine.

## Architecture Overview

WunderGraph generates a type-safe client for your applications.
Part of the client is a file upload handler which can talk to multiple buckets.
Instead of binding a client to a specific S3 compatible instance,
you're able to use different storages depending on the environment,
you're running on.

E.g. you can use Minio on localhost and DigitalOcean spaces when running in production.

Additionally,
you're able to swap storage providers or buckets without changing the client itself.

## How does it work?

1. Configure your S3 Bucket (see reference below for more info)
1. Use the generated Client to upload files

It's that easy! Here's an example using a generated TypeScript client with React.
It contains a basic form with the input type "file".
On submit, we're creating a FormData object with all the files submitted and upload them to the S3 bucket you've configured, done.
Btw. , this works with any environment that can send FormData using HTTP Requests.

```typescript jsx
const UploadPage: NextPage = () => {
  const [files, setFiles] = useState<FileList>()
  const [data, setData] = useState([])

  const { upload, data } = useFileUpload()

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
  }
  const onSubmit = async (e: React.FormEvent<Element>) => {
    e.preventDefault()

    const result = await upload({
      provider: 'minio'
      files,
    })

    if (result) {
      setData(result)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Upload multiple files to any S3 compatible file server</h1>
      <h3>
        Comment out the S3 section in{' '}
        <code>.wundergraph/wundergraph.config.ts:141</code> and run{' '}
        <code>minio/setup.sh</code> to start your own S3 server.
      </h3>
      {!WUNDERGRAPH_S3_ENABLED && (
        <p>Please enable S3 first to be able to upload files.</p>
      )}
      {WUNDERGRAPH_S3_ENABLED && (
        <div>
          <form onSubmit={onSubmit}>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={onFileChange}
            />
            <button type="submit">Submit</button>
          </form>
          <ul>
            {data.map((file) => (
              <li>
                <a
                  target="_blank"
                  href={`http://localhost:9000/uploads/${file}`}
                >
                  {file}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

## Reference

Learn more on how to [configure and use your S3 storage with WunderGraph in the reference](/docs/wundergraph-config-ts-reference/configure-s3-file-upload-providers).
