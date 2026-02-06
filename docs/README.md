# Retold Harness

A self-contained REST API harness for the [Retold](https://github.com/stevenvelozo/retold) framework.  It serves a complete bookstore data model with auto-generated CRUD endpoints, pre-loaded sample data, and a containerized development environment.

## What It Does

Retold Harness brings together several Retold modules into a running application:

- **[Retold Data Service](https://github.com/stevenvelozo/retold-data-service)** orchestrates the stack
- **[Meadow](https://github.com/stevenvelozo/meadow)** provides the data access layer
- **[Meadow Endpoints](https://github.com/stevenvelozo/meadow-endpoints)** generates REST routes
- **[Orator](https://github.com/stevenvelozo/orator)** serves the HTTP API
- **[Stricture](https://github.com/stevenvelozo/stricture)** defines the schema

## Features

- **8-Entity Bookstore Model** -- Users, Books, Authors, Joins, Prices, Stores, Inventory, and Reviews
- **Auto-Generated CRUD** -- Every entity gets Create, Read, Reads, Update, Delete, Count, Schema, and New endpoints
- **Author Enrichment** -- Single Book reads are enriched with related Author data via behavior injection
- **Pre-Loaded Data** -- 10,000+ book records with associated authors for realistic testing
- **Docker Containerized** -- MariaDB database and API server in a single container
- **Luxury Code IDE** -- Browser-based VS Code for in-container development

## Architecture

```
Retold Harness
  ├── Retold Data Service
  │     ├── Orator + Restify (HTTP Server, port 8086)
  │     ├── Meadow (DAL for each entity)
  │     │     └── Provider (MySQL / SQLite)
  │     └── Meadow Endpoints (REST Routes)
  │           └── Behavior Injection (Author enrichment)
  ├── Data Model (8 entities from Stricture DDL)
  └── Docker Environment
        ├── MariaDB (pre-loaded bookstore database)
        └── Luxury Code (browser VS Code, port 20001)
```

## Related Packages

- [retold-data-service](https://github.com/stevenvelozo/retold-data-service) -- All-in-one data service
- [meadow](https://github.com/stevenvelozo/meadow) -- Data access layer
- [meadow-endpoints](https://github.com/stevenvelozo/meadow-endpoints) -- REST endpoint generation
- [foxhound](https://github.com/stevenvelozo/foxhound) -- Query DSL
- [stricture](https://github.com/stevenvelozo/stricture) -- Schema definition language
- [orator](https://github.com/stevenvelozo/orator) -- API server abstraction
- [fable](https://github.com/stevenvelozo/fable) -- Service provider framework
