all: check-setup
# Bootstrap pnpm workspace
	make bootstrap-pnpm
# prepare and install engine
	make engine-dev

bootstrap-pnpm:
	./scripts/pnpm.sh

docs:
	pnpm --filter="./docs-website" dev

build-docs:
	cd docs-website && pnpm build

engine-dev: codegen
	go mod tidy
	go mod download
# Install current binary in the pnpm workspace
	make wunderctl

check-setup:
	$(shell ./scripts/check-setup.sh)

setup-dev:
	./scripts/setup-dev.sh

bootstrap-minio:
	./scripts/minio-setup.sh

test-go:
	go test ./...

test-ts:
	pnpm test

test: test-go test-ts

golang-ci:
	 golangci-lint run

golang-ci-fix:
	 golangci-lint run --fix

install-proto:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28.1

codegen-go: install-proto
	cd types && ./generate.sh

codegen: install-proto codegen-go
	pnpm codegen

build: codegen
	cd cmd/wunderctl && CGO_ENABLED=0 go build -o ../../wunderctl -ldflags "-X 'main.commit=$(shell git rev-parse --short HEAD)' -X 'main.builtBy=dev' -X 'main.version=dev' -X 'main.date=$(shell date)'" -trimpath

# This command builds the wunderctl binary and copies it into the nodejs wunderctl wrapper
wunderctl: build
	pnpm -r run --filter="./packages/wunderctl" build
	rm -f packages/wunderctl/download/wunderctl
	cp -f wunderctl packages/wunderctl/download/wunderctl
	rm wunderctl

run:
	cd cmd/wunderctl && go run main.go

# CGO_ENABLED is set to 0 to avoid linking to libc. This is required to run the binary on alpine.
install:
	cd cmd/wunderctl && CGO_ENABLED=0 go install

.PHONY: codegen build run tag install-proto format-templates dev all check-local docs wunderctl build-docs bootstrap-minio bootstrap-pnpm
