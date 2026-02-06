/**
* Unit tests for Retold Harness
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

var Chai = require("chai");
var Expect = Chai.expect;

const libFable = require('fable');
const libSuperTest = require('supertest');
const libMeadowConnectionSQLite = require('meadow-connection-sqlite');
const libRetoldDataService = require('retold-data-service');

const _APIServerPort = 9399;
const _BaseURL = `http://localhost:${_APIServerPort}/`;

let _Fable;
let _RetoldDataService;
let _SuperTest;

suite
(
	'Retold Harness',
	function()
	{
		suiteSetup
		(
			function(fDone)
			{
				this.timeout(10000);

				let tmpSettings = {
					Product: 'RetoldHarnessTest',
					ProductVersion: '1.0.0',
					APIServerPort: _APIServerPort,
					SQLite:
						{
							SQLiteFilePath: ':memory:'
						},
					LogStreams:
						[
							{
								streamtype: 'console',
								level: 'fatal'
							}
						]
				};

				_Fable = new libFable(tmpSettings);

				// Register the SQLite provider
				_Fable.serviceManager.addServiceType('MeadowSQLiteProvider', libMeadowConnectionSQLite);
				_Fable.serviceManager.instantiateServiceProvider('MeadowSQLiteProvider');

				_Fable.MeadowSQLiteProvider.connectAsync(
					(pError) =>
					{
						if (pError)
						{
							return fDone(pError);
						}

						let tmpDB = _Fable.MeadowSQLiteProvider.db;

						// Create all 8 tables for the BookStore model
						tmpDB.exec(`
							CREATE TABLE IF NOT EXISTS User (
								IDUser INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDUser INTEGER DEFAULT 0,
								LoginID TEXT DEFAULT '',
								Password TEXT DEFAULT '',
								NameFirst TEXT DEFAULT '',
								NameLast TEXT DEFAULT '',
								FullName TEXT DEFAULT '',
								Config TEXT DEFAULT ''
							);
							CREATE TABLE IF NOT EXISTS Book (
								IDBook INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBook TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								Title TEXT DEFAULT '',
								Type TEXT DEFAULT '',
								Genre TEXT DEFAULT '',
								ISBN TEXT DEFAULT '',
								Language TEXT DEFAULT '',
								ImageURL TEXT DEFAULT '',
								PublicationYear INTEGER DEFAULT 0
							);
							CREATE TABLE IF NOT EXISTS BookAuthorJoin (
								IDBookAuthorJoin INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBookAuthorJoin TEXT DEFAULT '',
								IDBook INTEGER DEFAULT 0,
								IDAuthor INTEGER DEFAULT 0
							);
							CREATE TABLE IF NOT EXISTS Author (
								IDAuthor INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDAuthor TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								Name TEXT DEFAULT '',
								IDUser INTEGER DEFAULT 0
							);
							CREATE TABLE IF NOT EXISTS BookPrice (
								IDBookPrice INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBookPrice TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								Price REAL DEFAULT 0,
								StartDate TEXT DEFAULT '',
								EndDate TEXT DEFAULT '',
								Discountable INTEGER DEFAULT 0,
								CouponCode TEXT DEFAULT '',
								IDBook INTEGER DEFAULT 0
							);
							CREATE TABLE IF NOT EXISTS BookStore (
								IDBookStore INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBookStore TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								Name TEXT DEFAULT '',
								Address TEXT DEFAULT '',
								City TEXT DEFAULT '',
								State TEXT DEFAULT '',
								Postal TEXT DEFAULT '',
								Country TEXT DEFAULT ''
							);
							CREATE TABLE IF NOT EXISTS BookStoreInventory (
								IDBookStoreInventory INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDBookStoreInventory TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								StockDate TEXT DEFAULT '',
								BookCount INTEGER DEFAULT 0,
								AggregateBookCount INTEGER DEFAULT 0,
								IDBook INTEGER DEFAULT 0,
								IDBookStore INTEGER DEFAULT 0,
								IDBookPrice INTEGER DEFAULT 0,
								StockingAssociate INTEGER DEFAULT 0
							);
							CREATE TABLE IF NOT EXISTS Review (
								IDReview INTEGER PRIMARY KEY AUTOINCREMENT,
								GUIDReview TEXT DEFAULT '',
								CreateDate TEXT DEFAULT '',
								CreatingIDUser INTEGER DEFAULT 0,
								UpdateDate TEXT DEFAULT '',
								UpdatingIDUser INTEGER DEFAULT 0,
								Deleted INTEGER DEFAULT 0,
								DeleteDate TEXT DEFAULT '',
								DeletingIDUser INTEGER DEFAULT 0,
								Text TEXT DEFAULT '',
								Rating INTEGER DEFAULT 0,
								IDBook INTEGER DEFAULT 0,
								IDUser INTEGER DEFAULT 0
							);
						`);

						// Seed Users
						let tmpInsertUser = tmpDB.prepare(
							`INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
						tmpInsertUser.run(1, 1001, 'admin', 'hash123', 'Admin', 'User', 'Admin User', '{}');
						tmpInsertUser.run(2, 1002, 'jdoe', 'hash456', 'Jane', 'Doe', 'Jane Doe', '{}');
						tmpInsertUser.run(3, 1003, 'bsmith', 'hash789', 'Bob', 'Smith', 'Bob Smith', '{}');

						// Seed Books
						let tmpInsertBook = tmpDB.prepare(
							`INSERT INTO Book (IDBook, GUIDBook, Title, Type, Genre, ISBN, Language, ImageURL, PublicationYear, Deleted)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`);
						tmpInsertBook.run(1, 'guid-book-001', 'Dune', 'Fiction', 'Science Fiction', '978-0441172719', 'English', 'https://example.com/dune.jpg', 1965);
						tmpInsertBook.run(2, 'guid-book-002', 'Neuromancer', 'Fiction', 'Science Fiction', '978-0441569595', 'English', 'https://example.com/neuromancer.jpg', 1984);
						tmpInsertBook.run(3, 'guid-book-003', 'Foundation', 'Fiction', 'Science Fiction', '978-0553293357', 'English', 'https://example.com/foundation.jpg', 1951);
						tmpInsertBook.run(4, 'guid-book-004', 'Snow Crash', 'Fiction', 'Cyberpunk', '978-0553380958', 'English', 'https://example.com/snowcrash.jpg', 1992);
						tmpInsertBook.run(5, 'guid-book-005', 'The Hobbit', 'Fiction', 'Fantasy', '978-0547928227', 'English', 'https://example.com/hobbit.jpg', 1937);
						tmpInsertBook.run(6, 'guid-book-006', 'Le Petit Prince', 'Fiction', 'Fantasy', '978-2070612758', 'French', 'https://example.com/petit.jpg', 1943);

						// Seed Authors
						let tmpInsertAuthor = tmpDB.prepare(
							`INSERT INTO Author (IDAuthor, GUIDAuthor, Name, IDUser, Deleted)
							 VALUES (?, ?, ?, ?, 0)`);
						tmpInsertAuthor.run(1, 'guid-author-001', 'Frank Herbert', 0);
						tmpInsertAuthor.run(2, 'guid-author-002', 'William Gibson', 0);
						tmpInsertAuthor.run(3, 'guid-author-003', 'Isaac Asimov', 0);
						tmpInsertAuthor.run(4, 'guid-author-004', 'Neal Stephenson', 0);
						tmpInsertAuthor.run(5, 'guid-author-005', 'J.R.R. Tolkien', 0);

						// Seed BookAuthorJoins
						let tmpInsertJoin = tmpDB.prepare(
							`INSERT INTO BookAuthorJoin (IDBookAuthorJoin, GUIDBookAuthorJoin, IDBook, IDAuthor)
							 VALUES (?, ?, ?, ?)`);
						tmpInsertJoin.run(1, 'guid-join-001', 1, 1);  // Dune -> Frank Herbert
						tmpInsertJoin.run(2, 'guid-join-002', 2, 2);  // Neuromancer -> William Gibson
						tmpInsertJoin.run(3, 'guid-join-003', 3, 3);  // Foundation -> Isaac Asimov
						tmpInsertJoin.run(4, 'guid-join-004', 4, 4);  // Snow Crash -> Neal Stephenson
						tmpInsertJoin.run(5, 'guid-join-005', 5, 5);  // The Hobbit -> Tolkien

						// Seed BookPrices
						let tmpInsertPrice = tmpDB.prepare(
							`INSERT INTO BookPrice (IDBookPrice, GUIDBookPrice, Price, Discountable, CouponCode, IDBook, Deleted)
							 VALUES (?, ?, ?, ?, ?, ?, 0)`);
						tmpInsertPrice.run(1, 'guid-price-001', 14.99, 1, 'SAVE10', 1);
						tmpInsertPrice.run(2, 'guid-price-002', 12.99, 0, '', 2);
						tmpInsertPrice.run(3, 'guid-price-003', 9.99, 1, 'CLASSIC', 3);

						// Seed BookStores
						let tmpInsertStore = tmpDB.prepare(
							`INSERT INTO BookStore (IDBookStore, GUIDBookStore, Name, Address, City, State, Postal, Country, Deleted)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`);
						tmpInsertStore.run(1, 'guid-store-001', 'Downtown Books', '123 Main St', 'Portland', 'OR', '97201', 'US');
						tmpInsertStore.run(2, 'guid-store-002', 'Campus Reads', '456 University Ave', 'Seattle', 'WA', '98105', 'US');

						// Seed BookStoreInventory
						let tmpInsertInventory = tmpDB.prepare(
							`INSERT INTO BookStoreInventory (IDBookStoreInventory, GUIDBookStoreInventory, BookCount, AggregateBookCount, IDBook, IDBookStore, IDBookPrice, StockingAssociate, Deleted)
							 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`);
						tmpInsertInventory.run(1, 'guid-inv-001', 15, 15, 1, 1, 1, 1);
						tmpInsertInventory.run(2, 'guid-inv-002', 8, 8, 2, 1, 2, 1);
						tmpInsertInventory.run(3, 'guid-inv-003', 20, 20, 1, 2, 1, 2);

						// Seed Reviews
						let tmpInsertReview = tmpDB.prepare(
							`INSERT INTO Review (IDReview, GUIDReview, Text, Rating, IDBook, IDUser, Deleted)
							 VALUES (?, ?, ?, ?, ?, ?, 0)`);
						tmpInsertReview.run(1, 'guid-review-001', 'A masterpiece of science fiction', 5, 1, 2);
						tmpInsertReview.run(2, 'guid-review-002', 'Visionary cyberpunk', 4, 2, 2);
						tmpInsertReview.run(3, 'guid-review-003', 'The original sci-fi epic', 5, 3, 3);
						tmpInsertReview.run(4, 'guid-review-004', 'Fun and inventive', 4, 4, 3);

						// Register and initialize the RetoldDataService with SQLite config
						_Fable.serviceManager.addServiceType('RetoldDataService', libRetoldDataService);
						_RetoldDataService = _Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
							{
								FullMeadowSchemaPath: `${__dirname}/../source/model/`,
								FullMeadowSchemaFilename: `MeadowModel-Extended.json`,

								StorageProvider: 'SQLite',
								StorageProviderModule: 'meadow-connection-sqlite',

								AutoInitializeDataService: true,
								AutoStartOrator: true
							});

						_RetoldDataService.initializeService(
							(pInitError) =>
							{
								if (pInitError)
								{
									return fDone(pInitError);
								}

								// Install the Author enrichment behavior hook on Book Read,
								// mirroring the production harness behavior from Retold-Harness.js.
								// Note: The production harness uses an IN filter for author lookups,
								// which requires the MySQL provider.  For SQLite testing we look up
								// each author individually, producing the same enriched result.
								_Fable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
									(pRequest, pRequestState, fRequestComplete) =>
									{
										_Fable.DAL.BookAuthorJoin.doReads(_Fable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
											(pJoinReadError, pJoinReadQuery, pJoinRecords) =>
											{
												if (pJoinRecords.length < 1)
												{
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
																return fRequestComplete();
															}
														});
												}
											});
									});

								_SuperTest = libSuperTest(_BaseURL);
								fDone();
							});
					});
			}
		);

		suiteTeardown
		(
			function(fDone)
			{
				this.timeout(5000);
				// Close the database
				if (_Fable && _Fable.MeadowSQLiteProvider && _Fable.MeadowSQLiteProvider.db)
				{
					try { _Fable.MeadowSQLiteProvider.db.close(); }
					catch (pIgnore) { /* already closed */ }
				}
				// Close the server directly to avoid keep-alive hangs
				if (_Fable && _Fable.OratorServiceServer && _Fable.OratorServiceServer.Active && _Fable.OratorServiceServer.server)
				{
					_Fable.OratorServiceServer.server.close(
						() =>
						{
							_Fable.OratorServiceServer.Active = false;
							fDone();
						});
				}
				else
				{
					fDone();
				}
			}
		);

		suite
		(
			'Object Sanity',
			function()
			{
				test
				(
					'RetoldDataService class should exist',
					function()
					{
						Expect(libRetoldDataService).to.be.a('function');
					}
				);
				test
				(
					'RetoldDataService instance should have been created',
					function()
					{
						Expect(_RetoldDataService).to.be.an('object');
						Expect(_RetoldDataService.serviceType).to.equal('RetoldDataService');
					}
				);
				test
				(
					'RetoldDataService should be initialized',
					function()
					{
						Expect(_RetoldDataService.serviceInitialized).to.equal(true);
					}
				);
				test
				(
					'Should have loaded the full model',
					function()
					{
						Expect(_RetoldDataService.fullModel).to.be.an('object');
						Expect(_RetoldDataService.fullModel.Tables).to.be.an('object');
					}
				);
				test
				(
					'Should have all 8 entities in the entity list',
					function()
					{
						Expect(_RetoldDataService.entityList).to.be.an('array');
						Expect(_RetoldDataService.entityList.length).to.equal(8);
						Expect(_RetoldDataService.entityList).to.include('User');
						Expect(_RetoldDataService.entityList).to.include('Book');
						Expect(_RetoldDataService.entityList).to.include('BookAuthorJoin');
						Expect(_RetoldDataService.entityList).to.include('Author');
						Expect(_RetoldDataService.entityList).to.include('BookPrice');
						Expect(_RetoldDataService.entityList).to.include('BookStore');
						Expect(_RetoldDataService.entityList).to.include('BookStoreInventory');
						Expect(_RetoldDataService.entityList).to.include('Review');
					}
				);
				test
				(
					'Should have created DAL objects for all 8 entities',
					function()
					{
						Expect(_Fable.DAL).to.be.an('object');
						Expect(_Fable.DAL.User).to.be.an('object');
						Expect(_Fable.DAL.Book).to.be.an('object');
						Expect(_Fable.DAL.BookAuthorJoin).to.be.an('object');
						Expect(_Fable.DAL.Author).to.be.an('object');
						Expect(_Fable.DAL.BookPrice).to.be.an('object');
						Expect(_Fable.DAL.BookStore).to.be.an('object');
						Expect(_Fable.DAL.BookStoreInventory).to.be.an('object');
						Expect(_Fable.DAL.Review).to.be.an('object');
					}
				);
				test
				(
					'Should have created MeadowEndpoints for all 8 entities',
					function()
					{
						Expect(_Fable.MeadowEndpoints).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.User).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.Book).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.BookAuthorJoin).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.Author).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.BookPrice).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.BookStore).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.BookStoreInventory).to.be.an('object');
						Expect(_Fable.MeadowEndpoints.Review).to.be.an('object');
					}
				);
				test
				(
					'DAL objects should be configured with SQLite provider',
					function()
					{
						Expect(_Fable.DAL.User.providerName).to.equal('SQLite');
						Expect(_Fable.DAL.Book.providerName).to.equal('SQLite');
						Expect(_Fable.DAL.Author.providerName).to.equal('SQLite');
						Expect(_Fable.DAL.BookStore.providerName).to.equal('SQLite');
						Expect(_Fable.DAL.Review.providerName).to.equal('SQLite');
					}
				);
			}
		);

		suite
		(
			'Service Lifecycle',
			function()
			{
				test
				(
					'Should error when initializing an already-initialized service',
					function(fDone)
					{
						_RetoldDataService.initializeService(
							(pError) =>
							{
								Expect(pError).to.be.an.instanceof(Error);
								Expect(pError.message).to.contain('already been initialized');
								fDone();
							});
					}
				);
				test
				(
					'Should have lifecycle hooks',
					function()
					{
						Expect(_RetoldDataService.onBeforeInitialize).to.be.a('function');
						Expect(_RetoldDataService.onInitialize).to.be.a('function');
						Expect(_RetoldDataService.onAfterInitialize).to.be.a('function');
					}
				);
				test
				(
					'Should have stopService method',
					function()
					{
						Expect(_RetoldDataService.stopService).to.be.a('function');
					}
				);
			}
		);

		suite
		(
			'User CRUD Endpoints',
			function()
			{
				test
				(
					'Read a single User by ID',
					function(fDone)
					{
						_SuperTest
							.get('1.0/User/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDUser).to.equal(1);
									Expect(tmpRecord.LoginID).to.equal('admin');
									Expect(tmpRecord.FullName).to.equal('Admin User');
									fDone();
								});
					}
				);
				test
				(
					'Read all Users',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Users')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Create a new User',
					function(fDone)
					{
						_SuperTest
							.post('1.0/User')
							.send(
								{
									LoginID: 'newuser',
									Password: 'hashabc',
									NameFirst: 'New',
									NameLast: 'User',
									FullName: 'New User',
									Config: '{}'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDUser).to.be.greaterThan(0);
									Expect(tmpRecord.LoginID).to.equal('newuser');
									Expect(tmpRecord.FullName).to.equal('New User');
									fDone();
								});
					}
				);
				test
				(
					'Update a User',
					function(fDone)
					{
						_SuperTest
							.put('1.0/User')
							.send(
								{
									IDUser: 1,
									FullName: 'Super Admin'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDUser).to.equal(1);
									Expect(tmpRecord.FullName).to.equal('Super Admin');
									fDone();
								});
					}
				);
				test
				(
					'Count Users',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Users/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(4);
									fDone();
								});
					}
				);
				test
				(
					'Get User schema endpoint',
					function(fDone)
					{
						_SuperTest
							.get('1.0/User/Schema')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpSchema = JSON.parse(pResponse.text);
									Expect(tmpSchema).to.be.an('object');
									Expect(tmpSchema.title).to.equal('User');
									Expect(tmpSchema.properties).to.be.an('object');
									Expect(tmpSchema.properties.LoginID).to.be.an('object');
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'Book CRUD Endpoints',
			function()
			{
				test
				(
					'Read a single Book by ID',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.Title).to.equal('Dune');
									Expect(tmpRecord.Genre).to.equal('Science Fiction');
									Expect(tmpRecord.PublicationYear).to.equal(1965);
									Expect(tmpRecord.ImageURL).to.equal('https://example.com/dune.jpg');
									fDone();
								});
					}
				);
				test
				(
					'Read all Books',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(6);
									fDone();
								});
					}
				);
				test
				(
					'Read Books with EQ filter on Genre',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/FilteredTo/FBV~Genre~EQ~Fantasy')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(2);
									fDone();
								});
					}
				);
				test
				(
					'Read Books with LIKE filter on Title',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/FilteredTo/FBV~Title~LK~%25Dune%25')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].Title).to.equal('Dune');
									fDone();
								});
					}
				);
				test
				(
					'Read Books with filter on Language',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/FilteredTo/FBV~Language~EQ~French')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].Title).to.equal('Le Petit Prince');
									fDone();
								});
					}
				);
				test
				(
					'Read Books with pagination (cap)',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/0/3')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Read Books with pagination (begin + cap)',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/3/3')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Count all Books',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(6);
									fDone();
								});
					}
				);
				test
				(
					'Count Books with filter',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/Count/FilteredTo/FBV~Genre~EQ~Science Fiction')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Create a new Book',
					function(fDone)
					{
						_SuperTest
							.post('1.0/Book')
							.send(
								{
									Title: 'Enders Game',
									Type: 'Fiction',
									Genre: 'Science Fiction',
									ISBN: '978-0812550702',
									Language: 'English',
									PublicationYear: 1985
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBook).to.be.greaterThan(0);
									Expect(tmpRecord.Title).to.equal('Enders Game');
									Expect(tmpRecord.GUIDBook).to.be.a('string');
									Expect(tmpRecord.GUIDBook.length).to.be.greaterThan(5);
									fDone();
								});
					}
				);
				test
				(
					'Verify Book count after create',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(7);
									fDone();
								});
					}
				);
				test
				(
					'Update a Book',
					function(fDone)
					{
						_SuperTest
							.put('1.0/Book')
							.send(
								{
									IDBook: 1,
									Title: 'Dune (Updated Edition)'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.Title).to.equal('Dune (Updated Edition)');
									fDone();
								});
					}
				);
				test
				(
					'Verify update persisted',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.Title).to.equal('Dune (Updated Edition)');
									fDone();
								});
					}
				);
				test
				(
					'Delete a Book (soft delete)',
					function(fDone)
					{
						_SuperTest
							.del('1.0/Book/6')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Verify deleted Book is excluded from count',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(6);
									fDone();
								});
					}
				);
				test
				(
					'Read a non-existent Book returns 404',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/999')
							.expect(404)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Error).to.equal('Record not Found');
									fDone();
								});
					}
				);
				test
				(
					'Get Book schema endpoint',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/Schema')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpSchema = JSON.parse(pResponse.text);
									Expect(tmpSchema).to.be.an('object');
									Expect(tmpSchema.title).to.equal('Book');
									Expect(tmpSchema.properties).to.be.an('object');
									Expect(tmpSchema.properties.Title).to.be.an('object');
									Expect(tmpSchema.properties.Genre).to.be.an('object');
									fDone();
								});
					}
				);
				test
				(
					'Get a new default Book record',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/Schema/New')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord).to.be.an('object');
									Expect(tmpRecord.IDBook).to.equal(0);
									Expect(tmpRecord.Title).to.equal('');
									Expect(tmpRecord.Genre).to.equal('');
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'Author CRUD Endpoints',
			function()
			{
				test
				(
					'Read a single Author',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Author/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDAuthor).to.equal(1);
									Expect(tmpRecord.Name).to.equal('Frank Herbert');
									fDone();
								});
					}
				);
				test
				(
					'Read all Authors',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Authors')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(5);
									fDone();
								});
					}
				);
				test
				(
					'Filter Authors by name LIKE',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Authors/FilteredTo/FBV~Name~LK~%25Gibson%25')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].Name).to.equal('William Gibson');
									fDone();
								});
					}
				);
				test
				(
					'Create a new Author',
					function(fDone)
					{
						_SuperTest
							.post('1.0/Author')
							.send({ Name: 'Antoine de Saint-Exupery' })
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDAuthor).to.be.greaterThan(0);
									Expect(tmpRecord.Name).to.equal('Antoine de Saint-Exupery');
									fDone();
								});
					}
				);
				test
				(
					'Update an Author',
					function(fDone)
					{
						_SuperTest
							.put('1.0/Author')
							.send({ IDAuthor: 1, Name: 'Frank P. Herbert' })
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDAuthor).to.equal(1);
									Expect(tmpRecord.Name).to.equal('Frank P. Herbert');
									fDone();
								});
					}
				);
				test
				(
					'Count Authors',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Authors/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(6);
									fDone();
								});
					}
				);
				test
				(
					'Delete an Author (soft delete)',
					function(fDone)
					{
						_SuperTest
							.del('1.0/Author/6')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Verify Author soft delete in count',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Authors/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(5);
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'Book-Author Enrichment (Behavior Injection)',
			function()
			{
				test
				(
					'Single Book read should include Authors array',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.Authors).to.be.an('array');
									Expect(tmpRecord.Authors.length).to.equal(1);
									Expect(tmpRecord.Authors[0].Name).to.equal('Frank P. Herbert');
									fDone();
								});
					}
				);
				test
				(
					'Book with mapped author should have correct Author data',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Book/2')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBook).to.equal(2);
									Expect(tmpRecord.Title).to.equal('Neuromancer');
									Expect(tmpRecord.Authors).to.be.an('array');
									Expect(tmpRecord.Authors.length).to.equal(1);
									Expect(tmpRecord.Authors[0].Name).to.equal('William Gibson');
									fDone();
								});
					}
				);
				test
				(
					'Book without mapped author should have empty Authors array',
					function(fDone)
					{
						// The newly created book (Enders Game, IDBook 7) has no join records
						_SuperTest
							.get('1.0/Book/7')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.Title).to.equal('Enders Game');
									Expect(tmpRecord.Authors).to.be.an('array');
									Expect(tmpRecord.Authors.length).to.equal(0);
									fDone();
								});
					}
				);
				test
				(
					'Multi-Book reads should NOT include Authors array',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Books/0/3')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									// Behavior hook is only on Read (singular), not Reads
									Expect(tmpRecords[0]).to.not.have.property('Authors');
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'BookAuthorJoin Endpoints',
			function()
			{
				test
				(
					'Read all BookAuthorJoins',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookAuthorJoins')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(5);
									fDone();
								});
					}
				);
				test
				(
					'Read a single BookAuthorJoin',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookAuthorJoin/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookAuthorJoin).to.equal(1);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.IDAuthor).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Filter joins by IDBook',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookAuthorJoins/FilteredTo/FBV~IDBook~EQ~1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].IDAuthor).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Create a BookAuthorJoin',
					function(fDone)
					{
						_SuperTest
							.post('1.0/BookAuthorJoin')
							.send({ IDBook: 7, IDAuthor: 3 })
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookAuthorJoin).to.be.greaterThan(0);
									Expect(tmpRecord.IDBook).to.equal(7);
									Expect(tmpRecord.IDAuthor).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Count BookAuthorJoins',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookAuthorJoins/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(6);
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'BookPrice Endpoints',
			function()
			{
				test
				(
					'Read all BookPrices',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookPrices')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Read a single BookPrice',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookPrice/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookPrice).to.equal(1);
									Expect(tmpRecord.Price).to.equal(14.99);
									Expect(tmpRecord.CouponCode).to.equal('SAVE10');
									Expect(tmpRecord.Discountable).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Create a BookPrice',
					function(fDone)
					{
						_SuperTest
							.post('1.0/BookPrice')
							.send(
								{
									Price: 24.99,
									CouponCode: 'NEWPRICE',
									IDBook: 4,
									Discountable: 1
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookPrice).to.be.greaterThan(0);
									Expect(tmpRecord.Price).to.equal(24.99);
									Expect(tmpRecord.CouponCode).to.equal('NEWPRICE');
									fDone();
								});
					}
				);
				test
				(
					'Update a BookPrice',
					function(fDone)
					{
						_SuperTest
							.put('1.0/BookPrice')
							.send(
								{
									IDBookPrice: 1,
									Price: 11.99,
									CouponCode: 'BIGSALE'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookPrice).to.equal(1);
									Expect(tmpRecord.Price).to.equal(11.99);
									Expect(tmpRecord.CouponCode).to.equal('BIGSALE');
									fDone();
								});
					}
				);
				test
				(
					'Delete a BookPrice (soft delete)',
					function(fDone)
					{
						_SuperTest
							.del('1.0/BookPrice/4')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Count BookPrices after delete',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookPrices/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Filter BookPrices by IDBook',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookPrices/FilteredTo/FBV~IDBook~EQ~1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].IDBook).to.equal(1);
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'BookStore Endpoints',
			function()
			{
				test
				(
					'Read all BookStores',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStores')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(2);
									fDone();
								});
					}
				);
				test
				(
					'Read a single BookStore',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStore/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStore).to.equal(1);
									Expect(tmpRecord.Name).to.equal('Downtown Books');
									Expect(tmpRecord.City).to.equal('Portland');
									Expect(tmpRecord.State).to.equal('OR');
									fDone();
								});
					}
				);
				test
				(
					'Create a new BookStore',
					function(fDone)
					{
						_SuperTest
							.post('1.0/BookStore')
							.send(
								{
									Name: 'Lakeside Books',
									Address: '789 Lake Dr',
									City: 'Austin',
									State: 'TX',
									Postal: '78701',
									Country: 'US'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStore).to.be.greaterThan(0);
									Expect(tmpRecord.Name).to.equal('Lakeside Books');
									Expect(tmpRecord.City).to.equal('Austin');
									fDone();
								});
					}
				);
				test
				(
					'Update a BookStore',
					function(fDone)
					{
						_SuperTest
							.put('1.0/BookStore')
							.send(
								{
									IDBookStore: 1,
									Name: 'Downtown Books & More'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStore).to.equal(1);
									Expect(tmpRecord.Name).to.equal('Downtown Books & More');
									fDone();
								});
					}
				);
				test
				(
					'Filter BookStores by State',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStores/FilteredTo/FBV~State~EQ~WA')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].Name).to.equal('Campus Reads');
									fDone();
								});
					}
				);
				test
				(
					'Count BookStores',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStores/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Delete a BookStore (soft delete)',
					function(fDone)
					{
						_SuperTest
							.del('1.0/BookStore/3')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Get BookStore schema',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStore/Schema')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpSchema = JSON.parse(pResponse.text);
									Expect(tmpSchema).to.be.an('object');
									Expect(tmpSchema.title).to.equal('BookStore');
									Expect(tmpSchema.properties.Name).to.be.an('object');
									Expect(tmpSchema.properties.City).to.be.an('object');
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'BookStoreInventory Endpoints',
			function()
			{
				test
				(
					'Read all BookStoreInventory records',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStoreInventorys')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Read a single BookStoreInventory record',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStoreInventory/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStoreInventory).to.equal(1);
									Expect(tmpRecord.BookCount).to.equal(15);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.IDBookStore).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Create a BookStoreInventory record',
					function(fDone)
					{
						_SuperTest
							.post('1.0/BookStoreInventory')
							.send(
								{
									BookCount: 10,
									AggregateBookCount: 10,
									IDBook: 3,
									IDBookStore: 2,
									IDBookPrice: 3,
									StockingAssociate: 1
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStoreInventory).to.be.greaterThan(0);
									Expect(tmpRecord.BookCount).to.equal(10);
									Expect(tmpRecord.IDBook).to.equal(3);
									Expect(tmpRecord.IDBookStore).to.equal(2);
									fDone();
								});
					}
				);
				test
				(
					'Update a BookStoreInventory record',
					function(fDone)
					{
						_SuperTest
							.put('1.0/BookStoreInventory')
							.send(
								{
									IDBookStoreInventory: 1,
									BookCount: 12,
									AggregateBookCount: 27
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStoreInventory).to.equal(1);
									Expect(tmpRecord.BookCount).to.equal(12);
									Expect(tmpRecord.AggregateBookCount).to.equal(27);
									fDone();
								});
					}
				);
				test
				(
					'Filter inventory by IDBookStore',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStoreInventorys/FilteredTo/FBV~IDBookStore~EQ~1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(2);
									fDone();
								});
					}
				);
				test
				(
					'Count BookStoreInventory records',
					function(fDone)
					{
						_SuperTest
							.get('1.0/BookStoreInventorys/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(4);
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'Review Endpoints',
			function()
			{
				test
				(
					'Read all Reviews',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Reviews')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(4);
									fDone();
								});
					}
				);
				test
				(
					'Read a single Review',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Review/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDReview).to.equal(1);
									Expect(tmpRecord.Rating).to.equal(5);
									Expect(tmpRecord.IDBook).to.equal(1);
									Expect(tmpRecord.IDUser).to.equal(2);
									fDone();
								});
					}
				);
				test
				(
					'Create a Review',
					function(fDone)
					{
						_SuperTest
							.post('1.0/Review')
							.send(
								{
									Text: 'An excellent read',
									Rating: 5,
									IDBook: 5,
									IDUser: 1
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDReview).to.be.greaterThan(0);
									Expect(tmpRecord.Rating).to.equal(5);
									Expect(tmpRecord.IDBook).to.equal(5);
									fDone();
								});
					}
				);
				test
				(
					'Update a Review',
					function(fDone)
					{
						_SuperTest
							.put('1.0/Review')
							.send(
								{
									IDReview: 1,
									Rating: 4,
									Text: 'A masterpiece (revised rating)'
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDReview).to.equal(1);
									Expect(tmpRecord.Rating).to.equal(4);
									fDone();
								});
					}
				);
				test
				(
					'Count Reviews',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Reviews/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(5);
									fDone();
								});
					}
				);
				test
				(
					'Filter Reviews by IDBook',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Reviews/FilteredTo/FBV~IDBook~EQ~1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(1);
									Expect(tmpRecords[0].IDBook).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Filter Reviews by Rating',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Reviews/FilteredTo/FBV~Rating~EQ~4')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpRecords = JSON.parse(pResponse.text);
									Expect(tmpRecords).to.be.an('array');
									Expect(tmpRecords.length).to.equal(3);
									fDone();
								});
					}
				);
				test
				(
					'Delete a Review (soft delete)',
					function(fDone)
					{
						_SuperTest
							.del('1.0/Review/5')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(1);
									fDone();
								});
					}
				);
				test
				(
					'Verify Review count after soft delete',
					function(fDone)
					{
						_SuperTest
							.get('1.0/Reviews/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.equal(4);
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'DAL Direct Access',
			function()
			{
				test
				(
					'Should doRead through DAL directly',
					function(fDone)
					{
						let tmpQuery = _Fable.DAL.Book.query
							.addFilter('IDBook', 1);
						_Fable.DAL.Book.doRead(tmpQuery,
							(pError, pQuery, pRecord) =>
							{
								Expect(pError).to.equal(null);
								Expect(pRecord.IDBook).to.equal(1);
								Expect(pRecord.Title).to.equal('Dune (Updated Edition)');
								fDone();
							});
					}
				);
				test
				(
					'Should doReads through DAL',
					function(fDone)
					{
						let tmpQuery = _Fable.DAL.Author.query
							.setCap(10);
						_Fable.DAL.Author.doReads(tmpQuery,
							(pError, pQuery, pRecords) =>
							{
								Expect(pError).to.equal(null);
								Expect(pRecords).to.be.an('array');
								Expect(pRecords.length).to.equal(5);
								fDone();
							});
					}
				);
				test
				(
					'Should doCount through DAL',
					function(fDone)
					{
						let tmpQuery = _Fable.DAL.BookStore.query;
						_Fable.DAL.BookStore.doCount(tmpQuery,
							(pError, pQuery, pCount) =>
							{
								Expect(pError).to.equal(null);
								Expect(pCount).to.equal(2);
								fDone();
							});
					}
				);
				test
				(
					'Should doCreate through DAL',
					function(fDone)
					{
						let tmpQuery = _Fable.DAL.User.query
							.addRecord({
								LoginID: 'daluser',
								NameFirst: 'DAL',
								NameLast: 'Test',
								FullName: 'DAL Test'
							});
						_Fable.DAL.User.doCreate(tmpQuery,
							(pError, pCreateQuery, pReadQuery, pRecord) =>
							{
								Expect(pError).to.equal(null);
								Expect(pRecord.IDUser).to.be.greaterThan(0);
								Expect(pRecord.LoginID).to.equal('daluser');
								fDone();
							});
					}
				);
			}
		);

		suite
		(
			'Cross-Entity Operations',
			function()
			{
				test
				(
					'Should serve all entity endpoints simultaneously',
					function(fDone)
					{
						let tmpCompleted = 0;
						let tmpTotal = 5;

						let checkDone = () =>
						{
							tmpCompleted++;
							if (tmpCompleted >= tmpTotal)
							{
								fDone();
							}
						};

						_SuperTest
							.get('1.0/Books/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.greaterThan(0);
									checkDone();
								});

						_SuperTest
							.get('1.0/Authors/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.greaterThan(0);
									checkDone();
								});

						_SuperTest
							.get('1.0/Reviews/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.greaterThan(0);
									checkDone();
								});

						_SuperTest
							.get('1.0/BookStores/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.greaterThan(0);
									checkDone();
								});

						_SuperTest
							.get('1.0/Users/Count')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									let tmpResult = JSON.parse(pResponse.text);
									Expect(tmpResult.Count).to.be.greaterThan(0);
									checkDone();
								});
					}
				);
			}
		);

		suite
		(
			'Additional Behavior Injection',
			function()
			{
				test
				(
					'Should support pre-operation behavior on BookStore reads',
					function(fDone)
					{
						let tmpPreReadCalled = false;

						_Fable.MeadowEndpoints.BookStore.controller.BehaviorInjection.setBehavior(
							'Read-PreOperation',
							(pRequest, pRequestState, fRequestComplete) =>
							{
								tmpPreReadCalled = true;
								return fRequestComplete(false);
							});

						_SuperTest
							.get('1.0/BookStore/1')
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									Expect(tmpPreReadCalled).to.equal(true);
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDBookStore).to.equal(1);

									// Clean up
									delete _Fable.MeadowEndpoints.BookStore.controller.BehaviorInjection._BehaviorFunctions['Read-PreOperation'];
									fDone();
								});
					}
				);
				test
				(
					'Should support post-operation behavior on Review create',
					function(fDone)
					{
						let tmpPostCreateCalled = false;

						_Fable.MeadowEndpoints.Review.controller.BehaviorInjection.setBehavior(
							'Create-PostOperation',
							(pRequest, pRequestState, fRequestComplete) =>
							{
								tmpPostCreateCalled = true;
								return fRequestComplete(false);
							});

						_SuperTest
							.post('1.0/Review')
							.send(
								{
									Text: 'Testing behavior injection',
									Rating: 3,
									IDBook: 2,
									IDUser: 1
								})
							.expect(200)
							.end(
								(pError, pResponse) =>
								{
									Expect(tmpPostCreateCalled).to.equal(true);
									let tmpRecord = JSON.parse(pResponse.text);
									Expect(tmpRecord.IDReview).to.be.greaterThan(0);

									// Clean up
									delete _Fable.MeadowEndpoints.Review.controller.BehaviorInjection._BehaviorFunctions['Create-PostOperation'];
									fDone();
								});
					}
				);
			}
		);

		suite
		(
			'Error Handling',
			function()
			{
				test
				(
					'Should error when stopping an uninitialized service',
					function(fDone)
					{
						let tmpFable = new libFable({LogStreams: [{streamtype: 'console', level: 'fatal'}]});
						tmpFable.serviceManager.addServiceType('RetoldDataService', libRetoldDataService);
						let tmpService = tmpFable.serviceManager.instantiateServiceProvider('RetoldDataService',
							{
								AutoStartOrator: false,
								FullMeadowSchemaPath: `${__dirname}/../source/model/`,
								FullMeadowSchemaFilename: `MeadowModel-Extended.json`
							});
						tmpService.stopService(
							(pError) =>
							{
								Expect(pError).to.be.an.instanceof(Error);
								Expect(pError.message).to.contain('not initialized');
								fDone();
							});
					}
				);
			}
		);
	}
);
