/**
* Retold Harness Schema Provider - Entertainment
*
* Complex entertainment schema with movies, actors, musicians, songs,
* soundtracks, albums, concerts and setlists. Data is ingested from
* IMDb non-commercial datasets, Wikidata SPARQL queries, and curated
* JSON files, with full provenance tracking via the DataSource entity.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libRetoldHarnessSchemaProvider = require('./Retold-Harness-Service-SchemaProvider.js');

class RetoldHarnessSchemaEntertainment extends libRetoldHarnessSchemaProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'HarnessSchemaProvider';
	}

	getSchemaPath()
	{
		return libPath.join(__dirname, 'entertainment');
	}

	getSeedCheckQuery()
	{
		return 'SELECT COUNT(*) AS cnt FROM DataSource';
	}

	generateTables(pDB, fCallback)
	{
		try
		{
			let tmpCreateSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'Entertainment-CreateSQLiteTables.sql'), 'utf8');
			pDB.exec(tmpCreateSQL);
			this.log.info('Entertainment tables created (16 tables).');
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error creating Entertainment tables: ${pError}`);
			return fCallback(pError);
		}
	}

	seedData(pDB, fCallback)
	{
		try
		{
			let tmpRowCount = pDB.prepare('SELECT COUNT(*) AS cnt FROM DataSource').get();
			if (tmpRowCount.cnt < 1)
			{
				this.log.info('Seeding Entertainment reference data (DataSources, admin User)...');
				let tmpSeedSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'Entertainment-SeedData.sql'), 'utf8');
				pDB.exec(tmpSeedSQL);
				this.log.info('Reference seed data loaded: 8 DataSources, 1 User.');
			}
			else
			{
				this.log.info(`Entertainment reference data already present (${tmpRowCount.cnt} data sources found).`);
			}
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error seeding Entertainment reference data: ${pError}`);
			return fCallback(pError);
		}
	}

	applyBehaviors(fCallback)
	{
		let tmpFable = this.fable;

		// Enrich Movie reads with rating data
		if (tmpFable.MeadowEndpoints && tmpFable.MeadowEndpoints.Movie)
		{
			tmpFable.MeadowEndpoints.Movie.controller.BehaviorInjection.setBehavior('Read-PostOperation',
				(pRequest, pRequestState, fRequestComplete) =>
				{
					let tmpRecord = pRequestState.Record;
					if (tmpRecord.IDMovie > 0)
					{
						tmpFable.DAL.MovieRating.doRead(tmpFable.DAL.MovieRating.query.addFilter('IDMovie', tmpRecord.IDMovie),
							(pError, pQuery, pRating) =>
							{
								if (pRating && pRating.AverageRating)
								{
									tmpRecord.AverageRating = pRating.AverageRating;
									tmpRecord.NumVotes = pRating.NumVotes;
								}
								return fRequestComplete();
							});
					}
					else
					{
						return fRequestComplete();
					}
				});
			this.log.info('Movie read enrichment behavior applied (rating data).');
		}

		// Enrich Concert reads with Artist and Venue names
		if (tmpFable.MeadowEndpoints && tmpFable.MeadowEndpoints.Concert)
		{
			tmpFable.MeadowEndpoints.Concert.controller.BehaviorInjection.setBehavior('Read-PostOperation',
				(pRequest, pRequestState, fRequestComplete) =>
				{
					let tmpRecord = pRequestState.Record;
					let tmpRemaining = 2;

					let tmpCheckDone = () =>
					{
						tmpRemaining--;
						if (tmpRemaining <= 0)
						{
							return fRequestComplete();
						}
					};

					if (tmpRecord.IDArtist > 0)
					{
						tmpFable.DAL.Artist.doRead(tmpFable.DAL.Artist.query.addFilter('IDArtist', tmpRecord.IDArtist),
							(pError, pQuery, pArtist) =>
							{
								if (pArtist && pArtist.Name)
								{
									tmpRecord.ArtistName = pArtist.Name;
								}
								return tmpCheckDone();
							});
					}
					else
					{
						tmpRecord.ArtistName = '';
						tmpCheckDone();
					}

					if (tmpRecord.IDVenue > 0)
					{
						tmpFable.DAL.Venue.doRead(tmpFable.DAL.Venue.query.addFilter('IDVenue', tmpRecord.IDVenue),
							(pError, pQuery, pVenue) =>
							{
								if (pVenue && pVenue.Name)
								{
									tmpRecord.VenueName = pVenue.Name;
									tmpRecord.VenueCity = pVenue.City;
								}
								return tmpCheckDone();
							});
					}
					else
					{
						tmpRecord.VenueName = '';
						tmpRecord.VenueCity = '';
						tmpCheckDone();
					}
				});
			this.log.info('Concert read enrichment behavior applied (Artist + Venue names).');
		}

		// Enrich Album reads with Artist name
		if (tmpFable.MeadowEndpoints && tmpFable.MeadowEndpoints.Album)
		{
			tmpFable.MeadowEndpoints.Album.controller.BehaviorInjection.setBehavior('Read-PostOperation',
				(pRequest, pRequestState, fRequestComplete) =>
				{
					let tmpRecord = pRequestState.Record;
					if (tmpRecord.IDArtist > 0)
					{
						tmpFable.DAL.Artist.doRead(tmpFable.DAL.Artist.query.addFilter('IDArtist', tmpRecord.IDArtist),
							(pError, pQuery, pArtist) =>
							{
								if (pArtist && pArtist.Name)
								{
									tmpRecord.ArtistName = pArtist.Name;
								}
								return fRequestComplete();
							});
					}
					else
					{
						return fRequestComplete();
					}
				});
			this.log.info('Album read enrichment behavior applied (Artist name).');
		}

		return fCallback();
	}
}

module.exports = RetoldHarnessSchemaEntertainment;
