/**
* Retold Harness Provider - DGraph
*
* DGraph-specific provider configurator. Handles DGraph connection via
* meadow-connection-dgraph, uses the connection module's createTables()
* for predicate and type creation from Schema.json.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionDGraph = require('meadow-connection-dgraph');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderDGraph extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'DGraph';
		this.options.StorageProviderModule = 'meadow-connection-dgraph';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the DGraph provider
		this.fable.serviceManager.addServiceType('MeadowDGraphProvider', libMeadowConnectionDGraph);
		this.fable.serviceManager.instantiateServiceProvider('MeadowDGraphProvider');

		this.fable.MeadowDGraphProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`DGraph connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('DGraph database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-DGraph.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();

		let tmpAnticipate = this.fable.newAnticipate();

		// Create predicates and types using the connection module's createTables()
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

				this.log.info('Creating DGraph schema from Schema.json...');
				this.fable.MeadowDGraphProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating DGraph schema: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('DGraph schema created.');
						return fStepComplete();
					});
			});

		// No SQL seed for DGraph; seed data can be added later via provider-specific tooling
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				this.log.info('DGraph seed: no seed data configured, skipping.');
				return fStepComplete();
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`DGraph schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderDGraph;
