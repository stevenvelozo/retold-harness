# Installing Microsoft SQL Server on Linux

MSSQL 2022 can be installed directly on supported Linux distributions
(Ubuntu, RHEL, SLES) or run via Docker.

## Option 1: Native Installation (Ubuntu/Debian)

Import the Microsoft GPG key and repository:

```bash
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | \
  sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg

sudo add-apt-repository \
  "$(wget -qO- https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2022.list)"

sudo apt-get update
sudo apt-get install -y mssql-server
```

Run the setup to configure the SA password and choose the Developer edition:

```bash
sudo /opt/mssql/bin/mssql-conf setup
```

When prompted, select **Developer edition** (free, full-featured) and set the
SA password to `Retold1234567890!`.

Verify the service is running:

```bash
systemctl status mssql-server
```

Install the command-line tools:

```bash
sudo apt-get install -y mssql-tools18 unixodbc-dev
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
source ~/.bashrc
```

## Option 2: Docker

```bash
docker run -d \
  --name mssql-retold \
  -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=Retold1234567890!" \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

Or use the project's compose file:

```bash
docker compose up mssql -d
```

## Create the Database

For a native install or Docker, connect with `sqlcmd`:

```bash
sqlcmd -S localhost -U sa -P "Retold1234567890!" -C -Q \
  "CREATE DATABASE bookstore;"
```

If using Docker and `sqlcmd` is not installed on the host:

```bash
docker exec -it mssql-retold /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Retold1234567890!" -C -Q \
  "CREATE DATABASE bookstore;"
```

## Environment Variables

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

## Managing the Service

For native installs:

```bash
sudo systemctl stop mssql-server
sudo systemctl start mssql-server
sudo systemctl restart mssql-server
```

For Docker:

```bash
docker stop mssql-retold
docker start mssql-retold
```
