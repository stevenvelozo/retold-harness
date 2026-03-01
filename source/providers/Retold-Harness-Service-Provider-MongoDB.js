/**
* Retold Harness Provider - MongoDB
*
* MongoDB-specific provider configurator. Handles MongoDB connection via
* meadow-connection-mongodb, uses the connection module's createTables()
* for collection and index creation from Schema.json.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionMongoDB = require('meadow-connection-mongodb');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderMongoDB extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'MongoDB';
		this.options.StorageProviderModule = 'meadow-connection-mongodb';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the MongoDB provider
		this.fable.serviceManager.addServiceType('MeadowMongoDBProvider', libMeadowConnectionMongoDB);
		this.fable.serviceManager.instantiateServiceProvider('MeadowMongoDBProvider');

		this.fable.MeadowMongoDBProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`MongoDB connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('MongoDB database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-MongoDB.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();

		let tmpAnticipate = this.fable.newAnticipate();

		// Create collections and indexes using the connection module's createTables()
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				let tmpSchemaFile = libPath.join(tmpSchemaPath, 'Schema.json');
				let tmpSchema;

				try
				{
					tmpSchema = JSON.parse(libFS.readFileSync(tmpSchemaFile, 'utf8'));
				}
				catch (pError)
				{
					this.log.error(`Error reading Schema.json: ${pError}`);
					return fStepComplete(pError);
				}

				this.log.info('Creating MongoDB collections from Schema.json...');
				this.fable.MeadowMongoDBProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating MongoDB collections: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('MongoDB collections created.');
						return fStepComplete();
					});
			});

		// No SQL seed for MongoDB; seed data can be added later via provider-specific tooling
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				this.log.info('MongoDB seed: no seed data configured, skipping.');
				return fStepComplete();
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`MongoDB schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderMongoDB;
