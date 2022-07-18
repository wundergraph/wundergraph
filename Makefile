all: check-setup engine-dev
	pnpm install --ignore-scripts
	pnpm -r run --filter="./packages/wunderctl" build
	pnpm -r run --filter="./packages/wunderctl" postinstall
	pnpm install
	pnpm run build

docs:
	cd docs-website && npm install && npm run dev

engine-dev: codegen
	go mod tidy
	go mod download

check-setup:
	$(shell ./scripts/check-setup.sh)

test-go:
	go test ./...

test-ts:
	pnpm test

test: test-go test-ts

format-templates:
	pnpx prettier --write pkg/templates/assets/templates --ignore-unknown

install-proto:
	go install github.com/golang/protobuf/proto
	go install github.com/golang/protobuf/protoc-gen-go

codegen: install-proto
	cd types && ./generate.sh

build: codegen
	cd cmd/wunderctl && go build -o ../../wunderctl -ldflags "-w -s -X 'main.commit=$COMMIT' -X 'main.builtBy=ci' -X 'main.version=$VERSION' -X 'main.date=$DATE'" -trimpath

# This command builds the wunderctl binary and copies it into the nodejs wunderctl wrapper
wunderctl: build
	pnpm -r run --filter="./packages/wunderctl" build
	cp -f wunderctl packages/wunderctl/download/wunderctl
	rm wunderctl

run:
	cd cmd/wunderctl && go run main.go

install:
	cd cmd/wunderctl && go install

update-examples:
	cd examples && rm -rf simple && mkdir simple && cd simple && wunderctl init


.PHONY: codegen build run tag install-proto format-templates dev all check-local docs wunderctl
