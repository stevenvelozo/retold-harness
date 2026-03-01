/**
* Retold Harness Schema Provider Base Service
*
* Base class for schema providers. Each schema (bookstore, movies, etc.)
* extends this class to provide schema-specific table creation, seeding,
* and behavior injection.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');

class RetoldHarnessSchemaProvider extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'HarnessSchemaProvider';
	}

	/**
	 * Get the absolute path to this schema's directory.
	 * Must be overridden by subclasses.
	 *
	 * @returns {string} Absolute path to the schema directory
	 */
	getSchemaPath()
	{
		this.log.error('SchemaProvider.getSchemaPath() must be overridden by a subclass.');
		return false;
	}

	/**
	 * Build the RetoldDataServiceOptions object for this schema and the
	 * given storage provider.
	 *
	 * @param {string} pStorageProvider - The storage provider name (e.g. "SQLite")
	 * @param {string} pStorageProviderModule - The npm module name (e.g. "meadow-connection-sqlite")
	 * @returns {object} RetoldDataServiceOptions configuration object
	 */
	getRetoldDataServiceOptions(pStorageProvider, pStorageProviderModule)
	{
		let tmpSchemaPath = this.getSchemaPath();

		if (!tmpSchemaPath)
		{
			this.log.error('SchemaProvider.getRetoldDataServiceOptions() called but getSchemaPath() returned false.');
			return {};
		}

		return (
			{
				"StorageProvider": pStorageProvider,
				"StorageProviderModule": pStorageProviderModule,
				"FullMeadowSchemaPath": `${tmpSchemaPath}/`,
				"FullMeadowSchemaFilename": "Schema.json"
			});
	}

	/**
	 * Create tables for this schema using the provided database handle.
	 * Must be overridden by subclasses.
	 *
	 * @param {object} pDB - The database handle (type depends on provider)
	 * @param {function} fCallback - Callback when complete
	 */
	generateTables(pDB, fCallback)
	{
		this.log.error('SchemaProvider.generateTables() must be overridden by a subclass.');
		return fCallback();
	}

	/**
	 * Seed initial data for this schema using the provided database handle.
	 * Must be overridden by subclasses.
	 *
	 * @param {object} pDB - The database handle (type depends on provider)
	 * @param {function} fCallback - Callback when complete
	 */
	seedData(pDB, fCallback)
	{
		this.log.error('SchemaProvider.seedData() must be overridden by a subclass.');
		return fCallback();
	}

	/**
	 * Apply endpoint behaviors after the data service is initialized.
	 * Default is a no-op. Override to inject behaviors.
	 *
	 * @param {function} fCallback - Callback when complete
	 */
	applyBehaviors(fCallback)
	{
		return fCallback();
	}
}

module.exports = RetoldHarnessSchemaProvider;
