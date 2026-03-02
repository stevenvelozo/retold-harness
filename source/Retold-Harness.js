/**
* Retold Harness
*
* Composable API harness that initializes a schema and storage provider
* via Fable services. Select schema and provider via environment variables:
*
*   HARNESS_SCHEMA=bookstore HARNESS_PROVIDER=sqlite npm start
*
* @author Steven Velozo <steven@velozo.com>
*/
const libFable = require('fable');

// Configuration maps -- each schema has its own config file
const _ConfigMap =
{
	'bookstore': require('./schemas/configuration-bookstore-serve-api.js'),
	'us-federal-data': require('./schemas/configuration-us-federal-data-serve-api.js'),
	'entertainment': require('./schemas/configuration-entertainment-serve-api.js')
};

// Select configuration based on HARNESS_SCHEMA env var (before Fable init)
let tmpSchemaConfigKey = (process.env.HARNESS_SCHEMA || 'bookstore').toLowerCase();
const _Settings = _ConfigMap[tmpSchemaConfigKey] || _ConfigMap['bookstore'];

// Schema and provider maps -- add new schemas/providers here
const _SchemaMap =
{
	'bookstore': require('./schemas/Retold-Harness-Service-Schema-Bookstore.js'),
	'us-federal-data': require('./schemas/Retold-Harness-Service-Schema-USFederalData.js'),
	'entertainment': require('./schemas/Retold-Harness-Service-Schema-Entertainment.js')
};

const _ProviderMap =
{
	'sqlite': require('./providers/Retold-Harness-Service-Provider-SQLite.js'),
	'mysql': require('./providers/Retold-Harness-Service-Provider-MySQL.js'),
	'mssql': require('./providers/Retold-Harness-Service-Provider-MSSQL.js'),
	'postgresql': require('./providers/Retold-Harness-Service-Provider-PostgreSQL.js'),
	'mongodb': require('./providers/Retold-Harness-Service-Provider-MongoDB.js'),
	'dgraph': require('./providers/Retold-Harness-Service-Provider-DGraph.js'),
	'solr': require('./providers/Retold-Harness-Service-Provider-Solr.js')
};

// Initialize fable
let _Fable = new libFable(_Settings);

// Determine which schema and provider to use
let tmpSchemaKey = (_Settings.HarnessSchema || 'bookstore').toLowerCase();
let tmpProviderKey = (_Settings.HarnessProvider || 'sqlite').toLowerCase();

_Fable.log.info(`Retold Harness initializing with schema [${tmpSchemaKey}] and provider [${tmpProviderKey}]...`);

// Validate schema selection
if (!_SchemaMap.hasOwnProperty(tmpSchemaKey))
{
	_Fable.log.error(`Unknown schema: ${tmpSchemaKey}. Available schemas: ${Object.keys(_SchemaMap).join(', ')}`);
	process.exit(1);
}

// Validate provider selection
if (!_ProviderMap.hasOwnProperty(tmpProviderKey))
{
	_Fable.log.error(`Unknown provider: ${tmpProviderKey}. Available providers: ${Object.keys(_ProviderMap).join(', ')}`);
	process.exit(1);
}

// Register and instantiate the schema provider
_Fable.serviceManager.addServiceType('HarnessSchemaProvider', _SchemaMap[tmpSchemaKey]);
_Fable.serviceManager.instantiateServiceProvider('HarnessSchemaProvider');

// Register and instantiate the provider configurator
_Fable.serviceManager.addServiceType('MeadowProviderConfigurator', _ProviderMap[tmpProviderKey]);
_Fable.serviceManager.instantiateServiceProvider('MeadowProviderConfigurator');

// Initialize the harness
_Fable.MeadowProviderConfigurator.initializeHarness(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error(`Harness initialization failed: ${pError}`);
			return process.exit(1);
		}
	});
