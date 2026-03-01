/**
* Retold Harness Provider - SQLite
*
* SQLite-specific provider configurator. Handles directory creation,
* SQLite connection via meadow-connection-sqlite, and passes the
* database handle to the schema provider for table creation and seeding.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionSQLite = require('meadow-connection-sqlite');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderSQLite extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'SQLite';
		this.options.StorageProviderModule = 'meadow-connection-sqlite';
	}

	connectDatabase(fCallback)
	{
		// Ensure the data directory exists
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

		// Register and connect the SQLite provider
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
}

module.exports = RetoldHarnessProviderSQLite;
