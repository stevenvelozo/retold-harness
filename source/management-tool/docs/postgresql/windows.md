# Installing PostgreSQL 16 on Windows

## Install PostgreSQL

### Option A: Official Installer

Download the PostgreSQL 16 installer from https://www.postgresql.org/download/windows/ and run it.

During installation:
- Set the superuser password to `retold1234567890`
- Keep the default port `5432`
- Accept the default data directory
- Uncheck Stack Builder if you do not need additional tools

### Option B: Chocolatey

```powershell
choco install postgresql16 --params "/Password:retold1234567890 /Port:5432"
```

If you do not have Chocolatey installed, visit https://chocolatey.org/install first.

## Start the PostgreSQL Service

PostgreSQL runs as a Windows service and starts automatically after installation. Verify it is running:

```powershell
Get-Service -Name "postgresql*"
```

To start or restart the service manually:

```powershell
net start postgresql-x64-16
```

## Create the Database

Open a command prompt or PowerShell and run psql. If you used the installer, psql is located in `C:\Program Files\PostgreSQL\16\bin\`.

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

Enter the password `retold1234567890` when prompted, then create the database:

```sql
CREATE DATABASE bookstore;
\q
```

If you installed via Chocolatey and the password was not set during install, set it now:

```sql
ALTER USER postgres WITH PASSWORD 'retold1234567890';
```

## Verify the Connection

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -h localhost -U postgres -d bookstore -c "SELECT 1;"
```

You should see a single row returned after entering the password.

## Run the Harness with PostgreSQL

From the retold-harness-management-tool directory:

```powershell
$env:HARNESS_PROVIDER="postgresql"; npm start
```

Or in Command Prompt:

```cmd
set HARNESS_PROVIDER=postgresql && npm start
```

### Docker Alternative

If you prefer not to install PostgreSQL locally:

```powershell
docker compose up postgresql -d
```

## Environment Variable Overrides

The harness uses these defaults. Override any of them as needed:

| Variable         | Default           |
|------------------|-------------------|
| PGSQL_HOST       | localhost         |
| PGSQL_PORT       | 5432              |
| PGSQL_USER       | postgres          |
| PGSQL_PASSWORD   | retold1234567890  |
| PGSQL_DATABASE   | bookstore         |

Example with custom settings in PowerShell:

```powershell
$env:HARNESS_PROVIDER="postgresql"; $env:PGSQL_PORT="5433"; $env:PGSQL_DATABASE="mydb"; npm start
```

## Troubleshooting

- Add psql to your PATH: add `C:\Program Files\PostgreSQL\16\bin` to the system `Path` environment variable
- Check service status in Services (services.msc), look for `postgresql-x64-16`
- View logs in `C:\Program Files\PostgreSQL\16\data\log\`
- To stop the service: `net stop postgresql-x64-16`
