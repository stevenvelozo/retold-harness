# Installing Microsoft SQL Server on macOS

Microsoft SQL Server does not run natively on macOS. The recommended approach
is to run MSSQL 2022 via Docker Desktop.

## Prerequisites

- [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) installed and running

> **Apple Silicon note:** The official MSSQL image is linux/amd64 only. Docker
> Desktop will emulate it via Rosetta. If you experience issues, consider using
> the Azure SQL Edge image (`mcr.microsoft.com/azure-sql-edge:latest`) which
> has native arm64 support, though it lacks some SQL Server features.

## Option 1: Docker Compose (Recommended)

From the project root, start the pre-configured MSSQL container:

```bash
docker compose up mssql -d
```

This pulls `mcr.microsoft.com/mssql/server:2022-latest` and starts it with
the default credentials.

## Option 2: Docker Run

```bash
docker run -d \
  --name mssql-retold \
  -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=Retold1234567890!" \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

Verify the container is running:

```bash
docker ps --filter name=mssql-retold
```

## Create the Database

Connect using the `sqlcmd` utility inside the container:

```bash
docker exec -it mssql-retold /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Retold1234567890!" -C -Q \
  "CREATE DATABASE bookstore;"
```

Confirm the database exists:

```bash
docker exec -it mssql-retold /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Retold1234567890!" -C -Q \
  "SELECT name FROM sys.databases WHERE name = 'bookstore';"
```

## Environment Variables

Set these before running the harness:

```bash
export MSSQL_HOST=localhost
export MSSQL_PORT=1433
export MSSQL_USER=sa
export MSSQL_PASSWORD="Retold1234567890!"
export MSSQL_DATABASE=bookstore
```

## Run the Harness

```bash
HARNESS_PROVIDER=mssql npm start
```

## Stopping the Container

```bash
docker stop mssql-retold
docker start mssql-retold   # restart later without losing data
```

To remove the container and its data entirely:

```bash
docker rm -f mssql-retold
```
