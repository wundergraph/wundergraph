FROM debian:buster-slim

RUN apt-get update -y \
 && apt-get install -y curl socat
    
RUN arch=$(arch | sed s/aarch64/arm64/ | sed s/x86_64/amd64/) && curl -L -o /usr/local/bin/hasura "https://github.com/hasura/graphql-engine/releases/download/v2.15.2/cli-hasura-linux-${arch}"

RUN chmod +x /usr/local/bin/hasura \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/hasura

RUN groupadd --gid 1000 hasura \
  && useradd --uid 1000 --gid hasura --shell /bin/bash --create-home hasura

COPY --chown=1000:users . .

RUN chmod +x ./start.sh

USER 1000

CMD "./start.sh"
