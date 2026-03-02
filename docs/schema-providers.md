# Schema Providers

## Overview

Schema providers define the data model, table creation logic, seed data, and endpoint behaviors for a retold-harness instance. Each schema provider is a self-contained Fable service that can be paired with any storage provider.

## SchemaProvider Base Class

**File:** `source/schemas/Retold-Harness-Service-SchemaProvider.js`

The base class extends `fable-serviceproviderbase` and establishes the contract that all concrete schema providers must implement.

```javascript
const libFableServiceProviderBase = require('fable-serviceproviderbase');

class RetoldHarnessSchemaProvider extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'HarnessSchemaProvider';
	}
}
```

### Service Type

All schema providers must set `this.serviceType = 'HarnessSchemaProvider'`. This is the key used by Fable's service manager to register and look up the provider.

### Abstract Methods

These methods must be overridden by every concrete schema provider:

| Method | Signature | Purpose |
|--------|-----------|---------|
| `getSchemaPath()` | `() => string` | Return the absolute path to the schema directory containing `Schema.json`, DDL files, and seed SQL |
| `generateTables(pDB, fCallback)` | `(object, function) => void` | Create database tables using the provided database handle |
| `seedData(pDB, fCallback)` | `(object, function) => void` | Insert seed/reference data into the database |

The `pDB` parameter type depends on the active storage provider. For SQLite it is a `better-sqlite3` database handle; for MySQL it is a connection pool.

### Implemented Methods

These methods have default implementations in the base class and can optionally be overridden:

| Method | Signature | Default Behavior |
|--------|-----------|------------------|
| `getRetoldDataServiceOptions(pStorageProvider, pStorageProviderModule)` | `(string, string) => object` | Builds a `RetoldDataServiceOptions` object from `getSchemaPath()`, the storage provider name, and its module name. Returns `{ StorageProvider, StorageProviderModule, FullMeadowSchemaPath, FullMeadowSchemaFilename }`. |
| `getSeedCheckQuery()` | `() => string\|false` | Returns a SQL query that checks whether seed data already exists. The query should return `{ cnt }` where `cnt > 0` means data is present. Returns `false` by default (seed always runs). |
| `applyBehaviors(fCallback)` | `(function) => void` | No-op by default. Override to install endpoint behavior hooks after the data service is initialized. |

## Available Schemas

### Bookstore

**Key:** `bookstore`
**File:** `source/schemas/Retold-Harness-Service-Schema-Bookstore.js`
**Schema directory:** `source/schemas/bookstore/`

The Bookstore schema models a chain of bookstores with inventory, pricing, and reviews. It provides a rich set of relationships for testing Meadow's DAL and endpoint features.

**Entities (8):**

| Entity | Description |
|--------|-------------|
| User | System users with login credentials and profile names |
| Book | Books with title, genre, ISBN, language, and publication year |
| Author | Author records linked to User accounts |
| BookAuthorJoin | Many-to-many join between Book and Author |
| BookPrice | Time-ranged pricing with discount and coupon support |
| BookStore | Physical store locations with address information |
| BookStoreInventory | Per-store stock levels with stocking associate tracking |
| Review | User reviews with text and numeric rating |

**Seed data:** 10,000+ records including books, authors, join records, prices, stores, inventory, and reviews.

**Behavior injection:** The Bookstore schema installs a `Read-PostOperation` behavior on the `Book` endpoint. When a single book is read, the behavior fetches matching `BookAuthorJoin` records and resolves each join to the full `Author` record, attaching an `Authors` array to the response.

### US Federal Data

**Key:** `us-federal-data`
**File:** `source/schemas/Retold-Harness-Service-Schema-USFederalData.js`
**Schema directory:** `source/schemas/us-federal-data/`

The US Federal Data schema models geographic and administrative entities sourced from Census Bureau files. It demonstrates high-volume data ingestion via `meadow-integration`.

**Entities (10):**

| Entity | Description |
|--------|-------------|
| User | System users |
| DataSource | Provenance tracking for ingested data files |
| CensusRegion | 4 Census regions (Northeast, Midwest, South, West) |
| CensusDivision | 9 Census divisions within regions |
| State | 50 states + territories with FIPS codes |
| County | Counties with FIPS codes and classification |
| City | Cities/places with geographic coordinates and area measurements |
| ZIPCode | ZIP code tabulation areas with coordinates |
| CongressionalDistrict | Congressional districts per state |
| CountySubdivision | County subdivisions with FIPS codes |

**Seed data:** Reference data (4 Regions, 9 Divisions, 6 DataSources, 1 admin User). Full geographic data is loaded separately via the ingestion pipeline (`npm run ingest-federal-data`).

**Behavior injection:** Two post-operation behaviors are installed:
- `State` reads are enriched with `CensusRegionName` and `CensusDivisionName` from the related region and division records.
- `County` reads are enriched with `StateName` and `StateAbbreviation` from the related state record.

### Entertainment

**Key:** `entertainment`
**File:** `source/schemas/Retold-Harness-Service-Schema-Entertainment.js`
**Schema directory:** `source/schemas/entertainment/`

The Entertainment schema models movies, music, concerts, and their relationships. Data is ingested from IMDb non-commercial datasets, Wikidata SPARQL queries, and curated JSON files, with full provenance tracking via the DataSource entity.

**Entities (16):**

| Entity | Description |
|--------|-------------|
| User | System users |
| DataSource | Provenance tracking for ingested datasets |
| Genre | Movie and music genres with category |
| Person | People (actors, directors, musicians) with external IDs and professions |
| Movie | Films with title, year, runtime, and genre list |
| MovieGenre | Many-to-many join between Movie and Genre |
| MovieCredit | Cast and crew credits linking movies to people |
| MovieRating | Aggregate ratings with average score and vote count |
| Artist | Musical artists and bands with type and country |
| Album | Music albums with release year, type, and track count |
| Song | Individual songs with duration |
| AlbumTrack | Track listings linking songs to albums |
| Soundtrack | Movie soundtrack entries linking songs to films |
| Venue | Concert venues with location and capacity |
| Concert | Concert events linking artists to venues |
| SetlistEntry | Individual songs played at concerts with position and encore flag |

**Seed data:** Reference data (8 DataSources, 1 admin User). Full entertainment data is loaded via the ingestion pipeline (`npm run ingest-entertainment`), which requires increased memory (`--max-old-space-size=8192`) for large IMDb datasets.

**Behavior injection:** Three post-operation behaviors are installed:
- `Movie` reads are enriched with `AverageRating` and `NumVotes` from the related `MovieRating` record.
- `Concert` reads are enriched with `ArtistName` from the related `Artist` record, and `VenueName`/`VenueCity` from the related `Venue` record.
- `Album` reads are enriched with `ArtistName` from the related `Artist` record.

## Creating a Custom Schema

To add a new schema to the harness, create a new schema provider class and register it in `Retold-Harness.js`.

### 1. Create the schema directory

Create a directory under `source/schemas/` for your schema. At minimum it should contain:

```
source/schemas/my-schema/
	Schema.json          # Meadow schema definition
	sqlite_create/       # SQL files for SQLite
		CreateTables.sql
		SeedData.sql
```

The `Schema.json` file is generated from a Stricture DDL file using `npx stricture compile`.

### 2. Create the schema provider class

```javascript
const libRetoldHarnessSchemaProvider = require('./Retold-Harness-Service-SchemaProvider.js');

class MyCustomSchema extends libRetoldHarnessSchemaProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'HarnessSchemaProvider';
	}

	getSchemaPath()
	{
		return require('path').join(__dirname, 'my-schema');
	}

	getSeedCheckQuery()
	{
		return 'SELECT COUNT(*) AS cnt FROM MyEntity';
	}

	generateTables(pDB, fCallback)
	{
		let tmpSQL = require('fs').readFileSync(
			require('path').join(this.getSchemaPath(), 'sqlite_create', 'CreateTables.sql'), 'utf8');
		pDB.exec(tmpSQL);
		this.log.info('Custom tables created.');
		return fCallback();
	}

	seedData(pDB, fCallback)
	{
		let tmpRowCount = pDB.prepare('SELECT COUNT(*) AS cnt FROM MyEntity').get();
		if (tmpRowCount.cnt < 1)
		{
			let tmpSeedSQL = require('fs').readFileSync(
				require('path').join(this.getSchemaPath(), 'sqlite_create', 'SeedData.sql'), 'utf8');
			pDB.exec(tmpSeedSQL);
		}
		return fCallback();
	}

	applyBehaviors(fCallback)
	{
		// Add custom endpoint behaviors here
		return fCallback();
	}
}

module.exports = MyCustomSchema;
```

### 3. Create the configuration module

Create `source/schemas/configuration-my-schema-serve-api.js` following the pattern of the existing configuration files. This module exports the full Fable settings object with connection credentials for all supported providers.

### 4. Register in Retold-Harness.js

Add entries to the three maps in `Retold-Harness.js`:

```javascript
// In _ConfigMap:
'my-schema': require('./schemas/configuration-my-schema-serve-api.js'),

// In _SchemaMap:
'my-schema': require('./schemas/Retold-Harness-Service-Schema-MySchema.js'),
```

The schema is now selectable via `HARNESS_SCHEMA=my-schema`.

### Notes on generateTables and seedData

The `generateTables()` and `seedData()` implementations shown above use synchronous SQLite calls (`pDB.exec()`, `pDB.prepare().get()`). When your schema needs to support other providers, the provider configurator's `initializeSchema()` method handles the differences. For SQLite, it passes the raw database handle. For MySQL, it may use the connection module's `createTables()` against `Schema.json` directly. Your schema provider's SQL-based methods are called only for providers that need them.
