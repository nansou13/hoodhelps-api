FROM postgres:15.1-alpine

LABEL author="Nansou13"
LABEL description="Postgres Image for my app"
LABEL version="1.0"

COPY *.sql /docker-entrypoint-initdb.d/