/**
* Retold Harness Meadow Provider Configurator Base Service
*
* Base orchestrator that chains the lifecycle steps for initializing
* a Retold Harness: connect database, create tables, seed data,
* initialize data service, apply behaviors, and serve web UI.
*
* Concrete subclasses (e.g. Provider-SQLite) override connectDatabase()
* and initializeSchema() with provider-specific logic.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libFableServiceProviderBase = require('fable-serviceproviderbase');

class RetoldHarnessMeadowProviderConfigurator extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';
	}

	/**
	 * Connect to the database engine.
	 * Must be overridden by subclasses.
	 *
	 * @param {function} fCallback - Callback when connection is established
	 */
	connectDatabase(fCallback)
	{
		this.log.error('MeadowProviderConfigurator.connectDatabase() must be overridden by a subclass.');
		return fCallback('connectDatabase not implemented');
	}

	/**
	 * Initialize the schema: create tables and seed data.
	 * Must be overridden by provider subclasses that know how to
	 * get the database handle for the schema provider.
	 *
	 * @param {function} fCallback - Callback when schema is initialized
	 */
	initializeSchema(fCallback)
	{
		this.log.error('MeadowProviderConfigurator.initializeSchema() must be overridden by a subclass.');
		return fCallback('initializeSchema not implemented');
	}

	/**
	 * Initialize the RetoldDataService with the schema provider's options.
	 * This is a base implementation that works for all providers.
	 *
	 * @param {function} fCallback - Callback when data service is initialized
	 */
	initializeDataService(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('MeadowProviderConfigurator.initializeDataService(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpStorageProvider = this.options.StorageProvider || 'SQLite';
		let tmpStorageProviderModule = this.options.StorageProviderModule || 'meadow-connection-sqlite';

		let tmpRetoldDataServiceOptions = tmpSchemaProvider.getRetoldDataServiceOptions(tmpStorageProvider, tmpStorageProviderModule);

		this.fable.serviceManager.addServiceType('RetoldDataService', require('retold-data-service'));
		this.fable.serviceManager.instantiateServiceProvider('RetoldDataService', tmpRetoldDataServiceOptions);

		this.fable.RetoldDataService.initializeService(
			(pInitError) =>
			{
				if (pInitError)
				{
					this.log.error(`Data service initialization error: ${pInitError}`);
					return fCallback(pInitError);
				}

				return fCallback();
			});
	}

	/**
	 * Register loaded MeadowEndpoints models with the ModelManager so
	 * schema enumeration endpoints (/1.0/Retold/Models, etc.) work.
	 *
	 * @param {function} fCallback - Callback when models are registered
	 */
	registerModelsWithModelManager(fCallback)
	{
		let tmpRetoldDataService = this.fable.RetoldDataService;
		let tmpModelManager = this.fable.RetoldDataServiceModelManager;

		if (!tmpRetoldDataService || !tmpModelManager || !tmpRetoldDataService.models)
		{
			this.log.warn('registerModelsWithModelManager: RetoldDataService or ModelManager not available, skipping.');
			return fCallback();
		}

		let tmpModelNames = Object.keys(tmpRetoldDataService.models);
		let tmpAnticipate = this.fable.newAnticipate();

		for (let i = 0; i < tmpModelNames.length; i++)
		{
			let tmpModelName = tmpModelNames[i];
			let tmpModel = tmpRetoldDataService.models[tmpModelName];

			tmpAnticipate.anticipate(
				(fStep) =>
				{
					tmpModelManager.addModel(tmpModelName, tmpModel, fStep);
				});
		}

		tmpAnticipate.wait(fCallback);
	}

	/**
	 * Apply endpoint behaviors from the schema provider.
	 *
	 * @param {function} fCallback - Callback when behaviors are applied
	 */
	applyBehaviors(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.warn('MeadowProviderConfigurator.applyBehaviors(): No HarnessSchemaProvider registered, skipping.');
			return fCallback();
		}

		return tmpSchemaProvider.applyBehaviors(fCallback);
	}

	/**
	 * Serve the web UI at the root URL.
	 *
	 * @param {function} fCallback - Callback when web UI is registered
	 */
	serveWebUI(fCallback)
	{
		let tmpWebUIPath = libPath.join(__dirname, '..', 'web', 'index.html');

		if (!libFS.existsSync(tmpWebUIPath))
		{
			this.log.warn(`MeadowProviderConfigurator.serveWebUI(): Web UI file not found at ${tmpWebUIPath}, skipping.`);
			return fCallback();
		}

		let tmpWebUIHTML = libFS.readFileSync(tmpWebUIPath, 'utf8');

		this.fable.OratorServiceServer.server.get('/',
			(pRequest, pResponse, fNext) =>
			{
				pResponse.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				pResponse.end(tmpWebUIHTML);
				return fNext();
			});

		return fCallback();
	}

	/**
	 * Main entry point. Chains all lifecycle steps via Anticipate.
	 *
	 * @param {function} fCallback - Callback when harness is fully initialized
	 */
	initializeHarness(fCallback)
	{
		let tmpAnticipate = this.fable.newAnticipate();

		tmpAnticipate.anticipate(this.connectDatabase.bind(this));
		tmpAnticipate.anticipate(this.initializeSchema.bind(this));
		tmpAnticipate.anticipate(this.initializeDataService.bind(this));
		tmpAnticipate.anticipate(this.registerModelsWithModelManager.bind(this));
		tmpAnticipate.anticipate(this.applyBehaviors.bind(this));
		tmpAnticipate.anticipate(this.serveWebUI.bind(this));

		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				let tmpPort = this.fable.settings.APIServerPort || 8086;
				this.log.info(`Retold Harness running on port ${tmpPort}`);
				this.log.info(`Web UI available at http://localhost:${tmpPort}/`);
				return fStepComplete();
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`Harness initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessMeadowProviderConfigurator;
