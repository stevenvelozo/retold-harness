# Installing MongoDB 7 Community Edition on Windows

## Prerequisites

- Windows 10 or Windows Server 2019 (or later)
- Administrator access
- PowerShell or Command Prompt

## Install MongoDB

1. Download the MongoDB 7.0 Community MSI installer from:
   [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

   Select **Windows x64** and **MSI** as the package type.

2. Run the MSI installer. Choose **Complete** installation when prompted.

3. On the **Service Configuration** screen:
   - Check **Install MongoDB as a Service**
   - Select **Run service as Network Service user**
   - Leave the default data and log directories as-is

4. Check **Install MongoDB Compass** if you want the GUI tool (optional).

5. Click **Install** and let the installer finish.

The installer adds MongoDB binaries to `C:\Program Files\MongoDB\Server\7.0\bin\` and registers `mongod` as a Windows service.

## Start the mongod Service

The MSI installer starts the service automatically. To manage it manually:

```powershell
# Check status
Get-Service MongoDB

# Start
Start-Service MongoDB

# Stop
Stop-Service MongoDB
```

Or use `services.msc` to find and manage the **MongoDB Server** service.

MongoDB listens on port 27017 by default with no authentication.

## Verify the Connection

Open PowerShell or Command Prompt and launch the shell:

```powershell
mongosh
```

If `mongosh` is not on your PATH, run it from:

```
"C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe"
```

You should see a prompt connected to `mongodb://localhost:27017`. Run a quick check:

```
db.runCommand({ ping: 1 })
```

A response of `{ ok: 1 }` confirms the server is running. Type `exit` to leave the shell.

## Run the Retold Harness with MongoDB

From the `retold-harness-management-tool` directory, set the environment variable and start:

**PowerShell:**

```powershell
$env:HARNESS_PROVIDER="mongodb"; npm start
```

**Command Prompt:**

```cmd
set HARNESS_PROVIDER=mongodb && npm start
```

The harness connects to localhost:27017 and uses the `bookstore` database by default. The database and its collections are created automatically from `Schema.json` on first run. No seed data is required.

## Environment Variable Overrides

Override the default connection settings with these environment variables:

| Variable           | Default     | Description              |
|--------------------|-------------|--------------------------|
| `MONGODB_HOST`     | `localhost` | MongoDB server hostname  |
| `MONGODB_PORT`     | `27017`     | MongoDB server port      |
| `MONGODB_DATABASE` | `bookstore` | Target database name     |

**PowerShell example with custom settings:**

```powershell
$env:HARNESS_PROVIDER="mongodb"; $env:MONGODB_HOST="192.168.1.50"; $env:MONGODB_PORT="27018"; $env:MONGODB_DATABASE="mydb"; npm start
```

## Docker Alternative

If you prefer not to install MongoDB directly (requires Docker Desktop):

```powershell
docker compose up mongodb -d
```

This starts a MongoDB container with the same default port and configuration.
