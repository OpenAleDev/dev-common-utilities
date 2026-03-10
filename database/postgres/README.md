# PostgreSQL – dev-common-utilities

A ready-to-use local PostgreSQL setup managed by a single Bun script.

---

## Directory layout

```
database/postgres/
│
├── _volume/
│   ├── init-sql/              SQL files executed automatically on first start
│   │   ├── 00_ddl_create_demoTable.sql
│   │   └── 01_dml_init_demoTable.sql
│   └── pgdata/                PostgreSQL data directory (git-ignored)
│
├── compose/
│   ├── .env                   Single source of truth for all DB config
│   └── docker-compose.yml
│
└── script/
    ├── .env                   Script-level overrides (empty by default)
    └── upAndTest.ts           Bun management & verification script
```

---

## How it works

The database runs as a plain `postgres:15` container managed by Docker Compose.  
Init scripts are mounted as a read-only volume so you can edit them without
rebuilding anything.  
PostgreSQL data is persisted in `_volume/pgdata/` on your host machine.

---

## Configuration — `compose/.env`

This is the **single source of truth** for all DB configuration.  
`docker-compose.yml` reads it automatically (same directory).  
`upAndTest.ts` parses it at runtime to build the connection URL, so values are never duplicated.

| Variable                  | Default value               | Description                    |
|---------------------------|-----------------------------|--------------------------------|
| `DATABASE_CONTAINER_NAME` | `test-compose-postgres`     | Docker container name          |
| `POSTGRES_IMAGE`          | `postgres:15`               | Base image                     |
| `POSTGRES_USER`           | `<container_name>_user`     | PostgreSQL superuser           |
| `POSTGRES_PASSWORD`       | `<container_name>_password` | Superuser password             |
| `POSTGRES_DB`             | `<container_name>_db`       | Default database name          |
| `OUTPUT_PORT`             | `9999`                      | Host port mapped to 5432       |
| `VOLUME_DATA_PATH`        | `../_volume/pgdata`         | Host path for data persistence |
| `INIT_SCRIPTS_PATH`       | `../_volume/init-sql`       | Host path for init scripts     |

`script/.env` is reserved for script-level overrides and does **not** contain DB credentials.

---

## The management script

`script/upAndTest.ts` is a [Bun](https://bun.sh) script that:

1. Tears down any existing container (`docker compose down`).
2. Starts the container (`docker compose up -d`).
3. Polls `docker logs` until PostgreSQL reports **"ready to accept connections"** (timeout: 60 s).
4. Runs a verification `SELECT` against `demo_table` and prints the results in a formatted table.

### Running the script

Prerequisites: **Bun ≥ 1.2**, **Docker** with the Compose plugin.

```bash
# from database/postgres/script/
bun upAndTest.ts
```

### Example output

```
╔══════════════════════════════════════════════════╗
║       PostgreSQL Dev Manager  ·  docker compose  ║
╚══════════════════════════════════════════════════╝

  container : test-compose-postgres
  database  : test-compose-postgres_db
  port      : 9999
  user      : test-compose-postgres_user

┌─ Step 1/4 ──────────────────────────────────────────
│  Tearing down any existing container
└─✔  Container stopped and removed  (321ms)

┌─ Step 2/4 ──────────────────────────────────────────
│  Starting database container
└─✔  Container "test-compose-postgres" started  (487ms)

┌─ Step 3/4 ──────────────────────────────────────────
│  Waiting for PostgreSQL to be ready
   ℹ  poll interval: 2s  |  timeout: 60s
└─✔  PostgreSQL is ready  (3 polls)  (6.4s)

┌─ Step 4/4 ──────────────────────────────────────────
│  Running verification query on demo_table
└─✔  Query returned 2 row(s)  (12ms)

   ┌──────┬────────────────────────┬──────────────────────────────────┐
   │ id   │ name                   │ created_at                       │
   ├──────┼────────────────────────┼──────────────────────────────────┤
   │ 1    │ Alice                  │ 2026-03-10T10:00:00.000Z         │
   │ 2    │ Bob                    │ 2026-03-10T10:00:00.001Z         │
   └──────┴────────────────────────┴──────────────────────────────────┘

────────────────────────────────────────────────────
✔  All checks passed  total: 7.2s
```

---

## Init SQL scripts

Scripts in `_volume/init-sql/` are executed by PostgreSQL in lexicographic
order on the very **first** container start (when the data directory is empty).

| File                          | Purpose                         |
|-------------------------------|---------------------------------|
| `00_ddl_create_demoTable.sql` | Creates the `demo_table` schema |
| `01_dml_init_demoTable.sql`   | Seeds two example rows          |

To add more scripts use the same two-digit prefix convention.

> Edits to init scripts take effect after `docker compose down`, deleting
> `_volume/pgdata/` (so PostgreSQL treats the volume as fresh), and running
> the script again.

---

## Quick reference

```bash
# Start & verify
cd database/postgres/script && bun upAndTest.ts

# Tear down only
docker compose -f database/postgres/compose/docker-compose.yml down

# Connect with psql
psql -h localhost -p 9999 -U test-compose-postgres_user -d test-compose-postgres_db
```


---

## Directory layout

```
database/postgres/
│
├── _volume/
│   ├── init-sql/              SQL files executed automatically on first start
│   │   ├── 00_ddl_create_demoTable.sql
│   │   └── 01_dml_init_demoTable.sql
│   └── pgdata/                PostgreSQL data directory (git-ignored)
│
├── compose/                   ── Compose mode ──────────────────────────────
│   ├── .env                   Single source of truth for all DB config
│   └── docker-compose.yml
│
├── standalone/                ── Standalone mode ───────────────────────────
│   ├── .env                   Standalone-specific config
│   ├── Dockerfile             Custom image with init scripts baked in
│   └── docker-compose.yml
│
└── script/
    ├── .env                   Script-level overrides (empty by default)
    └── upAndTest.ts           Bun management & verification script
```

---

## Deployment modes

### Compose mode (default – for local development)

The database runs as a plain `postgres:15` container.  
Init scripts are mounted as a read-only volume so you can edit them without
rebuilding anything.  
PostgreSQL data is persisted in `_volume/pgdata/` on your host machine.

```
compose/
├── .env                ← edit this to change credentials / port
└── docker-compose.yml
```

### Standalone mode (for distribution / CI)

A custom Docker image is built with the init scripts copied **inside** the
image layer.  The container is started with `docker run` — **no Compose
required**.  Data is **not** persisted between container restarts by default
(the container is ephemeral – perfect for CI or demo environments).

```
standalone/
├── .env                ← edit this to change credentials / port
└── Dockerfile          ← build context must be database/postgres/
```

---

## Configuration

### compose/.env

This is the **single source of truth** for the compose deployment.  
The management script also reads it directly, so values are never duplicated.

| Variable                | Default value                         | Description                        |
|-------------------------|---------------------------------------|------------------------------------|
| `DATABASE_CONTAINER_NAME` | `test-compose-postgres`             | Docker container name              |
| `POSTGRES_IMAGE`          | `postgres:15`                       | Base image                         |
| `POSTGRES_USER`           | `<container_name>_user`             | PostgreSQL superuser               |
| `POSTGRES_PASSWORD`       | `<container_name>_password`         | Superuser password                 |
| `POSTGRES_DB`             | `<container_name>_db`               | Default database name              |
| `OUTPUT_PORT`             | `9999`                              | Host port mapped to 5432           |
| `VOLUME_DATA_PATH`        | `../_volume/pgdata`                 | Host path for data persistence     |
| `INIT_SCRIPTS_PATH`       | `../_volume/init-sql`               | Host path for init scripts         |

### standalone/.env

Same variables (except no volume paths), with different defaults so the two
modes can coexist on the same machine.

| Variable                | Default value                          |
|-------------------------|----------------------------------------|
| `DATABASE_CONTAINER_NAME` | `standalone-postgres`               |
| `POSTGRES_IMAGE`          | `postgres-standalone`                      |
| `POSTGRES_USER`           | `<container_name>_user`              |
| `POSTGRES_PASSWORD`       | `<container_name>_password`          |
| `POSTGRES_DB`             | `<container_name>_db`                |
| `OUTPUT_PORT`             | `9998`                               |

---

## The management script

`script/upAndTest.ts` is a [Bun](https://bun.sh) script that:

1. Tears down any existing container for the selected mode.
2. *(Standalone only)* Builds the Docker image from `standalone/Dockerfile`.
3. Starts the container via `docker compose up -d`.
4. Polls `docker logs` until PostgreSQL reports **"ready to accept
   connections"** (timeout: 60 s).
5. Runs a verification `SELECT` against `demo_table` and prints the results
   in a formatted table.

### How the .env files relate to each other

```
compose/.env  ──────────────────────────────────────────────────────────────
              Single source of truth for compose mode.
              docker-compose.yml reads it automatically (same directory).
              upAndTest.ts reads and parses it at runtime to build the
              PostgreSQL connection URL – no values are duplicated.

standalone/.env ────────────────────────────────────────────────────────────
              Same role, but for standalone mode.
              upAndTest.ts reads it and passes the variables directly to
              `docker build` and `docker run` – no Compose involvement.

script/.env ────────────────────────────────────────────────────────────────
              Reserved for script-level overrides (currently empty).
              Does NOT contain DB credentials.
```

### Running the script

Prerequisites: **Bun ≥ 1.2**, **Docker** with the Compose plugin.

```bash
# from database/postgres/script/

# Compose mode (default)
bun upAndTest.ts
bun upAndTest.ts compose

# Standalone mode (builds the image first)
bun upAndTest.ts standalone
```

### Example output

```
╔══════════════════════════════════════════════════╗
║  PostgreSQL Dev Manager  ·  mode: compose         ║
╚══════════════════════════════════════════════════╝

  container : test-compose-postgres
  image     : postgres:15
  database  : test-compose-postgres_db
  port      : 9999
  user      : test-compose-postgres_user

┌─ Step 1/4 ──────────────────────────────────────────
│  Tearing down any existing container
└─✔  Container stopped and removed  (321ms)

┌─ Step 2/4 ──────────────────────────────────────────
│  Starting database container
└─✔  Container "test-compose-postgres" started  (487ms)

┌─ Step 3/4 ──────────────────────────────────────────
│  Waiting for PostgreSQL to be ready
   ℹ  poll interval: 2s  |  timeout: 60s
└─✔  PostgreSQL is ready  (3 polls)  (6.4s)

┌─ Step 4/4 ──────────────────────────────────────────
│  Running verification query on demo_table
└─✔  Query returned 2 row(s)  (12ms)

   ┌──────┬────────────────────────┬──────────────────────────────────┐
   │ id   │ name                   │ created_at                       │
   ├──────┼────────────────────────┼──────────────────────────────────┤
   │ 1    │ Alice                  │ 2026-03-10T10:00:00.000Z         │
   │ 2    │ Bob                    │ 2026-03-10T10:00:00.001Z         │
   └──────┴────────────────────────┴──────────────────────────────────┘

────────────────────────────────────────────────────
✔  All checks passed  total: 7.2s
```

---

## Init SQL scripts

Scripts in `_volume/init-sql/` are executed by PostgreSQL in lexicographic
order on the very **first** container start (when the data directory is empty).

| File                              | Purpose                            |
|-----------------------------------|------------------------------------|
| `00_ddl_create_demoTable.sql`     | Creates the `demo_table` schema    |
| `01_dml_init_demoTable.sql`       | Seeds two example rows             |

Adding new scripts follows the same convention: prefix with a two-digit
number to control execution order.

> **Compose mode**: editing scripts takes effect after `docker compose down`
> followed by deleting `_volume/pgdata/` (so PostgreSQL treats it as a fresh
> start) and running the script again.  
> **Standalone mode**: rebuild the image with `bun upAndTest.ts standalone`.

---

## Data persistence

| Mode       | Data persisted?                                    |
|------------|----------------------------------------------------|
| Compose    | Yes – in `_volume/pgdata/` (bind-mounted volume)   |
| Standalone | No – data lives only inside the running container  |

To add persistence to standalone, mount a volume in
`standalone/docker-compose.yml`:

```yaml
volumes:
  - /your/host/path:/var/lib/postgresql/data
```

---

## Quick reference

```bash
# Start & verify (compose)
cd database/postgres/script && bun upAndTest.ts

# Start & verify (standalone – builds image with docker build, runs with docker run)
cd database/postgres/script && bun upAndTest.ts standalone

# Tear down only
docker compose -f database/postgres/compose/docker-compose.yml down

# Tear down standalone
docker stop standalone-postgres && docker rm standalone-postgres

# Connect with psql (compose)
psql -h localhost -p 9999 -U test-compose-postgres_user -d test-compose-postgres_db

# Connect with psql (standalone)
psql -h localhost -p 9998 -U standalone-postgres_user -d standalone-postgres_db
```
