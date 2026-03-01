# Installing Apache Solr 9 on Windows

## Prerequisites

Solr requires Java JDK 11 or later. Download and install a JDK if you do not have one:

- Adoptium Temurin: https://adoptium.net/ (recommended)
- Oracle JDK: https://www.oracle.com/java/technologies/downloads/

During installation, ensure the option to set `JAVA_HOME` is checked.

Verify Java is available:

```powershell
java -version
```

If `java` is not recognized, set `JAVA_HOME` manually. In PowerShell:

```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17", "User")
```

Restart your terminal after setting environment variables.

## Download and Install Solr

1. Download the Solr 9 zip from https://solr.apache.org/downloads.html
2. Extract the zip to a permanent location, for example `C:\solr\solr-9.7.0`

Add the Solr bin directory to your PATH or reference it directly in commands below.

## Start Solr

Open PowerShell and run:

```powershell
C:\solr\solr-9.7.0\bin\solr.cmd start
```

Verify Solr is running by visiting http://localhost:8983/solr/ in your browser. You should see the Solr Admin UI.

## Create the Bookstore Core

```powershell
C:\solr\solr-9.7.0\bin\solr.cmd create -c bookstore
```

Confirm the core exists by opening http://localhost:8983/solr/#/~cores in your browser. You should see `bookstore` listed.

No seed data is needed. The schema (field definitions) is created automatically from Schema.json when the harness starts.

## Run the Harness with Solr

From the retold-harness-management-tool directory in PowerShell:

```powershell
$env:HARNESS_PROVIDER="solr"; npm start
```

Or in Command Prompt:

```cmd
set HARNESS_PROVIDER=solr && npm start
```

### Docker Alternative

If you prefer not to install Solr locally (requires Docker Desktop):

```powershell
docker compose up solr -d
```

This starts the `solr:9` image and runs `solr-precreate bookstore` to create the core automatically.

## Environment Variable Overrides

The harness uses these defaults. Override any of them as needed:

| Variable    | Default     |
|-------------|-------------|
| SOLR_HOST   | localhost   |
| SOLR_PORT   | 8983        |
| SOLR_CORE   | bookstore   |

Example with custom settings in PowerShell:

```powershell
$env:HARNESS_PROVIDER="solr"; $env:SOLR_PORT="8984"; $env:SOLR_CORE="mycore"; npm start
```

## Troubleshooting

- To stop Solr: `C:\solr\solr-9.7.0\bin\solr.cmd stop -all`
- To delete a core and start over: `C:\solr\solr-9.7.0\bin\solr.cmd delete -c bookstore`
- If port 8983 is already in use: `C:\solr\solr-9.7.0\bin\solr.cmd start -p 8984`
- Check logs in `C:\solr\solr-9.7.0\server\logs\`
