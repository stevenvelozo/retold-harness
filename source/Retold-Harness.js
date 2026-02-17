const libPath = require('path');
const libFS = require('fs');

const _Settings = require('./configuration-bookstore-serve-api.js');

const libFable = require('fable');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');

// Initialize fable
_Fable = new libFable(_Settings);

// Ensure the data directory exists
let tmpDataDir = libPath.dirname(_Settings.SQLite.SQLiteFilePath);
if (!libFS.existsSync(tmpDataDir))
{
	libFS.mkdirSync(tmpDataDir, { recursive: true });
}

// Register and connect the SQLite provider
_Fable.serviceManager.addServiceType('MeadowSQLiteProvider', libMeadowConnectionSQLite);
_Fable.serviceManager.instantiateServiceProvider('MeadowSQLiteProvider');

_Fable.MeadowSQLiteProvider.connectAsync(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error(`SQLite connection error: ${pError}`);
			return process.exit(1);
		}

		let tmpDB = _Fable.MeadowSQLiteProvider.db;

		// Create the BookStore schema tables
		let tmpCreateSQL = libFS.readFileSync(libPath.join(__dirname, 'model', 'sqlite_create', 'BookStore-CreateSQLiteTables.sql'), 'utf8');
		tmpDB.exec(tmpCreateSQL);

		// Check if the database has been seeded already
		let tmpRowCount = tmpDB.prepare('SELECT COUNT(*) AS cnt FROM Book').get();
		if (tmpRowCount.cnt < 1)
		{
			_Fable.log.info('Seeding initial BookStore data...');
			let tmpSeedSQL = libFS.readFileSync(libPath.join(__dirname, 'model', 'sqlite_create', 'BookStore-SeedData.sql'), 'utf8');
			tmpDB.exec(tmpSeedSQL);
			_Fable.log.info('Seed data loaded.');
		}

		// Add the data service type and initialize it
		_Fable.serviceManager.addServiceType('RetoldDataService', require('retold-data-service'));
		_Fable.serviceManager.instantiateServiceProvider('RetoldDataService', _Settings.RetoldDataServiceOptions);

		_Fable.RetoldDataService.initializeService(
			(pInitError) =>
			{
				if (pInitError)
				{
					_Fable.log.error(`Data service initialization error: ${pInitError}`);
					return process.exit(1);
				}

				// Create a post operation behavior for the book Read singular record endpoint only
				_Fable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
					(pRequest, pRequestState, fRequestComplete) =>
					{
						// Get the join records
						_Fable.DAL.BookAuthorJoin.doReads(_Fable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
							(pJoinReadError, pJoinReadQuery, pJoinRecords) =>
							{
								if (pJoinRecords.length < 1)
								{
									_Fable.log.trace(`Found no authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).  What even is a book without authors?`)
									pRequestState.Record.Authors = [];
									return fRequestComplete();
								}

								let tmpAuthors = [];
								let tmpRemaining = pJoinRecords.length;

								for (let j = 0; j < pJoinRecords.length; j++)
								{
									_Fable.DAL.Author.doRead(_Fable.DAL.Author.query.addFilter('IDAuthor', pJoinRecords[j].IDAuthor),
										(pReadError, pReadQuery, pAuthor) =>
										{
											if (pAuthor && pAuthor.IDAuthor)
											{
												tmpAuthors.push(pAuthor);
											}
											tmpRemaining--;
											if (tmpRemaining <= 0)
											{
												pRequestState.Record.Authors = tmpAuthors;
												_Fable.log.info(`Found ${tmpAuthors.length} authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).`)
												return fRequestComplete();
											}
										});
								}
							});
					});

				// Serve the web UI at the root URL
			let tmpWebUIHTML = libFS.readFileSync(libPath.join(__dirname, 'web', 'index.html'), 'utf8');
			_Fable.OratorServiceServer.server.get('/',
				(pRequest, pResponse, fNext) =>
				{
					pResponse.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
					pResponse.end(tmpWebUIHTML);
					return fNext();
				});

			_Fable.log.info(`Retold Harness running on port ${_Settings.APIServerPort} with SQLite`);
			_Fable.log.info(`Web UI available at http://localhost:${_Settings.APIServerPort}/`);
			});
	});
