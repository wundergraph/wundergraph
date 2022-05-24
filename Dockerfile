FROM golang:1.18 as builder

ARG COMMIT
ARG VERSION
ARG DATE

WORKDIR /usr/src/app

ADD . .

RUN go mod download

RUN make build

from golang:1.18-alpine as runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/wunderctl .

RUN chmod +x wunderctl && mv wunderctl /usr/local/bin

CMD wunderctl start --listen_addr 0.0.0.0:9991 --debug

EXPOSE 9991
