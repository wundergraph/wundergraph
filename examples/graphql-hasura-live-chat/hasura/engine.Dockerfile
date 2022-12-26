FROM hasura/graphql-engine:v2.15.2

RUN apt-get update -y \
 && apt-get install -y curl \
 && rm -rf /var/lib/apt/lists/*
