/**
* Retold Harness Schema Provider - US Federal Data
*
* Complex geographic/administrative schema with FIPS states, counties,
* cities, ZIP codes, congressional districts, and county subdivisions.
* Data is ingested from Census Bureau files via meadow-integration.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libRetoldHarnessSchemaProvider = require('./Retold-Harness-Service-SchemaProvider.js');

class RetoldHarnessSchemaUSFederalData extends libRetoldHarnessSchemaProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'HarnessSchemaProvider';
	}

	getSchemaPath()
	{
		return libPath.join(__dirname, 'us-federal-data');
	}

	getSeedCheckQuery()
	{
		return 'SELECT COUNT(*) AS cnt FROM CensusRegion';
	}

	generateTables(pDB, fCallback)
	{
		try
		{
			let tmpCreateSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'USFederalData-CreateSQLiteTables.sql'), 'utf8');
			pDB.exec(tmpCreateSQL);
			this.log.info('USFederalData tables created (10 tables).');
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error creating USFederalData tables: ${pError}`);
			return fCallback(pError);
		}
	}

	seedData(pDB, fCallback)
	{
		try
		{
			let tmpRowCount = pDB.prepare('SELECT COUNT(*) AS cnt FROM CensusRegion').get();
			if (tmpRowCount.cnt < 1)
			{
				this.log.info('Seeding USFederalData reference data (Regions, Divisions, DataSources, admin User)...');
				let tmpSeedSQL = libFS.readFileSync(libPath.join(this.getSchemaPath(), 'sqlite_create', 'USFederalData-SeedData.sql'), 'utf8');
				pDB.exec(tmpSeedSQL);
				this.log.info('Reference seed data loaded: 4 Regions, 9 Divisions, 6 DataSources, 1 User.');
			}
			else
			{
				this.log.info(`USFederalData reference data already present (${tmpRowCount.cnt} regions found).`);
			}
			return fCallback();
		}
		catch (pError)
		{
			this.log.error(`Error seeding USFederalData reference data: ${pError}`);
			return fCallback(pError);
		}
	}

	applyBehaviors(fCallback)
	{
		let tmpFable = this.fable;

		// Enrich State reads with Census Region and Division names
		if (tmpFable.MeadowEndpoints && tmpFable.MeadowEndpoints.State)
		{
			tmpFable.MeadowEndpoints.State.controller.BehaviorInjection.setBehavior('Read-PostOperation',
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

					// Fetch the Census Region name
					if (tmpRecord.IDCensusRegion > 0)
					{
						tmpFable.DAL.CensusRegion.doRead(tmpFable.DAL.CensusRegion.query.addFilter('IDCensusRegion', tmpRecord.IDCensusRegion),
							(pError, pQuery, pRegion) =>
							{
								if (pRegion && pRegion.Name)
								{
									tmpRecord.CensusRegionName = pRegion.Name;
								}
								return tmpCheckDone();
							});
					}
					else
					{
						tmpRecord.CensusRegionName = '';
						tmpCheckDone();
					}

					// Fetch the Census Division name
					if (tmpRecord.IDCensusDivision > 0)
					{
						tmpFable.DAL.CensusDivision.doRead(tmpFable.DAL.CensusDivision.query.addFilter('IDCensusDivision', tmpRecord.IDCensusDivision),
							(pError, pQuery, pDivision) =>
							{
								if (pDivision && pDivision.Name)
								{
									tmpRecord.CensusDivisionName = pDivision.Name;
								}
								return tmpCheckDone();
							});
					}
					else
					{
						tmpRecord.CensusDivisionName = '';
						tmpCheckDone();
					}
				});
			this.log.info('State read enrichment behavior applied (Census Region + Division names).');
		}

		// Enrich County reads with State name
		if (tmpFable.MeadowEndpoints && tmpFable.MeadowEndpoints.County)
		{
			tmpFable.MeadowEndpoints.County.controller.BehaviorInjection.setBehavior('Read-PostOperation',
				(pRequest, pRequestState, fRequestComplete) =>
				{
					let tmpRecord = pRequestState.Record;
					if (tmpRecord.IDState > 0)
					{
						tmpFable.DAL.State.doRead(tmpFable.DAL.State.query.addFilter('IDState', tmpRecord.IDState),
							(pError, pQuery, pState) =>
							{
								if (pState && pState.Name)
								{
									tmpRecord.StateName = pState.Name;
									tmpRecord.StateAbbreviation = pState.Abbreviation;
								}
								return fRequestComplete();
							});
					}
					else
					{
						return fRequestComplete();
					}
				});
			this.log.info('County read enrichment behavior applied (State name).');
		}

		return fCallback();
	}
}

module.exports = RetoldHarnessSchemaUSFederalData;
