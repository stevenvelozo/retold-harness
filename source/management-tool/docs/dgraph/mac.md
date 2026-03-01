# Installing DGraph on macOS

> Docker is strongly recommended for running DGraph locally. Local installation
> can be complex and varies across macOS versions. If you just need DGraph
> running quickly, skip to the Docker section at the bottom.

## Local Installation

### Using the install script

```bash
curl https://get.dgraph.io -sSf | bash
```

This installs the `dgraph` binary into `/usr/local/bin`. You may need to grant
permissions in System Settings > Privacy & Security if macOS blocks the binary.

### Using Homebrew (if available)

```bash
brew install dgraph
```

## Running DGraph Standalone

DGraph requires two processes: **Zero** (cluster coordinator) and **Alpha**
(database server).

Open two terminal windows:

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

The simplest way to run DGraph on macOS:

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
