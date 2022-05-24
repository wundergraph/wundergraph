#!/bin/bash

# useful to test mTLS with self-signed certificates
openssl req -newkey rsa:2048 \
  -new -nodes -x509 \
  -days 3650 \
  -out cert.pem \
  -keyout key.pem \
  -subj "/C=US/ST=California/L=Mountain View/O=Your Organization/OU=Your Unit/CN=localhost" \
  -addext "subjectAltName = DNS:localhost"
