# Installing MongoDB 7 Community Edition on Linux

## Prerequisites

- Ubuntu 22.04/24.04, Debian 12, RHEL/CentOS 8+, or Amazon Linux 2023
- Root or sudo access
- `gnupg` and `curl` installed

The instructions below cover Ubuntu/Debian. For RHEL-based systems, see the official MongoDB documentation for `yum`/`dnf` equivalents.

## Install MongoDB (Ubuntu/Debian)

Import the MongoDB GPG key:

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

Add the repository (Ubuntu 22.04 example):

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

Install:

```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## Start the mongod Service

Enable and start MongoDB with systemd:

```bash
sudo systemctl enable mongod
sudo systemctl start mongod
```

Check the status:

```bash
sudo systemctl status mongod
```

To stop the service:

```bash
sudo systemctl stop mongod
```

MongoDB listens on port 27017 by default with no authentication.

## Verify the Connection

Open a shell and confirm the server is responding:

```bash
mongosh
```

You should see a prompt connected to `mongodb://localhost:27017`. Run a quick check:

```
db.runCommand({ ping: 1 })
```

A response of `{ ok: 1 }` confirms the server is running. Type `exit` to leave the shell.

## Run the Retold Harness with MongoDB

From the `retold-harness-management-tool` directory:

```bash
HARNESS_PROVIDER=mongodb npm start
```

The harness connects to localhost:27017 and uses the `bookstore` database by default. The database and its collections are created automatically from `Schema.json` on first run. No seed data is required.

## Environment Variable Overrides

Override the default connection settings with these environment variables:

| Variable           | Default     | Description              |
|--------------------|-------------|--------------------------|
| `MONGODB_HOST`     | `localhost` | MongoDB server hostname  |
| `MONGODB_PORT`     | `27017`     | MongoDB server port      |
| `MONGODB_DATABASE` | `bookstore` | Target database name     |

Example with custom settings:

```bash
HARNESS_PROVIDER=mongodb MONGODB_HOST=192.168.1.50 MONGODB_PORT=27018 MONGODB_DATABASE=mydb npm start
```

## Docker Alternative

If you prefer not to install MongoDB directly:

```bash
docker compose up mongodb -d
```

This starts a MongoDB container with the same default port and configuration.
