# Installing DGraph on Linux

> Docker is strongly recommended for running DGraph locally. Local installation
> can be complex depending on your distribution. If you just need DGraph running
> quickly, skip to the Docker section at the bottom.

## Local Installation

### Using the install script

```bash
curl https://get.dgraph.io -sSf | bash
```

This installs the `dgraph` binary into `/usr/local/bin`. The script supports
most major distributions (Ubuntu, Debian, CentOS, Fedora, etc.). You may need
to run the script with `sudo` if your user does not have write access to
`/usr/local/bin`.

```bash
curl https://get.dgraph.io -sSf | sudo bash
```

## Running DGraph Standalone

DGraph requires two processes: **Zero** (cluster coordinator) and **Alpha**
(database server).

Open two terminal windows (or use `&` / `tmux` / `screen`):

**Terminal 1 -- Start DGraph Zero:**

```bash
dgraph zero
```

**Terminal 2 -- Start DGraph Alpha:**

```bash
dgraph alpha --security whitelist=0.0.0.0/0
```

The `--security whitelist` flag allows connections from any IP, which is
appropriate for local development. Do not use this in production.

- HTTP API: `http://localhost:8080`
- gRPC: `localhost:9080`

### Running as background processes

If you prefer a single terminal:

```bash
dgraph zero > /dev/null 2>&1 &
sleep 5
dgraph alpha --security whitelist=0.0.0.0/0 > /dev/null 2>&1 &
```

Wait a few seconds after starting Zero before starting Alpha.

## Verifying the Connection

```bash
curl http://localhost:8080/health
```

A successful response returns JSON with `"status":"healthy"`. If the command
hangs or returns a connection error, confirm both Zero and Alpha are running.

## Running the Retold Harness with DGraph

From the `retold-harness-management-tool` directory:

```bash
export DGRAPH_HOST=localhost
export DGRAPH_PORT=8080
HARNESS_PROVIDER=dgraph npm start
```

The schema (predicates and types) is created automatically from `Schema.json` --
there is no seed data to import.

## Docker (Recommended)

The simplest way to run DGraph on Linux:

```bash
docker compose up dgraph -d
```

This pulls `dgraph/standalone:latest` and exposes ports 8080 (HTTP) and 9080
(gRPC). No additional configuration is needed. DGraph has no authentication
enabled by default.

To stop:

```bash
docker compose down dgraph
```
