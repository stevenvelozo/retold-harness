# Installing PostgreSQL 16 on Linux

## Install PostgreSQL

### Debian / Ubuntu (apt)

Add the official PostgreSQL repository and install:

```bash
sudo apt install -y gnupg2
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update
sudo apt install -y postgresql-16
```

### Fedora / RHEL / CentOS (dnf)

```bash
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/F-$(rpm -E %fedora)-x86_64/pgdg-fedora-repo-latest.noarch.rpm
sudo dnf install -y postgresql16-server postgresql16
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb
```

## Start the PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Verify the service is running:

```bash
sudo systemctl status postgresql
```

## Set the Password and Create the Database

Switch to the `postgres` system user and open psql:

```bash
sudo -u postgres psql
```

Set the password and create the `bookstore` database:

```sql
ALTER USER postgres WITH PASSWORD 'retold1234567890';
CREATE DATABASE bookstore;
\q
```

### Enable Password Authentication

Edit `pg_hba.conf` to allow password connections on localhost. The file location depends on your distribution:

- Debian/Ubuntu: `/etc/postgresql/16/main/pg_hba.conf`
- Fedora/RHEL: `/var/lib/pgsql/16/data/pg_hba.conf`

Change the local and host lines for `127.0.0.1/32` from `peer` or `ident` to `md5`:

```
# IPv4 local connections:
host    all    all    127.0.0.1/32    md5
```

Then restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Verify the Connection

```bash
psql -h localhost -U postgres -d bookstore -c "SELECT 1;"
```

Enter the password `retold1234567890` when prompted. You should see a single row returned.

## Run the Harness with PostgreSQL

From the retold-harness-management-tool directory:

```bash
HARNESS_PROVIDER=postgresql npm start
```

### Docker Alternative

If you prefer not to install PostgreSQL locally:

```bash
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

Example with custom settings:

```bash
HARNESS_PROVIDER=postgresql PGSQL_PORT=5433 PGSQL_DATABASE=mydb npm start
```

## Troubleshooting

- Check logs: `sudo journalctl -u postgresql`
- If the port is in use: `sudo ss -tlnp | grep 5432`
- To stop the service: `sudo systemctl stop postgresql`
