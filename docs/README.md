# Retold Harness

A composable REST API harness for the [Retold](https://github.com/stevenvelozo/retold) framework. It combines pluggable schemas and database providers into a running application with auto-generated CRUD endpoints, pre-loaded sample data, and a terminal-based management tool.

## What It Does

Retold Harness brings together several Retold modules into a running application:

- **[Retold Data Service](https://fable-retold.github.io/retold-data-service/)** orchestrates the stack
- **[Meadow](https://fable-retold.github.io/meadow/)** provides the data access layer
- **[Meadow Endpoints](https://fable-retold.github.io/meadow-endpoints/)** generates REST routes
- **[Orator](https://fable-retold.github.io/orator/)** serves the HTTP API
- **[Stricture](https://fable-retold.github.io/stricture/)** defines the schema

## Features

- **Composable Architecture** -- Pluggable schema providers and database providers via Fable services
- **3 Data Schemas** -- Bookstore (8 entities, 10k+ records), US Federal Data, Entertainment
- **7 Database Providers** -- SQLite, MySQL, MSSQL, PostgreSQL, MongoDB, DGraph, Solr
- **Auto-Generated CRUD** -- Every entity gets Create, Read, Reads, Update, Delete, Count, Schema, and New endpoints
- **Behavior Injection** -- Post-operation hooks on endpoints for cross-cutting concerns
- **Terminal Management Tool** -- TUI app for managing Docker containers and harness processes
- **Consistency Proxy** -- Compare responses across multiple database providers
- **Pre-Loaded Data** -- 10,000+ book records with associated authors for realistic testing
- **Docker Containerized** -- Each database provider runs in its own Docker container
- **Environment-Driven** -- Select schema and provider via environment variables

## Related Packages

- [retold-harness-consistency-proxy](https://fable-retold.github.io/retold-harness-consistency-proxy/) -- Cross-provider response comparison
- [retold-data-service](https://fable-retold.github.io/retold-data-service/) -- All-in-one data service
- [meadow](https://fable-retold.github.io/meadow/) -- Data access layer
- [meadow-endpoints](https://fable-retold.github.io/meadow-endpoints/) -- REST endpoint generation
- [foxhound](https://fable-retold.github.io/foxhound/) -- Query DSL
- [stricture](https://fable-retold.github.io/stricture/) -- Schema definition language
- [orator](https://fable-retold.github.io/orator/) -- API server abstraction
- [fable](https://fable-retold.github.io/fable/) -- Service provider framework
