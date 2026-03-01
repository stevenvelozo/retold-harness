/**
* Retold Harness Schema Provider - BookStore
*
* Bookstore schema implementation. Provides SQLite table creation,
* seed data loading, and author enrichment behavior for book reads.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libRetoldHarnessSchemaProvider = require('./Retold-Harness-Service-SchemaProvider.js');

class RetoldHarnessSchemaBookstore extends libRetoldHarnessSchemaProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'HarnessSchemaProvider';
	}

	getSchemaPath()
	{
		return libPath.join(__dirname, 'bookstore');
	}

	getSeedCheckQuery()
	{
		return 'SELECT COUNT(*) AS cnt FROM Book';
	}

	generateTables(pDB, fCallback)
	{
		try
		{
			let tmpCreateSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'BookStore-CreateSQLiteTables.sql'), 'utf8');
			pDB.exec(tmpCreateSQL);
			this.log.info('BookStore tables created.');
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error creating BookStore tables: ${pError}`);
			return fCallback(pError);
		}
	}

	seedData(pDB, fCallback)
	{
		try
		{
			let tmpRowCount = pDB.prepare('SELECT COUNT(*) AS cnt FROM Book').get();
			if (tmpRowCount.cnt < 1)
			{
				this.log.info('Seeding initial BookStore data...');
				let tmpSeedSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'BookStore-SeedData.sql'), 'utf8');
				pDB.exec(tmpSeedSQL);
				this.log.info('Seed data loaded.');
			}
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error seeding BookStore data: ${pError}`);
			return fCallback(pError);
		}
	}

	applyBehaviors(fCallback)
	{
		let tmpFable = this.fable;

		if (!tmpFable.MeadowEndpoints || !tmpFable.MeadowEndpoints.Book)
		{
			this.log.warn('BookStore applyBehaviors: MeadowEndpoints.Book not available, skipping author enrichment behavior.');
			return fCallback();
		}

		// Create a post operation behavior for the book Read singular record endpoint only
		tmpFable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
			(pRequest, pRequestState, fRequestComplete) =>
			{
				// Get the join records
				tmpFable.DAL.BookAuthorJoin.doReads(tmpFable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
					(pJoinReadError, pJoinReadQuery, pJoinRecords) =>
					{
						if (pJoinRecords.length < 1)
						{
							tmpFable.log.trace(`Found no authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).  What even is a book without authors?`)
							pRequestState.Record.Authors = [];
							return fRequestComplete();
						}

						let tmpAuthors = [];
						let tmpRemaining = pJoinRecords.length;

						for (let j = 0; j < pJoinRecords.length; j++)
						{
							tmpFable.DAL.Author.doRead(tmpFable.DAL.Author.query.addFilter('IDAuthor', pJoinRecords[j].IDAuthor),
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
										tmpFable.log.info(`Found ${tmpAuthors.length} authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).`)
										return fRequestComplete();
									}
								});
						}
					});
			});

		this.log.info('BookStore author enrichment behavior applied.');
		return fCallback();
	}
}

module.exports = RetoldHarnessSchemaBookstore;
