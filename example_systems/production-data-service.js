/**
 * Example System: Production Data Service
 *
 * Serves only the per-entity CRUD endpoints and schema read endpoints.
 * All management, stricture, and integration endpoints are disabled.
 *
 * This is the default retold-data-service configuration -- only
 * MeadowEndpoints is true out of the box.
 *
 * Available endpoints:
 *   GET  /1.0/Retold/Models                              (always on)
 *   GET  /1.0/Retold/Model/:Name                         (always on)
 *   GET  /1.0/Retold/Model/:Name/Entities                (always on)
 *   GET  /1.0/Retold/Model/:Name/Entity/:EntityName      (always on)
 *   Per-entity CRUD: /1.0/Book/:id, /1.0/Books, etc.
 *
 * NOT available:
 *   Connection management, model upload/delete/connect,
 *   Stricture compilation, MeadowIntegration transforms.
 *
 * Usage:
 *   node example_systems/production-data-service.js
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFable = require('fable');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libRetoldDataService = require('retold-data-service');

const libPath = require('path');

let _Settings = (
	{
		Product: 'RetoldExample-ProductionDataService',
		ProductVersion: '1.0.0',
		APIServerPort: parseInt(process.env.PORT, 10) || 8086,
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

// Connect SQLite
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

		// Register RetoldDataService with the default endpoint configuration.
		// Only MeadowEndpoints is enabled by default.
		_Fable.serviceManager.addServiceType('RetoldDataService', libRetoldDataService);
		_Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
			{
				StorageProvider: 'SQLite',
				StorageProviderModule: 'meadow-connection-sqlite',

				FullMeadowSchemaPath: libPath.join(__dirname, '..', 'source', 'schemas', 'bookstore') + '/',
				FullMeadowSchemaFilename: 'Schema.json',

				// Default Endpoints config -- only MeadowEndpoints is true.
				// Schema read routes are always available regardless.
				Endpoints:
					{
						ConnectionManager: false,
						ModelManagerWrite: false,
						Stricture: false,
						MeadowIntegration: false,
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
				_Fable.log.info(`Production Data Service running on port ${_Settings.APIServerPort}`);
				_Fable.log.info(`Try: curl http://localhost:${_Settings.APIServerPort}/1.0/Books`);
			});
	});
