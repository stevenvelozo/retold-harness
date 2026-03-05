/**
 * Example System: Local CI / Exploration Tool
 *
 * All endpoint groups enabled.  Full access to stricture compilation,
 * meadow-integration transforms, connection management, model management,
 * and per-entity CRUD.
 *
 * Use this configuration for local development, exploring database shape,
 * or as a continuous integration tool where security is not a concern.
 *
 * Available endpoints:
 *   /1.0/Retold/Connection*            Connection management
 *   /1.0/Retold/Model*                 Model upload/delete/connect + schema reads
 *   /1.0/Retold/Stricture/*            DDL compilation and code generation
 *   /1.0/Retold/MeadowIntegration/*    CSV/TSV/JSON data transformation
 *   /meadow-migrationmanager/api/*      Migration manager API (schemas, connections, diff, migrate)
 *   /meadow-migrationmanager/           Migration manager web UI + /lib/*
 *   Per-entity CRUD                    /1.0/Book/:id, /1.0/Books, etc.
 *
 * Usage:
 *   node example_systems/local-ci-exploration.js
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFable = require('fable');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libRetoldDataService = require('retold-data-service');

const libPath = require('path');

let _Settings = (
	{
		Product: 'RetoldExample-LocalCIExploration',
		ProductVersion: '1.0.0',
		APIServerPort: parseInt(process.env.PORT, 10) || 8087,
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

				// Everything enabled for full exploration
				Endpoints:
					{
						ConnectionManager: true,
						ModelManagerWrite: true,
						Stricture: true,
						MeadowIntegration: true,
						MeadowEndpoints: true,
						MigrationManager: true,
						MigrationManagerWebUI: true
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
				_Fable.log.info(`Local CI Exploration Tool running on port ${_Settings.APIServerPort}`);
				_Fable.log.info(`ALL endpoint groups are enabled.`);
				_Fable.log.info(`Try: curl http://localhost:${_Settings.APIServerPort}/1.0/Books`);
				_Fable.log.info(`Try: curl -X POST http://localhost:${_Settings.APIServerPort}/1.0/Retold/Stricture/Compile -H "Content-Type: application/json" -d '{"DDL":"!TestTable\\n@IDTestTable\\n@Name"}'`);
			});
	});
