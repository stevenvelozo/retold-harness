# Installing DGraph on Windows

> Docker is strongly recommended for running DGraph on Windows. Native Windows
> installation is not officially supported by DGraph and can be unreliable. If
> you just need DGraph running quickly, skip to the Docker section at the bottom.

## Local Installation via WSL2

DGraph does not provide a native Windows binary. The recommended local approach
is to use Windows Subsystem for Linux (WSL2).

### 1. Install WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
```

Restart your machine if prompted, then open the Ubuntu terminal that WSL installs.

### 2. Install DGraph inside WSL2

From the WSL2 Ubuntu terminal:

```bash
curl https://get.dgraph.io -sSf | bash
```

This installs the `dgraph` binary into `/usr/local/bin` within your WSL2
environment.

## Running DGraph Standalone (WSL2)

DGraph requires two processes: **Zero** (cluster coordinator) and **Alpha**
(database server).

Open two WSL2 terminal windows:

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

Ports are forwarded from WSL2 to Windows automatically, so you can access
DGraph from your Windows browser or tools at `localhost:8080`.

## Verifying the Connection

From PowerShell, WSL2, or a browser:

```bash
curl http://localhost:8080/health
```

A successful response returns JSON with `"status":"healthy"`. If the command
hangs or returns a connection error, confirm both Zero and Alpha are running
inside WSL2.

## Running the Retold Harness with DGraph

From the `retold-harness-management-tool` directory (in WSL2 or PowerShell):

```bash
set DGRAPH_HOST=localhost
set DGRAPH_PORT=8080
set HARNESS_PROVIDER=dgraph
npm start
```

Or in WSL2 / Git Bash:

```bash
export DGRAPH_HOST=localhost
export DGRAPH_PORT=8080
HARNESS_PROVIDER=dgraph npm start
```

The schema (predicates and types) is created automatically from `Schema.json` --
there is no seed data to import.

## Docker (Recommended)

The simplest way to run DGraph on Windows. Requires Docker Desktop for Windows.

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
