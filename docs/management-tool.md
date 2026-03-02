# Management Tool

## Overview

The management tool is a terminal UI application built on `blessed` and `pict-terminalui`. It provides a dashboard for managing Docker containers and harness processes across all 7 database providers from a single interface. You can start and stop Docker containers, launch and halt harness instances, open interactive shells into containers, view live logs, toggle a consistency proxy, and read per-provider documentation -- all without leaving the terminal.

## Launching

```bash
# Via npm script
npm run manage

# Via the installed binary
retold-harness-management-tool

# With an explicit harness path
retold-harness-management-tool --harness-path /path/to/retold-harness
```

The management tool resolves the retold-harness directory using a priority chain:

1. `--harness-path` (or `--path`) CLI argument
2. Current working directory, if it contains `source/Retold-Harness.js`
3. A `retold-harness/` child of the current working directory
4. The parent of the management tool's own source directory

If none of these resolve, the tool starts in a degraded mode and displays a warning in the status bar.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `d` | Start Docker container for selected provider |
| `s` | Stop Docker container for selected provider |
| `r` | Run harness instance for selected provider |
| `h` | Stop harness instance for selected provider |
| `p` | Toggle consistency proxy on/off |
| `x` | Shell into Docker container |
| `l` | View harness logs |
| `i` | View provider documentation |
| `1` | Switch documentation to macOS |
| `2` | Switch documentation to Linux |
| `3` | Switch documentation to Windows |
| Up/Down | Navigate provider list |
| Enter | Show detail panel for selected provider |
| Tab | Cycle focus between provider list and right panel |
| `q` | Quit (stops all running processes) |

## Dashboard Layout

The terminal is divided into four regions:

```
+-------------------------------------------------------+
|  Header (3 lines)                                      |
|  App title, version, keyboard shortcut summary         |
+-------------------+-----------------------------------+
|  Provider List    |  Right Panel                       |
|  (35% width)      |  (65% width)                       |
|                   |                                    |
|  SQLite    [-H]   |  Detail view (default)             |
|  MySQL     [DH]   |  Log view (press l)                |
|  MSSQL     [DH]   |  Docs view (press i)               |
|  PostgreSQL[DH]   |                                    |
|  MongoDB   [DH]   |                                    |
|  DGraph    [DH]   |                                    |
|  Solr      [DH]   |                                    |
+-------------------+-----------------------------------+
|  Status Bar (1 line)                                   |
+-------------------------------------------------------+
```

### Provider List

The left panel shows all 7 providers with status indicators:

- **D** (Docker): Green when the Docker container is running, red when stopped, gray dash when the provider is local-only (SQLite).
- **H** (Harness): Green when the harness process is running, red when stopped.

Each entry also shows the provider's default port number. The currently selected provider is highlighted.

### Right Panel

The right panel shows one of three views depending on the active route:

- **Detail** -- Provider status summary including Docker state, harness state, assigned port, and mode.
- **Log** -- Live output from the selected provider's harness process (stdout and stderr), capped at 8000 characters.
- **Docs** -- OS-specific setup and usage documentation for the selected provider. Switch between macOS, Linux, and Windows docs with the `1`, `2`, and `3` keys.

### Status Bar

A single-line bar at the bottom of the screen showing the most recent status message (e.g. "Starting Docker for MySQL...", "Harness running for PostgreSQL on port 8088").

## Provider States

Each provider tracks three independent states:

### Docker State

| State | Meaning |
|-------|---------|
| Running | The Docker container is running (verified via `docker inspect`) |
| Stopped | The Docker container exists but is not running |
| N/A | The provider is local-only and does not use Docker (SQLite) |
| Unknown | Status has not been checked yet |

### Harness State

| State | Meaning |
|-------|---------|
| Running | A Node.js harness process is active for this provider |
| Stopped | No harness process is running |

### Proxy State

The consistency proxy is a global state (not per-provider):

| State | Meaning |
|-------|---------|
| Running | The proxy is active, forwarding requests to multiple running harness backends |
| Stopped | No proxy is running |

The proxy requires at least 2 running harness instances. It listens on port 9090 by default and distributes requests across all running backends for consistency testing.

## Process Manager

The `ProcessManager` is a Fable service (`source/management-tool/Service-ProcessManager.js`) that handles all subprocess management. It is registered with Pict's service manager during the management tool's `onAfterInitializeAsync` lifecycle.

### Capabilities

| Method | Purpose |
|--------|---------|
| `checkDockerContainer(pContainerName, fCallback)` | Check if a Docker container is running via `docker inspect` |
| `startDocker(pServiceName, fCallback)` | Start a Docker service via `docker compose up -d` |
| `stopDocker(pServiceName, fCallback)` | Stop a Docker service via `docker compose stop` |
| `shellDocker(pContainerName, fCallback)` | Open an interactive bash shell into a running container |
| `launchHarness(pProviderKey, pPort, fCallback)` | Spawn a harness Node.js process with the given provider and port |
| `stopHarness(pProviderKey, fCallback)` | Kill a running harness process (SIGTERM, then SIGKILL after 3 seconds) |
| `isHarnessRunning(pProviderKey)` | Check if a harness process is active for a provider |
| `launchProxy(pRunningBackends, pProxyPort, fCallback)` | Start the consistency proxy pointing at running backends |
| `stopProxy(fCallback)` | Stop the consistency proxy |
| `isProxyRunning()` | Check if the consistency proxy is active |
| `stopAll(fCallback)` | Stop all running harness processes and the proxy (used during quit) |
| `getHarnessLog(pProviderKey)` | Get the log buffer for a provider's harness process |
| `readDocumentation(pProviderKey, pOS)` | Read a markdown documentation file for a provider and OS |

### Docker Compose

The ProcessManager uses `docker compose` (V2 syntax) with the `docker-compose.yml` file at the root of the retold-harness directory. Each database provider has a corresponding service name in the compose file.

### Port Assignment

Harness instances are assigned sequential ports starting at 8086:

| Provider | Port |
|----------|------|
| SQLite | 8086 |
| MySQL | 8087 |
| MSSQL | 8088 |
| PostgreSQL | 8089 |
| MongoDB | 8090 |
| DGraph | 8091 |
| Solr | 8092 |

### Status Polling

The management tool polls all provider statuses every 5 seconds. Docker container states are checked via `docker inspect` and harness process states are checked by looking up the child process in the ProcessManager's internal map.

### Log Buffer

Each harness process's stdout and stderr output is captured into a ring buffer capped at 8000 characters. The log view displays this buffer and updates on each render cycle.

## Views

The management tool uses Pict's view system with 7 registered views:

| View | Purpose |
|------|---------|
| Layout | Root layout that coordinates all other views |
| Header | Top bar with application title and keyboard shortcut hints |
| Dashboard | Initial view (renders the Detail view for the first provider) |
| Detail | Provider status detail in the right panel |
| Log | Harness process log output in the right panel |
| Docs | OS-specific provider documentation in the right panel |
| StatusBar | Bottom status message bar |

## Provider Definitions

Static metadata for all providers is defined in `source/management-tool/Provider-Definitions.js`. Each entry includes:

| Property | Description |
|----------|-------------|
| `Key` | Provider key (e.g. `sqlite`, `mysql`) |
| `Label` | Display name (e.g. `SQLite`, `MySQL`) |
| `DockerService` | Service name in docker-compose.yml, or `false` for local-only |
| `ContainerName` | Docker container name, or `false` for local-only |
| `DefaultPort` | Default database server port, or `N/A` for SQLite |
| `DockerImage` | Docker image identifier |
| `LocalOnly` | `true` if no Docker container is needed |
| `HasSeedData` | `true` if the provider has pre-built seed data |
| `Description` | Human-readable description of the database engine |
