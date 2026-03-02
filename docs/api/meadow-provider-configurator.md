# MeadowProviderConfigurator

**Source:** `source/providers/Retold-Harness-Service-MeadowProviderConfigurator.js`

## Class: `RetoldHarnessMeadowProviderConfigurator`

Extends `fable-serviceproviderbase`

Base orchestrator that chains the lifecycle steps for initializing a Retold Harness: connect to a database, create tables, seed data, initialize the data service, apply behaviors, and serve the web UI.

Concrete subclasses override `connectDatabase()` and `initializeSchema()` with provider-specific logic. The remaining lifecycle methods have default implementations that work across all providers.

### Available Subclasses

| Provider | Class | Module |
|----------|-------|--------|
| SQLite | `RetoldHarnessProviderSQLite` | `Retold-Harness-Service-Provider-SQLite.js` |
| MySQL | `RetoldHarnessProviderMySQL` | `Retold-Harness-Service-Provider-MySQL.js` |
| MSSQL | `RetoldHarnessProviderMSSQL` | `Retold-Harness-Service-Provider-MSSQL.js` |
| PostgreSQL | `RetoldHarnessProviderPostgreSQL` | `Retold-Harness-Service-Provider-PostgreSQL.js` |
| MongoDB | `RetoldHarnessProviderMongoDB` | `Retold-Harness-Service-Provider-MongoDB.js` |
| DGraph | `RetoldHarnessProviderDGraph` | `Retold-Harness-Service-Provider-DGraph.js` |
| Solr | `RetoldHarnessProviderSolr` | `Retold-Harness-Service-Provider-Solr.js` |

---

## Constructor

### `constructor(pFable, pOptions, pServiceHash)`

Creates a new provider configurator instance and registers with Fable's service manager.

**Parameters:**

- `pFable` {Fable} -- The Fable instance
- `pOptions` {object} -- Service options (may include `StorageProvider` and `StorageProviderModule`)
- `pServiceHash` {string} -- Unique service hash

Sets `serviceType` to `'MeadowProviderConfigurator'`.

---

## Methods

### `connectDatabase(fCallback)`

**Abstract.** Connect to the database engine. Must be overridden by subclasses.

The base implementation logs an error and returns a callback with an error string. Each provider subclass implements this method to register and connect its specific database driver.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when the connection is established or fails

**Example** (SQLite implementation):

```javascript
connectDatabase(fCallback)
{
	let tmpSQLiteFilePath = this.fable.settings.SQLite && this.fable.settings.SQLite.SQLiteFilePath;

	if (!tmpSQLiteFilePath)
	{
		this.log.error('Provider-SQLite.connectDatabase(): No SQLite.SQLiteFilePath in settings.');
		return fCallback('No SQLite.SQLiteFilePath configured');
	}

	let tmpDataDir = libPath.dirname(tmpSQLiteFilePath);
	if (!libFS.existsSync(tmpDataDir))
	{
		libFS.mkdirSync(tmpDataDir, { recursive: true });
	}

	this.fable.serviceManager.addServiceType('MeadowSQLiteProvider', libMeadowConnectionSQLite);
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

---

### `initializeSchema(fCallback)`

**Abstract.** Initialize the schema: create tables and seed data. Must be overridden by provider subclasses.

Each subclass retrieves the database handle from its connected driver and passes it to the schema provider's `generateTables()` and `seedData()` methods.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when schema initialization is complete or fails

**Example** (SQLite implementation):

```javascript
initializeSchema(fCallback)
{
	let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

	if (!tmpSchemaProvider)
	{
		this.log.error('Provider-SQLite.initializeSchema(): No HarnessSchemaProvider registered.');
		return fCallback('No HarnessSchemaProvider registered');
	}

	let tmpDB = this.fable.MeadowSQLiteProvider.db;

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
				this.log.error(`Schema initialization error: ${pError}`);
				return fCallback(pError);
			}
			return fCallback();
		});
}
```

---

### `initializeDataService(fCallback)`

Initialize the RetoldDataService with the schema provider's options. This is a shared implementation that works for all providers.

Retrieves `StorageProvider` and `StorageProviderModule` from `this.options` (set by each subclass constructor), calls the schema provider's `getRetoldDataServiceOptions()`, registers `retold-data-service` as a Fable service, and calls `initializeService()`.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when the data service is initialized or fails

**Errors:**

- Returns an error if no `HarnessSchemaProvider` is registered with Fable
- Propagates any error from `RetoldDataService.initializeService()`

---

### `applyBehaviors(fCallback)`

Apply endpoint behaviors from the schema provider. Delegates to [`HarnessSchemaProvider.applyBehaviors()`](api/schema-provider.md#applybehaviorsfcallback).

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when behaviors are applied

**Behavior:**

- If no `HarnessSchemaProvider` is registered, logs a warning and continues without error
- Otherwise, calls `tmpSchemaProvider.applyBehaviors(fCallback)`

---

### `serveWebUI(fCallback)`

Serve the web UI HTML file at the root URL (`/`). Reads from `../web/index.html` relative to the providers directory and registers a GET route on the Orator server.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when the web UI route is registered

**Behavior:**

- If the `index.html` file does not exist, logs a warning and continues without error
- Sets the `Content-Type` header to `text/html; charset=utf-8`

---

### `initializeHarness(fCallback)`

Main entry point. Chains all lifecycle steps in sequence via Fable's Anticipate utility.

**Parameters:**

- `fCallback` {Function} -- Callback `(pError)` called when the harness is fully initialized or when any step fails

**Lifecycle sequence:**

1. `connectDatabase()` -- Establish a database connection
2. `initializeSchema()` -- Create tables and seed data
3. `initializeDataService()` -- Register and initialize RetoldDataService
4. `applyBehaviors()` -- Inject endpoint behaviors
5. `serveWebUI()` -- Serve the web UI at `/`
6. Log the port and URL to the console

If any step fails, the error propagates immediately through the callback and subsequent steps are skipped.

**Example:**

```javascript
_Fable.MeadowProviderConfigurator.initializeHarness(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error(`Harness initialization failed: ${pError}`);
			return process.exit(1);
		}
	});
```

---

## Writing a Custom Provider

To add support for a new database engine, create a subclass of `RetoldHarnessMeadowProviderConfigurator`:

```javascript
const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderCustom extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for the data service
		this.options.StorageProvider = 'Custom';
		this.options.StorageProviderModule = 'meadow-connection-custom';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the custom database driver
		this.fable.serviceManager.addServiceType('MeadowCustomProvider', require('meadow-connection-custom'));
		this.fable.serviceManager.instantiateServiceProvider('MeadowCustomProvider');

		this.fable.MeadowCustomProvider.connectAsync(fCallback);
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;
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

		tmpAnticipate.wait(fCallback);
	}
}

module.exports = RetoldHarnessProviderCustom;
```

Then register the new provider in the `_ProviderMap` in `Retold-Harness.js`:

```javascript
const _ProviderMap =
{
	// ... existing providers ...
	'custom': require('./providers/Retold-Harness-Service-Provider-Custom.js')
};
```
