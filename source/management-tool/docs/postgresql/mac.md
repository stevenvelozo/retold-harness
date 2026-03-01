# Installing PostgreSQL 16 on macOS

## Install via Homebrew

```bash
brew install postgresql@16
```

If you do not have Homebrew installed, visit https://brew.sh first.

## Start the PostgreSQL Service

```bash
brew services start postgresql@16
```

Verify the service is running:

```bash
brew services list | grep postgresql
```

## Set the Password and Create the Database

Connect to the default `postgres` database as the superuser:

```bash
psql postgres
```

Set the password for the `postgres` user and create the `bookstore` database:

```sql
ALTER USER postgres WITH PASSWORD 'retold1234567890';
CREATE DATABASE bookstore;
\q
```

## Verify the Connection

```bash
psql -h localhost -U postgres -d bookstore -c "SELECT 1;"
```

When prompted, enter the password `retold1234567890`. You should see a single row returned.

To connect without a password prompt, you can set the environment variable:

```bash
PGPASSWORD=retold1234567890 psql -h localhost -U postgres -d bookstore -c "SELECT 1;"
```

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

- If `psql` is not on your PATH, add it: `echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc`
- To stop the service: `brew services stop postgresql@16`
- To view server logs: `tail -f /opt/homebrew/var/log/postgresql@16.log`
- To reset everything: `brew services stop postgresql@16 && brew reinstall postgresql@16`
