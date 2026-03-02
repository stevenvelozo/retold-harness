# API Reference

This section provides detailed documentation for the public classes and methods in retold-harness.

## Classes

### [RetoldHarness](api/retold-harness.md)

**Source:** `source/Retold-Harness.js`

Application entry point. Reads environment variables, selects a schema and database provider, initializes Fable, and chains the harness lifecycle. Not a class itself -- this is the top-level orchestration script that wires together the schema provider and provider configurator services.

---

### [MeadowProviderConfigurator](api/meadow-provider-configurator.md)

**Source:** `source/providers/Retold-Harness-Service-MeadowProviderConfigurator.js`

Base provider orchestrator that defines the harness lifecycle: connect to a database, initialize the schema, start the data service, apply behaviors, and serve the web UI. Concrete subclasses (SQLite, MySQL, MSSQL, PostgreSQL, MongoDB, DGraph, Solr) override `connectDatabase()` and `initializeSchema()` with provider-specific logic.

---

### [SchemaProvider](api/schema-provider.md)

**Source:** `source/schemas/Retold-Harness-Service-SchemaProvider.js`

Base schema provider that defines the contract for schema-specific operations: locating schema files, creating tables, seeding data, and injecting endpoint behaviors. Concrete subclasses (Bookstore, US Federal Data, Entertainment) implement these methods for their respective data models.

---

### [ProcessManager](api/process-manager.md)

**Source:** `source/management-tool/Service-ProcessManager.js`

Fable service that manages Docker containers and harness Node.js processes. Used by the terminal UI management tool to start, stop, and monitor database containers and harness instances across all configured providers. Also manages the consistency proxy for cross-provider testing.
