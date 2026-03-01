# Installing MongoDB 7 Community Edition on macOS

## Prerequisites

- macOS 11 (Big Sur) or later
- Homebrew package manager ([https://brew.sh](https://brew.sh))
- Xcode Command Line Tools (`xcode-select --install`)

## Install MongoDB

Add the MongoDB tap and install:

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

## Start the mongod Service

Start MongoDB as a background service:

```bash
brew services start mongodb-community@7.0
```

To stop the service later:

```bash
brew services stop mongodb-community@7.0
```

To check the service status:

```bash
brew services list | grep mongodb
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
