FROM golang:1.17 AS builder

WORKDIR /build

# manage dependencies
COPY go.mod .
COPY go.sum .
RUN go mod download

# Copy src code from the host and compile it
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -o /server server/server.go

FROM alpine:3.9
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /bin
CMD ["/bin/server"]
