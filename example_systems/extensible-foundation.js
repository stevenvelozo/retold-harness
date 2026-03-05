/**
 * Example System: Extensible Foundation Library
 *
 * Schema reads, model management (for runtime loading), and per-entity CRUD.
 * No stricture or meadow-integration.  Demonstrates adding custom endpoints
 * via the onAfterInitialize lifecycle hook.
 *
 * This is the pattern for building an application on top of retold-data-service
 * where you load schemas at runtime and add your own custom routes alongside
 * the auto-generated CRUD.
 *
 * Available endpoints:
 *   /1.0/Retold/Models (and other schema reads)   Always on
 *   /1.0/Retold/Model (POST, DEL, Connect)        Model management writes
 *   Per-entity CRUD                                /1.0/Book/:id, etc.
 *   /1.0/Catalog/Summary                           Custom endpoint (added below)
 *
 * NOT available:
 *   Connection management, Stricture compilation,
 *   MeadowIntegration transforms.
 *
 * Usage:
 *   node example_systems/extensible-foundation.js
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFable = require('fable');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libRetoldDataService = require('retold-data-service');

const libPath = require('path');

let _Settings = (
	{
		Product: 'RetoldExample-ExtensibleFoundation',
		ProductVersion: '1.0.0',
		APIServerPort: parseInt(process.env.PORT, 10) || 8089,
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
		let tmpDataService = _Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
			{
				StorageProvider: 'SQLite',
				StorageProviderModule: 'meadow-connection-sqlite',

				FullMeadowSchemaPath: libPath.join(__dirname, '..', 'source', 'schemas', 'bookstore') + '/',
				FullMeadowSchemaFilename: 'Schema.json',

				// CRUD + model management for runtime loading
				Endpoints:
					{
						ConnectionManager: false,
						ModelManagerWrite: true,
						Stricture: false,
						MeadowIntegration: false,
						MeadowEndpoints: true
					}
			});

		// Use the onAfterInitialize hook to register custom endpoints
		// alongside the auto-generated CRUD routes.
		tmpDataService.onAfterInitialize = (fCallback) =>
		{
			// Custom endpoint: GET /1.0/Catalog/Summary
			// Returns a summary of all loaded entities and models.
			_Fable.OratorServiceServer.get('/1.0/Catalog/Summary',
				(pRequest, pResponse, fNext) =>
				{
					let tmpSummary = (
						{
							Product: _Settings.Product,
							Entities: tmpDataService.entityList || [],
							Models: _Fable.RetoldDataServiceModelManager.getModels(),
							Message: 'This is a custom endpoint added via onAfterInitialize.'
						});
					pResponse.send(200, tmpSummary);
					return fNext();
				});

			// Custom endpoint: GET /1.0/Catalog/BooksByGenre/:Genre
			// A domain-specific query endpoint wrapping the DAL directly.
			_Fable.OratorServiceServer.get('/1.0/Catalog/BooksByGenre/:Genre',
				(pRequest, pResponse, fNext) =>
				{
					if (!_Fable.DAL || !_Fable.DAL.Book)
					{
						pResponse.send(500, { Error: 'Book DAL not available.' });
						return fNext();
					}

					let tmpQuery = _Fable.DAL.Book.query
						.addFilter('Genre', pRequest.params.Genre);

					_Fable.DAL.Book.doReads(tmpQuery,
						(pReadError, pQuery, pRecords) =>
						{
							if (pReadError)
							{
								pResponse.send(500, { Error: pReadError.message || pReadError });
								return fNext();
							}
							pResponse.send(200, pRecords);
							return fNext();
						});
				});

			_Fable.log.info('Custom endpoints registered: /1.0/Catalog/Summary, /1.0/Catalog/BooksByGenre/:Genre');
			return fCallback();
		};

		tmpDataService.initializeService(
			(pInitError) =>
			{
				if (pInitError)
				{
					_Fable.log.error(`Initialization error: ${pInitError}`);
					process.exit(1);
				}
				_Fable.log.info(`Extensible Foundation running on port ${_Settings.APIServerPort}`);
				_Fable.log.info(`CRUD + Model management + custom endpoints available.`);
				_Fable.log.info(`Try: curl http://localhost:${_Settings.APIServerPort}/1.0/Catalog/Summary`);
				_Fable.log.info(`Try: curl http://localhost:${_Settings.APIServerPort}/1.0/Catalog/BooksByGenre/Fantasy`);
			});
	});
