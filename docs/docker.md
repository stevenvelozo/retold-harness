# Docker Setup

Retold Harness includes two Docker configurations: a full development environment with a browser-based IDE, and a lightweight service container.

## Development Environment

The development image includes MariaDB, Node.js, and Luxury Code (browser-based VS Code).

### Build and Run

```bash
npm run docker-dev-build
npm run docker-dev-run
```

### Ports

| Port | Service |
|------|---------|
| 8086 | REST API |
| 3306 (mapped to 31306) | MariaDB |
| 20001 | Luxury Code (VS Code) |

### Shell Access

```bash
npm run docker-dev-shell
```

## Service Container

A lightweight container that runs only the API server with MariaDB.

```bash
npm run docker-dev-service-build
npm run docker-dev-service-run
```

### Shell Access

```bash
npm run docker-dev-service-shell
```

## Manual MariaDB

If you prefer to run MariaDB separately:

```bash
docker run -d --name mariadb -p 3306:3306 \
  -e MARIADB_ROOT_PASSWORD=123456789 \
  -e MARIADB_DATABASE=bookstore \
  mariadb:latest
```

Then create the tables:

```bash
cat ./source/model/mysql_create/MeadowModel-CreateMySQLDatabase.mysql.sql \
  | docker exec -i mariadb mariadb -u root -p123456789 bookstore
```

To populate with sample data:

```bash
cat ./source/model/mysql_create/MeadowModel-PopulateDatabase.sql \
  | docker exec -i mariadb mariadb -u root -p123456789 bookstore
```

## Database Credentials

| Setting | Value |
|---------|-------|
| Host | `127.0.0.1` |
| Port | `3306` |
| User | `root` |
| Password | `123456789` |
| Database | `bookstore` |
