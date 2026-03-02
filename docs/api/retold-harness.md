# RetoldHarness

**Source:** `source/Retold-Harness.js`

The application entry point. This script reads environment variables to select a schema and database provider, initializes Fable with the appropriate configuration, registers the schema and provider services, and kicks off the harness lifecycle.

## Module Maps

The harness uses three maps to resolve schemas and providers by key:

### `_ConfigMap`

Maps schema names to configuration files. Each configuration file exports a settings object consumed by Fable.

| Key | Configuration File |
|-----|-------------------|
| `bookstore` | `./schemas/configuration-bookstore-serve-api.js` |
| `us-federal-data` | `./schemas/configuration-us-federal-data-serve-api.js` |
| `entertainment` | `./schemas/configuration-entertainment-serve-api.js` |

### `_SchemaMap`

Maps schema names to schema provider classes. Each class extends [`RetoldHarnessSchemaProvider`](api/schema-provider.md).

| Key | Schema Provider Class |
|-----|----------------------|
| `bookstore` | `Retold-Harness-Service-Schema-Bookstore.js` |
| `us-federal-data` | `Retold-Harness-Service-Schema-USFederalData.js` |
| `entertainment` | `Retold-Harness-Service-Schema-Entertainment.js` |

### `_ProviderMap`

Maps provider names to provider configurator classes. Each class extends [`RetoldHarnessMeadowProviderConfigurator`](api/meadow-provider-configurator.md).

| Key | Provider Configurator Class |
|-----|-----------------------------|
| `sqlite` | `Retold-Harness-Service-Provider-SQLite.js` |
| `mysql` | `Retold-Harness-Service-Provider-MySQL.js` |
| `mssql` | `Retold-Harness-Service-Provider-MSSQL.js` |
| `postgresql` | `Retold-Harness-Service-Provider-PostgreSQL.js` |
| `mongodb` | `Retold-Harness-Service-Provider-MongoDB.js` |
| `dgraph` | `Retold-Harness-Service-Provider-DGraph.js` |
| `solr` | `Retold-Harness-Service-Provider-Solr.js` |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HARNESS_SCHEMA` | `bookstore` | Schema to use. Must match a key in `_SchemaMap`. |
| `HARNESS_PROVIDER` | `sqlite` | Database provider to use. Must match a key in `_ProviderMap`. |
| `PORT` | `8086` | API server port. Passed through to Fable settings as `APIServerPort`. |

## Startup Flow

The following sequence runs when the harness script is executed:

```javascript
// 1. Load configuration for the selected schema
let tmpSchemaConfigKey = (process.env.HARNESS_SCHEMA || 'bookstore').toLowerCase();
const _Settings = _ConfigMap[tmpSchemaConfigKey] || _ConfigMap['bookstore'];

// 2. Initialize Fable with the resolved configuration
let _Fable = new libFable(_Settings);

// 3. Determine schema and provider keys from settings
//    (settings may override the env var defaults)
let tmpSchemaKey = (_Settings.HarnessSchema || 'bookstore').toLowerCase();
let tmpProviderKey = (_Settings.HarnessProvider || 'sqlite').toLowerCase();

// 4. Register the schema provider as a Fable service
_Fable.serviceManager.addServiceType('HarnessSchemaProvider', _SchemaMap[tmpSchemaKey]);
_Fable.serviceManager.instantiateServiceProvider('HarnessSchemaProvider');

// 5. Register the provider configurator as a Fable service
_Fable.serviceManager.addServiceType('MeadowProviderConfigurator', _ProviderMap[tmpProviderKey]);
_Fable.serviceManager.instantiateServiceProvider('MeadowProviderConfigurator');

// 6. Initialize the harness -- chains all lifecycle steps
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

### Lifecycle Steps

Once `initializeHarness` is called, the provider configurator executes these steps in sequence via Fable's Anticipate:

1. **connectDatabase** -- Establish a connection to the database engine
2. **initializeSchema** -- Create tables and seed data using the schema provider
3. **initializeDataService** -- Register and initialize the RetoldDataService
4. **applyBehaviors** -- Inject endpoint behaviors from the schema provider
5. **serveWebUI** -- Serve the web UI at the root URL
6. **Log ready** -- Print the port and URL to the console

See [`MeadowProviderConfigurator.initializeHarness()`](api/meadow-provider-configurator.md#initializeharnessflcallback) for details.

## Validation

The harness validates both the schema key and provider key against their respective maps before attempting to register services. If either key is unrecognized, the process logs an error listing all available keys and exits with code 1.

## Usage

```bash
# Default: bookstore schema with SQLite
npm start

# Specify schema and provider via environment variables
HARNESS_SCHEMA=bookstore HARNESS_PROVIDER=mysql npm start

# Override the port
PORT=9000 HARNESS_SCHEMA=entertainment HARNESS_PROVIDER=postgresql npm start
```
