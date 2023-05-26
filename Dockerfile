FROM golang:1.19 as builder

ARG COMMIT
ARG VERSION
ARG DATE

WORKDIR /usr/src/app

ADD . .

RUN go mod download

RUN make build

from golang:1.19-alpine as runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/wunderctl .

RUN chmod +x wunderctl && mv wunderctl /usr/local/bin

CMD WG_NODE_HOST=0.0.0.0 wunderctl start --debug

EXPOSE 9991
