# SchemaProvider

**Source:** `source/schemas/Retold-Harness-Service-SchemaProvider.js`

## Class: `RetoldHarnessSchemaProvider`

Extends `fable-serviceproviderbase`

Base class for schema providers. Each schema (Bookstore, US Federal Data, Entertainment) extends this class to provide schema-specific table creation, seed data loading, and endpoint behavior injection.

### Available Subclasses

| Schema | Class | Module |
|--------|-------|--------|
| Bookstore | `RetoldHarnessSchemaBookstore` | `Retold-Harness-Service-Schema-Bookstore.js` |
| US Federal Data | `RetoldHarnessSchemaUSFederalData` | `Retold-Harness-Service-Schema-USFederalData.js` |
| Entertainment | `RetoldHarnessSchemaEntertainment` | `Retold-Harness-Service-Schema-Entertainment.js` |

---

## Constructor

### `constructor(pFable, pOptions, pServiceHash)`

Creates a new schema provider instance and registers with Fable's service manager.

**Parameters:**

- `pFable` {Fable} -- The Fable instance
- `pOptions` {object} -- Service options
- `pServiceHash` {string} -- Unique service hash

Sets `serviceType` to `'HarnessSchemaProvider'`.

---

## Methods

### `getSchemaPath()`

**Abstract.** Returns the absolute path to this schema's directory. Must be overridden by subclasses.

The schema directory is expected to contain a `Schema.json` file that defines the Meadow schema for RetoldDataService.

**Returns:** `{string|boolean}` -- Absolute path to the schema directory, or `false` if not implemented.

**Example** (Bookstore implementation):

```javascript
getSchemaPath()
{
	return libPath.join(__dirname, 'bookstore');
}
```

---

### `getRetoldDataServiceOptions(pStorageProvider, pStorageProviderModule)`

Build the RetoldDataServiceOptions configuration object. This method is called by [`MeadowProviderConfigurator.initializeDataService()`](api/meadow-provider-configurator.md#initializedataservicefcallback) to configure the data service with the correct schema path and storage provider.

**Parameters:**

- `pStorageProvider` {string} -- Provider name (e.g. `"SQLite"`, `"MySQL"`)
- `pStorageProviderModule` {string} -- npm module name (e.g. `"meadow-connection-sqlite"`)

**Returns:** `{object}` -- Configuration object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `StorageProvider` | string | The storage provider name |
| `StorageProviderModule` | string | The npm module for the storage provider |
| `FullMeadowSchemaPath` | string | Absolute path to the schema directory (with trailing slash) |
| `FullMeadowSchemaFilename` | string | Always `"Schema.json"` |

**Example return value:**

```javascript
{
	"StorageProvider": "SQLite",
	"StorageProviderModule": "meadow-connection-sqlite",
	"FullMeadowSchemaPath": "/path/to/schemas/bookstore/",
	"FullMeadowSchemaFilename": "Schema.json"
}
```

**Errors:**

- If `getSchemaPath()` returns `false`, logs an error and returns an empty object `{}`

---

### `generateTables(pDB, fCallback)`

**Abstract.** Create tables for this schema using the provided database handle. Must be overridden by subclasses.

The database handle type depends on the active provider (e.g., a `better-sqlite3` database instance for SQLite, a connection pool for MySQL).

**Parameters:**

- `pDB` {object} -- Database handle (type depends on the active provider)
- `fCallback` {Function} -- Callback `(pError)` called when table creation is complete or fails

**Example** (Bookstore with SQLite):

```javascript
generateTables(pDB, fCallback)
{
	try
	{
		let tmpCreateSQL = libFS.readFileSync(
			libPath.join(this.getSchemaPath(), 'sqlite_create', 'BookStore-CreateSQLiteTables.sql'),
			'utf8');
		pDB.exec(tmpCreateSQL);
		this.log.info('BookStore tables created.');
		return fCallback();
	}
	catch (pError)
	{
		this.log.error(`Error creating BookStore tables: ${pError}`);
		return fCallback(pError);
	}
}
```

---

### `seedData(pDB, fCallback)`

**Abstract.** Seed initial data for this schema. Must be overridden by subclasses.

Implementations typically check whether data already exists (using `getSeedCheckQuery()` or inline logic) before inserting seed records.

**Parameters:**

- `pDB` {object} -- Database handle (type depends on the active provider)
- `fCallback` {Function} -- Callback `(pError)` called when seeding is complete or fails

**Example** (Bookstore with SQLite):

```javascript
seedData(pDB, fCallback)
{
	try
	{
		let tmpRowCount = pDB.prepare('SELECT COUNT(*) AS cnt FROM Book').get();
		if (tmpRowCount.cnt < 1)
		{
			this.log.info('Seeding initial BookStore data...');
			let tmpSeedSQL = libFS.readFileSync(
				libPath.join(this.getSchemaPath(), 'sqlite_create', 'BookStore-SeedData.sql'),
				'utf8');
			pDB.exec(tmpSeedSQL);
			this.log.info('Seed data loaded.');
		}
		return fCallback();
	}
	catch (pError)
	{
		this.log.error(`Error seeding BookStore data: ${pError}`);
		return fCallback(pError);
	}
}
```

---

### `getSeedCheckQuery()`

Get a SQL query to check whether seed data already exists. The query should produce a result with a `cnt` column where `cnt > 0` means data has already been seeded.

This method is used by some provider subclasses to decide whether to skip seeding. Return `false` if seeding should always run.

**Returns:** `{string|boolean}` -- SQL query string, or `false` to always run seeding

**Default:** Returns `false`.

**Example** (Bookstore implementation):

```javascript
getSeedCheckQuery()
{
	return 'SELECT COUNT(*) AS cnt FROM Book';
}
```

---

### `applyBehaviors(fCallback)`

Apply endpoint behaviors after the data service is initialized. The default implementation is a no-op that immediately calls the callback. Override this method to inject custom behaviors into Meadow endpoints.

This is called by [`MeadowProviderConfigurator.applyBehaviors()`](api/meadow-provider-configurator.md#applybehaviorsfcallback) during the harness lifecycle.

**Parameters:**

- `fCallback` {Function} -- Callback called when behavior injection is complete

**Example** (Bookstore author enrichment):

```javascript
applyBehaviors(fCallback)
{
	let tmpFable = this.fable;

	if (!tmpFable.MeadowEndpoints || !tmpFable.MeadowEndpoints.Book)
	{
		this.log.warn('BookStore applyBehaviors: MeadowEndpoints.Book not available, skipping.');
		return fCallback();
	}

	tmpFable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
		(pRequest, pRequestState, fRequestComplete) =>
		{
			tmpFable.DAL.BookAuthorJoin.doReads(
				tmpFable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
				(pJoinReadError, pJoinReadQuery, pJoinRecords) =>
				{
					let tmpAuthors = [];
					let tmpRemaining = pJoinRecords.length;

					if (tmpRemaining < 1)
					{
						pRequestState.Record.Authors = [];
						return fRequestComplete();
					}

					for (let j = 0; j < pJoinRecords.length; j++)
					{
						tmpFable.DAL.Author.doRead(
							tmpFable.DAL.Author.query.addFilter('IDAuthor', pJoinRecords[j].IDAuthor),
							(pReadError, pReadQuery, pAuthor) =>
							{
								if (pAuthor && pAuthor.IDAuthor)
								{
									tmpAuthors.push(pAuthor);
								}
								tmpRemaining--;
								if (tmpRemaining <= 0)
								{
									pRequestState.Record.Authors = tmpAuthors;
									return fRequestComplete();
								}
							});
					}
				});
		});

	return fCallback();
}
```

---

## Writing a Custom Schema

To add a new schema, create a subclass of `RetoldHarnessSchemaProvider`:

```javascript
const libPath = require('path');
const libFS = require('fs');

const libRetoldHarnessSchemaProvider = require('./Retold-Harness-Service-SchemaProvider.js');

class RetoldHarnessSchemaCustom extends libRetoldHarnessSchemaProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'HarnessSchemaProvider';
	}

	getSchemaPath()
	{
		return libPath.join(__dirname, 'custom');
	}

	getSeedCheckQuery()
	{
		return 'SELECT COUNT(*) AS cnt FROM MyTable';
	}

	generateTables(pDB, fCallback)
	{
		// Create tables using the database handle
		return fCallback();
	}

	seedData(pDB, fCallback)
	{
		// Insert seed records if the table is empty
		return fCallback();
	}

	applyBehaviors(fCallback)
	{
		// Inject endpoint behaviors (optional)
		return fCallback();
	}
}

module.exports = RetoldHarnessSchemaCustom;
```

Then register it in both `_ConfigMap` and `_SchemaMap` in `Retold-Harness.js`:

```javascript
const _ConfigMap =
{
	// ... existing configs ...
	'custom': require('./schemas/configuration-custom-serve-api.js')
};

const _SchemaMap =
{
	// ... existing schemas ...
	'custom': require('./schemas/Retold-Harness-Service-Schema-Custom.js')
};
```

The schema directory should contain a `Schema.json` file defining the Meadow schema for all entities in the data model.
