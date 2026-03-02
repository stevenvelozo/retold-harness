# Provider Configurators

## Overview

Provider configurators handle the database-specific mechanics of connecting, creating tables, and seeding data. Each configurator wraps a `meadow-connection-*` module and knows how to translate the schema provider's abstract operations into provider-specific calls.

## MeadowProviderConfigurator Base Class

**File:** `source/providers/Retold-Harness-Service-MeadowProviderConfigurator.js`

The base class extends `fable-serviceproviderbase` and orchestrates the full harness lifecycle. Concrete subclasses override the database-specific methods while inheriting the shared orchestration logic.

```javascript
const libFableServiceProviderBase = require('fable-serviceproviderbase');

class RetoldHarnessMeadowProviderConfigurator extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'MeadowProviderConfigurator';
	}
}
```

### Service Type

All provider configurators must set `this.serviceType = 'MeadowProviderConfigurator'`. This is the key used by Fable's service manager to register and look up the configurator.

### Abstract Methods

These methods must be overridden by every concrete provider:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `connectDatabase(fCallback)` | `(function) => void` | Register the `meadow-connection-*` service and open a connection to the database engine |
| `initializeSchema(fCallback)` | `(function) => void` | Get the database handle and pass it to the schema provider's `generateTables()` and `seedData()` |

### Implemented Methods

These methods have working implementations in the base class and are shared across all providers:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `initializeDataService(fCallback)` | `(function) => void` | Creates a `RetoldDataService` instance using options from the schema provider. Registers Meadow DALs and MeadowEndpoints for all entities in `Schema.json`. |
| `applyBehaviors(fCallback)` | `(function) => void` | Delegates to the schema provider's `applyBehaviors()` method to install endpoint behavior hooks. |
| `serveWebUI(fCallback)` | `(function) => void` | Reads `source/web/index.html` and registers a GET handler at `/` on the Orator HTTP server. |
| `initializeHarness(fCallback)` | `(function) => void` | Main entry point. Chains all lifecycle stages via Anticipate in order: `connectDatabase` -> `initializeSchema` -> `initializeDataService` -> `applyBehaviors` -> `serveWebUI` -> Ready. |

### Constructor Options

Concrete providers set two properties on `this.options` in their constructor that are used by `initializeDataService()`:

| Property | Example | Purpose |
|----------|---------|---------|
| `StorageProvider` | `"SQLite"` | The storage provider name passed to RetoldDataService |
| `StorageProviderModule` | `"meadow-connection-sqlite"` | The npm module name passed to RetoldDataService |

## Available Providers

| Provider | Module | Docker Container | Default Port | Local Only |
|----------|--------|-----------------|--------------|------------|
| SQLite | meadow-connection-sqlite | N/A | N/A | Yes |
| MySQL | meadow-connection-mysql | retold-harness-mysql | 3306 | No |
| MSSQL | meadow-connection-mssql | retold-harness-mssql | 1433 | No |
| PostgreSQL | meadow-connection-postgresql | retold-harness-postgresql | 5432 | No |
| MongoDB | meadow-connection-mongodb | retold-harness-mongodb | 27017 | No |
| DGraph | meadow-connection-dgraph | retold-harness-dgraph | 8080 | No |
| Solr | meadow-connection-solr | retold-harness-solr | 8983 | No |

### SQLite

**File:** `source/providers/Retold-Harness-Service-Provider-SQLite.js`
**Key:** `sqlite`

The simplest provider. SQLite is file-based and requires no server. The `connectDatabase()` method ensures the data directory exists, registers `MeadowSQLiteProvider`, and calls `connectAsync()`. The `initializeSchema()` method passes the raw `better-sqlite3` database handle (`this.fable.MeadowSQLiteProvider.db`) to the schema provider.

### MySQL

**File:** `source/providers/Retold-Harness-Service-Provider-MySQL.js`
**Key:** `mysql`

Connects via `meadow-connection-mysql` with a connection pool. The `initializeSchema()` method uses the connection module's `createTables()` method to generate DDL from `Schema.json`, then checks for existing data with the schema provider's `getSeedCheckQuery()` before executing seed SQL statements sequentially through the pool.

### MSSQL

**File:** `source/providers/Retold-Harness-Service-Provider-MSSQL.js`
**Key:** `mssql`

Connects via `meadow-connection-mssql` to Microsoft SQL Server. Docker images use `mcr.microsoft.com/mssql/server:2022-latest`.

### PostgreSQL

**File:** `source/providers/Retold-Harness-Service-Provider-PostgreSQL.js`
**Key:** `postgresql`

Connects via `meadow-connection-postgresql` with a connection pool. Docker images use `postgres:16`.

### MongoDB

**File:** `source/providers/Retold-Harness-Service-Provider-MongoDB.js`
**Key:** `mongodb`

Connects via `meadow-connection-mongodb` to a MongoDB server. This is a document database, so table creation works differently than SQL providers. Docker images use `mongo:7`.

### DGraph

**File:** `source/providers/Retold-Harness-Service-Provider-DGraph.js`
**Key:** `dgraph`

Connects via `meadow-connection-dgraph` to DGraph's graph database. Docker images use `dgraph/standalone:latest`.

### Solr

**File:** `source/providers/Retold-Harness-Service-Provider-Solr.js`
**Key:** `solr`

Connects via `meadow-connection-solr` to Apache Solr's search platform. Docker images use `solr:9`.

## Provider Lifecycle

Each provider implements the same two-phase lifecycle within the harness initialization chain:

### Phase 1: connectDatabase

1. Register the `meadow-connection-*` module as a Fable service using `fable.serviceManager.addServiceType()`.
2. Instantiate the service provider via `fable.serviceManager.instantiateServiceProvider()`.
3. Call `connectAsync()` on the connection provider to establish the database connection.
4. Call the callback on success, or pass an error on failure.

Example from the SQLite provider:

```javascript
connectDatabase(fCallback)
{
	let tmpSQLiteFilePath = this.fable.settings.SQLite && this.fable.settings.SQLite.SQLiteFilePath;

	let tmpDataDir = require('path').dirname(tmpSQLiteFilePath);
	if (!require('fs').existsSync(tmpDataDir))
	{
		require('fs').mkdirSync(tmpDataDir, { recursive: true });
	}

	this.fable.serviceManager.addServiceType('MeadowSQLiteProvider', require('meadow-connection-sqlite'));
	this.fable.serviceManager.instantiateServiceProvider('MeadowSQLiteProvider');

	this.fable.MeadowSQLiteProvider.connectAsync(
		(pError) =>
		{
			if (pError)
			{
				this.log.error(`SQLite connection error: ${pError}`);
				return fCallback(pError);
			}
			this.log.info('SQLite database connected.');
			return fCallback();
		});
}
```

### Phase 2: initializeSchema

1. Get a reference to the `HarnessSchemaProvider` from Fable.
2. Obtain the database handle from the connection provider (e.g. `this.fable.MeadowSQLiteProvider.db`).
3. Chain `generateTables()` and `seedData()` via Anticipate.
4. Call the callback on success.

For SQL-based providers like MySQL that use `Schema.json` for DDL, the `initializeSchema()` method reads the schema file and calls the connection module's `createTables()` instead of relying on the schema provider's SQL files. It then checks the `getSeedCheckQuery()` result before running seed SQL.

## Creating a Custom Provider

To add support for a new database engine:

### 1. Create the provider class

Create a new file under `source/providers/`:

```javascript
const libMeadowConnectionCustom = require('meadow-connection-custom');
const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderCustom extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		this.options.StorageProvider = 'Custom';
		this.options.StorageProviderModule = 'meadow-connection-custom';
	}

	connectDatabase(fCallback)
	{
		this.fable.serviceManager.addServiceType('MeadowCustomProvider', libMeadowConnectionCustom);
		this.fable.serviceManager.instantiateServiceProvider('MeadowCustomProvider');

		this.fable.MeadowCustomProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`Custom connection error: ${pError}`);
					return fCallback(pError);
				}
				this.log.info('Custom database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			return fCallback('No HarnessSchemaProvider registered');
		}

		// Get the database handle from your connection provider
		let tmpDB = this.fable.MeadowCustomProvider.db;

		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				return tmpSchemaProvider.generateTables(tmpDB, fStepComplete);
			});

		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				return tmpSchemaProvider.seedData(tmpDB, fStepComplete);
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderCustom;
```

### 2. Register in Retold-Harness.js

Add the provider to the `_ProviderMap`:

```javascript
'custom': require('./providers/Retold-Harness-Service-Provider-Custom.js'),
```

### 3. Add connection settings

Add a configuration section for your provider in each schema's configuration module (e.g. `configuration-bookstore-serve-api.js`):

```javascript
"Custom":
{
	"Server": process.env.CUSTOM_HOST || "127.0.0.1",
	"Port": parseInt(process.env.CUSTOM_PORT, 10) || 9999,
	"Database": process.env.CUSTOM_DATABASE || "bookstore"
}
```

### 4. Add Docker support (optional)

If your provider requires a server, add a service to `docker-compose.yml` and a provider definition to `source/management-tool/Provider-Definitions.js` so the management tool can manage its Docker container.

The provider is now selectable via `HARNESS_PROVIDER=custom`.

## Connection Settings

Each provider reads its connection settings from the Fable settings object. The schema's configuration module populates these settings with environment variable fallbacks. Here is a summary of the environment variables per provider:

| Provider | Environment Variables |
|----------|----------------------|
| SQLite | (configured via `SQLite.SQLiteFilePath` in the settings module) |
| MySQL | `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` |
| MSSQL | `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE` |
| PostgreSQL | `PGSQL_HOST`, `PGSQL_PORT`, `PGSQL_USER`, `PGSQL_PASSWORD`, `PGSQL_DATABASE` |
| MongoDB | `MONGODB_HOST`, `MONGODB_PORT`, `MONGODB_DATABASE` |
| DGraph | `DGRAPH_HOST`, `DGRAPH_PORT` |
| Solr | `SOLR_HOST`, `SOLR_PORT`, `SOLR_CORE` |
