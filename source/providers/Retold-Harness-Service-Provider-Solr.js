/**
* Retold Harness Provider - Solr
*
* Solr-specific provider configurator. Handles Solr connection via
* meadow-connection-solr, uses the connection module's createTables()
* for field definition creation from Schema.json.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionSolr = require('meadow-connection-solr');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderSolr extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'Solr';
		this.options.StorageProviderModule = 'meadow-connection-solr';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the Solr provider
		this.fable.serviceManager.addServiceType('MeadowSolrProvider', libMeadowConnectionSolr);
		this.fable.serviceManager.instantiateServiceProvider('MeadowSolrProvider');

		this.fable.MeadowSolrProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`Solr connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('Solr database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-Solr.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();

		let tmpAnticipate = this.fable.newAnticipate();

		// Create field definitions using the connection module's createTables()
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

				this.log.info('Creating Solr schema from Schema.json...');
				this.fable.MeadowSolrProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating Solr schema: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('Solr schema created.');
						return fStepComplete();
					});
			});

		// No SQL seed for Solr; seed data can be added later via provider-specific tooling
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				this.log.info('Solr seed: no seed data configured, skipping.');
				return fStepComplete();
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`Solr schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderSolr;
