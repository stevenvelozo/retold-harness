/**
 * Example System: Scoped Integration Service
 *
 * Meadow-integration endpoints and per-entity CRUD endpoints enabled.
 * All other management and generation endpoints are disabled.
 *
 * This represents a service scoped to data transformation workflows
 * against a fixed schema -- e.g. a service on a customer's server that
 * grabs data and performs operations on it.
 *
 * Available endpoints:
 *   /1.0/Retold/Models (and other schema reads)   Always on
 *   /1.0/Retold/MeadowIntegration/*               CSV/TSV/JSON transforms
 *   Per-entity CRUD                                /1.0/Book/:id, etc.
 *
 * NOT available:
 *   Connection management, model upload/delete,
 *   Stricture compilation.
 *
 * Usage:
 *   node example_systems/scoped-integration-service.js
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFable = require('fable');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libRetoldDataService = require('retold-data-service');

const libPath = require('path');

let _Settings = (
	{
		Product: 'RetoldExample-ScopedIntegrationService',
		ProductVersion: '1.0.0',
		APIServerPort: parseInt(process.env.PORT, 10) || 8088,
		LogStreams:
			[
				{
					streamtype: 'console'
				}
			],

		SQLite:
			{
				SQLiteFilePath: libPath.join(__dirname, '..', 'data', 'bookstore.sqlite')
			}
	});

let _Fable = new libFable(_Settings);

_Fable.serviceManager.addServiceType('MeadowSQLiteProvider', libMeadowConnectionSQLite);
_Fable.serviceManager.instantiateServiceProvider('MeadowSQLiteProvider');

_Fable.MeadowSQLiteProvider.connectAsync(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error(`SQLite connection error: ${pError}`);
			process.exit(1);
		}

		_Fable.serviceManager.addServiceType('RetoldDataService', libRetoldDataService);
		_Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
			{
				StorageProvider: 'SQLite',
				StorageProviderModule: 'meadow-connection-sqlite',

				FullMeadowSchemaPath: libPath.join(__dirname, '..', 'source', 'schemas', 'bookstore') + '/',
				FullMeadowSchemaFilename: 'Schema.json',

				// CRUD + data transformation only
				Endpoints:
					{
						ConnectionManager: false,
						ModelManagerWrite: false,
						Stricture: false,
						MeadowIntegration: true,
						MeadowEndpoints: true
					}
			});

		_Fable.RetoldDataService.initializeService(
			(pInitError) =>
			{
				if (pInitError)
				{
					_Fable.log.error(`Initialization error: ${pInitError}`);
					process.exit(1);
				}
				_Fable.log.info(`Scoped Integration Service running on port ${_Settings.APIServerPort}`);
				_Fable.log.info(`CRUD + MeadowIntegration endpoints available.`);
				_Fable.log.info(`Try: curl http://localhost:${_Settings.APIServerPort}/1.0/Books`);
				_Fable.log.info(`Try: curl -X POST http://localhost:${_Settings.APIServerPort}/1.0/Retold/MeadowIntegration/CSV/Check -H "Content-Type: application/json" -d '{"Records":"Name,Age\\nAlice,30\\nBob,25"}'`);
			});
	});
