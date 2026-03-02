# ProcessManager

**Source:** `source/management-tool/Service-ProcessManager.js`

## Class: `ProcessManager`

Extends `fable-serviceproviderbase`

Fable service that manages Docker containers and harness Node.js processes for each retold-harness database provider. Used by the terminal UI management tool to start, stop, and monitor harness instances. Also manages the retold-harness-consistency-proxy for cross-provider testing.

---

## Constructor

### `constructor(pFable, pOptions, pServiceHash)`

Creates a new ProcessManager instance.

**Parameters:**

- `pFable` {Fable} -- The Fable instance
- `pOptions` {object} -- Service options
- `pServiceHash` {string} -- Unique service hash

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `HarnessPath` | string | Resolved `..` from the source directory | Absolute path to the retold-harness root |

Sets `serviceType` to `'ProcessManager'`.

**Internal State:**

- `_HarnessProcesses` {object} -- Map of running harness child processes, keyed by provider
- `_HarnessLogs` {object} -- Map of log buffers, keyed by provider (capped at ~8000 characters)
- `_ProxyProcess` {ChildProcess|null} -- The running consistency proxy process
- `_ProxyPort` {number|null} -- The port the consistency proxy is listening on
- `_HarnessPath` {string} -- Resolved path to the retold-harness root
- `_DockerComposePath` {string} -- Path to `docker-compose.yml`

---

## Docker Management

### `hasDockerCompose()`

Check if the `docker-compose.yml` file exists at the expected path.

**Returns:** `{boolean}`

---

### `checkDockerContainer(pContainerName, fCallback)`

Check if a Docker container is currently running by inspecting its state.

**Parameters:**

- `pContainerName` {string} -- Docker container name to inspect
- `fCallback` {Function} -- Callback `(pError, pIsRunning)` where `pIsRunning` is a boolean

**Behavior:**

- Returns `false` if `pContainerName` is falsy
- Returns `false` if the `docker inspect` command fails (container does not exist)
- Returns `true` only if the container state is `'true'` (running)

---

### `startDocker(pServiceName, fCallback)`

Start a Docker service via `docker compose up -d`.

**Parameters:**

- `pServiceName` {string} -- The service name as defined in `docker-compose.yml`
- `fCallback` {Function} -- Callback `(pError, pOutput)` with combined stdout/stderr on success

**Behavior:**

- Returns an error if `docker-compose.yml` is not found
- Runs with a 60-second timeout
- Uses the harness root as the working directory

---

### `stopDocker(pServiceName, fCallback)`

Stop a Docker service via `docker compose stop`.

**Parameters:**

- `pServiceName` {string} -- The service name as defined in `docker-compose.yml`
- `fCallback` {Function} -- Callback `(pError, pOutput)` with combined stdout/stderr on success

**Behavior:**

- Returns an error if `docker-compose.yml` is not found
- Runs with a 30-second timeout

---

### `shellDocker(pContainerName, fCallback)`

Open an interactive shell into a running Docker container. Spawns `docker exec -it` with `stdio: 'inherit'`, which takes over the terminal.

**Parameters:**

- `pContainerName` {string} -- Docker container name
- `fCallback` {Function} -- Callback called when the shell session ends

**Behavior:**

- Uses `bash` as the shell command
- Uses `/bin/bash` for MSSQL containers (detected by container name containing `'mssql'`)
- Returns an error if no container name is specified

---

## Harness Process Management

### `launchHarness(pProviderKey, pPort, fCallback)`

Spawn a new harness Node.js process for the given provider with the appropriate environment variables.

**Parameters:**

- `pProviderKey` {string} -- Provider key (e.g. `"mysql"`, `"sqlite"`)
- `pPort` {number} -- Port for the API server
- `fCallback` {Function} -- Callback `(pError)` called immediately after the process is spawned

**Behavior:**

- Returns an error if a harness is already running for the given provider
- Sets `HARNESS_PROVIDER` and `PORT` environment variables on the child process
- Captures stdout and stderr to the provider's log buffer
- Cleans up internal state when the process exits

---

### `stopHarness(pProviderKey, fCallback)`

Stop a running harness process. Sends `SIGTERM` first, then `SIGKILL` after 3 seconds if the process has not exited.

**Parameters:**

- `pProviderKey` {string} -- Provider key
- `fCallback` {Function} -- Callback `(pError)` called when the process has exited

**Behavior:**

- Returns an error if no harness is running for the given provider
- Cleans up internal state after the process exits

---

### `isHarnessRunning(pProviderKey)`

Check if a harness process is currently running for a provider.

**Parameters:**

- `pProviderKey` {string} -- Provider key

**Returns:** `{boolean}`

---

### `getHarnessPort(pProviderKey)`

Get the assigned port for a running harness, as stored in `fable.AppData.Providers`.

**Parameters:**

- `pProviderKey` {string} -- Provider key

**Returns:** `{number|false}` -- The port number, or `false` if not found

---

### `stopAll(fCallback)`

Stop all running harness processes and the consistency proxy. Iterates through all tracked processes, stopping each one sequentially, then stops the proxy if running.

**Parameters:**

- `fCallback` {Function} -- Callback called when all processes have been stopped

---

## Log Management

### `getHarnessLog(pProviderKey)`

Get the most recent log output from a harness process. The log buffer is capped at approximately 8000 characters, retaining the most recent output.

**Parameters:**

- `pProviderKey` {string} -- Provider key

**Returns:** `{string}` -- Log text, or an empty string if no logs exist

---

### `clearHarnessLog(pProviderKey)`

Clear the log buffer for a provider.

**Parameters:**

- `pProviderKey` {string} -- Provider key

---

## Consistency Proxy Management

### `launchProxy(pRunningBackends, pProxyPort, fCallback)`

Launch the retold-harness-consistency-proxy, pointing it at all running harness backends.

**Parameters:**

- `pRunningBackends` {object} -- Map of `{ providerKey: port }` for all running backends
- `pProxyPort` {number} -- Port for the proxy to listen on
- `fCallback` {Function} -- Callback `(pError)` called after the proxy is spawned

**Behavior:**

- Returns an error if a proxy is already running
- Returns an error if the consistency proxy script is not found
- Passes backends as a comma-separated `providerKey:port` list via the `--backends` argument
- Captures proxy output to the `'_proxy'` log key

---

### `stopProxy(fCallback)`

Stop the running consistency proxy. Sends `SIGTERM` first, then `SIGKILL` after 3 seconds.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when the proxy has exited

**Behavior:**

- Returns an error if no proxy is running

---

### `isProxyRunning()`

Check if the consistency proxy is running.

**Returns:** `{boolean}`

---

### `getProxyPort()`

Get the port the consistency proxy is listening on.

**Returns:** `{number|null}` -- Port number, or `null` if the proxy is not running

---

## Documentation

### `readDocumentation(pProviderKey, pOS)`

Read a documentation markdown file for a specific provider and operating system.

**Parameters:**

- `pProviderKey` {string} -- Provider key (e.g. `"mysql"`, `"mssql"`)
- `pOS` {string} -- Operating system identifier: `"mac"`, `"linux"`, or `"windows"`

**Returns:** `{string}` -- The markdown content of the documentation file, or an error message if the file is not found

**File path pattern:** `source/management-tool/docs/{pProviderKey}/{pOS}.md`
