# Retold Harness

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A composable REST API harness for the Retold framework

Retold Harness brings together pluggable schemas and database providers into a running application with auto-generated CRUD endpoints, pre-loaded sample data, and a terminal-based management tool.  Pick a schema, pick a provider, and get a fully operational REST API backed by real data in seconds.

## Features

- **Composable Architecture** -- pluggable schema providers and database providers via Fable services
- **3 Data Schemas** -- Bookstore (8 entities, 10k+ records), US Federal Data, Entertainment
- **7 Database Providers** -- SQLite, MySQL, MSSQL, PostgreSQL, MongoDB, DGraph, Solr
- **Auto-Generated CRUD** -- every entity gets Create, Read, Reads, Update, Delete, Count, Schema, and New endpoints
- **Behavior Injection** -- post-operation hooks on endpoints (e.g., Author enrichment on Book reads)
- **Terminal Management Tool** -- TUI app built on blessed/pict-terminalui for managing Docker containers and harness processes
- **Consistency Proxy** -- launch a proxy to compare responses across multiple providers
- **Pre-Loaded Sample Data** -- 10,000+ book records with associated authors for realistic testing
- **Docker Support** -- containerized environments for each database provider
- **Environment-Driven** -- select schema and provider via `HARNESS_SCHEMA` and `HARNESS_PROVIDER` environment variables
- **SQLite Testing** -- in-memory test suite requires no external database
- **Fable Service Architecture** -- built on fable-serviceproviderbase for service injection

## Installation

```bash
npm install retold-harness
```

## Quick Start

### Start with Defaults (Bookstore + SQLite)

```bash
npm start
```

The REST API is now at `http://localhost:8086`.

### Start with a Specific Schema and Provider

```bash
HARNESS_SCHEMA=bookstore HARNESS_PROVIDER=mysql npm start
```

### Launch the Management Tool

```bash
npm run manage
```

### CLI Usage

```bash
# Default bookstore + sqlite
retold-harness

# Launch TUI management tool
retold-harness-management-tool
```

## Architecture

```
Retold Harness
  ├── Schema Provider (Bookstore / USFederalData / Entertainment)
  │     ├── Table Generation (DDL from Stricture)
  │     ├── Seed Data Loading
  │     └── Behavior Injection (e.g. Author enrichment)
  ├── Provider Configurator (SQLite / MySQL / MSSQL / PostgreSQL / MongoDB / DGraph / Solr)
  │     ├── Database Connection (via meadow-connection-*)
  │     ├── Schema Initialization
  │     └── Data Service Bootstrap
  ├── Retold Data Service
  │     ├── Orator + Restify (HTTP Server)
  │     ├── Meadow (DAL for each entity)
  │     └── Meadow Endpoints (REST Routes)
  └── Management Tool (Terminal UI)
        ├── Docker Container Management
        ├── Harness Process Launcher
        └── Consistency Proxy Control
```

## REST API Examples

### List the first 100 books

```
GET http://localhost:8086/1.0/Books/0/100
```

### Get a single book with authors

```
GET http://localhost:8086/1.0/Book/1
```

When fetching a single book, the response includes an `Authors` array populated via the behavior injection hook.  In the multi-record list, the array is not included because the hook is only on the singular Read endpoint.

### Filter authors by name

```
GET http://localhost:8086/1.0/Authors/FilteredTo/FBV~Name~LK~Susan%25/0/10
```

### Count books by genre

```
GET http://localhost:8086/1.0/Books/Count/FilteredTo/FBV~Genre~EQ~Science Fiction
```

## Data Model (Bookstore)

| Entity | Columns | Description |
|--------|---------|-------------|
| User | 8 | System user accounts |
| Book | 16 | Books with title, genre, ISBN, language, cover image |
| Author | 11 | Authors with name and optional user link |
| BookAuthorJoin | 4 | Many-to-many join between Books and Authors |
| BookPrice | 15 | Pricing periods with discount and coupon support |
| BookStore | 15 | Physical store locations with address |
| BookStoreInventory | 16 | Stock levels per book per store |
| Review | 13 | User reviews with text and rating |

## Docker Services

| Port | Service |
|------|---------|
| 8086 | REST API (SQLite) |
| 8087 | REST API (MySQL) |
| 8088 | REST API (MSSQL) |
| 8089 | REST API (PostgreSQL) |
| 8090 | REST API (MongoDB) |
| 8091 | REST API (DGraph) |
| 8092 | REST API (Solr) |
| 9090 | Consistency Proxy |

### Docker Quick Start

```bash
npm run docker-dev-build
npm run docker-dev-run
```

### Docker Shell Access

```bash
npm run docker-dev-shell
```

## Schemas

### Bookstore

The default schema with 8 entities and 10,000+ book records including authors, pricing, store inventory, and reviews.

```bash
npm run build-schema-bookstore
```

### US Federal Data

Federal government data sets compiled into a Stricture model.

```bash
npm run build-schema-us-federal-data
npm run ingest-federal-data
```

### Entertainment

Entertainment industry data with its own ingestion pipeline.

```bash
npm run build-schema-entertainment
npm run ingest-entertainment
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HARNESS_SCHEMA` | `bookstore` | Schema provider to load (`bookstore`, `us-federal-data`, `entertainment`) |
| `HARNESS_PROVIDER` | `sqlite` | Database provider to use (`sqlite`, `mysql`, `mssql`, `postgresql`, `mongodb`, `dgraph`, `solr`) |

## Testing

```bash
npm test
```

Tests use an in-memory SQLite provider and require no external database server.

For coverage:

```bash
npm run coverage
```

## Documentation

Detailed documentation is available in the `docs/` folder and can be served locally:

```bash
npx docsify-cli serve docs
```

## Related Packages

- [retold-harness-consistency-proxy](https://github.com/stevenvelozo/retold-harness-consistency-proxy) -- compare responses across providers
- [retold-data-service](https://github.com/stevenvelozo/retold-data-service) -- all-in-one data service
- [meadow](https://github.com/stevenvelozo/meadow) -- data access layer and ORM
- [meadow-endpoints](https://github.com/stevenvelozo/meadow-endpoints) -- automatic REST endpoint generation
- [foxhound](https://github.com/stevenvelozo/foxhound) -- query DSL for SQL generation
- [stricture](https://github.com/stevenvelozo/stricture) -- schema definition language
- [orator](https://github.com/stevenvelozo/orator) -- API server abstraction
- [fable](https://github.com/stevenvelozo/fable) -- service provider framework

## License

MIT
