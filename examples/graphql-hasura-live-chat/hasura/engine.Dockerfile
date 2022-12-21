# Build instructions:
#   docker build -t 159213555475.dkr.ecr.ap-southeast-2.amazonaws.com/hasura-engine:v2.15.0 -f storage/hasura/engine.Dockerfile storage/hasura
#   docker push 159213555475.dkr.ecr.ap-southeast-2.amazonaws.com/hasura-engine:v2.15.0
FROM hasura/graphql-engine:v2.15.2

RUN apt-get update -y \
 && apt-get install -y curl \
 && rm -rf /var/lib/apt/lists/*
