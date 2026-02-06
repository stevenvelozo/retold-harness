# Quick Start

## With Docker (Recommended)

The fastest way to get a running bookstore API with pre-loaded data:

```bash
git clone https://github.com/stevenvelozo/retold-harness
cd retold-harness
npm run docker-dev-build
npm run docker-dev-run
```

The API is now available at `http://localhost:8086`.

## Without Docker

If you have a MySQL or MariaDB server running locally:

### 1. Clone and install

```bash
git clone https://github.com/stevenvelozo/retold-harness
cd retold-harness
npm install
```

### 2. Create the database

```bash
docker run -d --name mariadb -p 3306:3306 \
  -e MARIADB_ROOT_PASSWORD=123456789 \
  -e MARIADB_DATABASE=bookstore \
  mariadb:latest
```

### 3. Create the tables

```bash
cat ./source/model/mysql_create/MeadowModel-CreateMySQLDatabase.mysql.sql \
  | docker exec -i mariadb mariadb -u root -p123456789 bookstore
```

### 4. Start the API

```bash
npm start
```

## Try It Out

Once the server is running, try these URLs:

| URL | Description |
|-----|-------------|
| `http://localhost:8086/1.0/Books/0/10` | First 10 books |
| `http://localhost:8086/1.0/Book/1` | Single book with Authors |
| `http://localhost:8086/1.0/Authors/0/10` | First 10 authors |
| `http://localhost:8086/1.0/Books/Count` | Total book count |
| `http://localhost:8086/1.0/Authors/FilteredTo/FBV~Name~LK~Susan%25/0/10` | Authors named Susan |
