# Installing Microsoft SQL Server on Windows

SQL Server 2022 Developer or Express editions are available as free downloads
from Microsoft.

## Option 1: SQL Server Installer (Recommended)

1. Download **SQL Server 2022 Developer Edition** from
   [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads).
2. Run the installer and choose **Basic** or **Custom** installation.
3. During setup, select **Mixed Mode Authentication** and set the SA password
   to `Retold1234567890!`.
4. Complete the installation. The service starts automatically.

Install **SQL Server Management Studio (SSMS)** or the `sqlcmd` CLI for
database management:

- SSMS: [https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms](https://learn.microsoft.com/en-us/ssms/download-sql-server-management-studio-ssms)
- sqlcmd: included with SQL Server or available via `winget install Microsoft.SqlServer.SqlCmd`

## Option 2: Docker Desktop

If you prefer Docker, install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
and run:

```powershell
docker compose up mssql -d
```

Or manually:

```powershell
docker run -d `
  --name mssql-retold `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_SA_PASSWORD=Retold1234567890!" `
  -p 1433:1433 `
  mcr.microsoft.com/mssql/server:2022-latest
```

## Create the Database

Using `sqlcmd` (native install or added to PATH):

```powershell
sqlcmd -S localhost -U sa -P "Retold1234567890!" -C -Q "CREATE DATABASE bookstore;"
```

Using SSMS, connect to `localhost` with SA credentials and run:

```sql
CREATE DATABASE bookstore;
```

## Environment Variables

Set these in your terminal session before running the harness.

**PowerShell:**

```powershell
$env:MSSQL_HOST = "localhost"
$env:MSSQL_PORT = "1433"
$env:MSSQL_USER = "sa"
$env:MSSQL_PASSWORD = "Retold1234567890!"
$env:MSSQL_DATABASE = "bookstore"
```

**Command Prompt:**

```cmd
set MSSQL_HOST=localhost
set MSSQL_PORT=1433
set MSSQL_USER=sa
set MSSQL_PASSWORD=Retold1234567890!
set MSSQL_DATABASE=bookstore
```

## Run the Harness

```powershell
$env:HARNESS_PROVIDER = "mssql"; npm start
```

Or in Command Prompt:

```cmd
set HARNESS_PROVIDER=mssql && npm start
```

## Managing the Service

For native installs, use the Services app (`services.msc`) or PowerShell:

```powershell
Stop-Service MSSQLSERVER
Start-Service MSSQLSERVER
Restart-Service MSSQLSERVER
```

For Docker:

```powershell
docker stop mssql-retold
docker start mssql-retold
```
