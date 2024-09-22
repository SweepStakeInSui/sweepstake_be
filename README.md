## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Setup

### Prerequisite

Redis

Mysql, make sure Mysql have the right database name (configured later in `.env` file under key `DB_DATABASE`)

### Prepare the .env file

```bash
$ cp .env.example .env
```

### Install dependencies

```bash
$ ./scripts/install.sh
```

## Run project

### Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# debug mode
$ yarn start:debug

# production mode
$ yarn start:prod
```

### Running with docker

Setup the `.env.production.local` and then run the app with docker compose (mysql and redis included, Make sure the server pointing to the right database)

env sample:

```
REDIS_HOST=sweepstake-redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Config Database
DB_TYPE=mysql
DB_HOST=sweepstake-mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=
DB_DATABASE=sweepstake
MAX_QUERY_EXECUTION_TIME=5000

```

## Login flow details

1. user uses api `/auth/nonce` to get a random nonce, this nonce will be stored in Redis in 60s
2. user signs the random nonce with his private key, and then send the signature using api `/auth/login`. Server verifies the signer of signature and check if the nonce of the signer still valid in Redis or not. If everything is ok, return the JWT.

## Stay in touch

-   Author - [0x5ea000000](https://0x5ea000000.xyz)

## License

Nest is [MIT licensed](LICENSE).
