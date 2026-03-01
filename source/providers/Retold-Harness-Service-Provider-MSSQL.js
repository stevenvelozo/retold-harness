/**
* Retold Harness Provider - MSSQL
*
* MSSQL-specific provider configurator. Handles MSSQL connection via
* meadow-connection-mssql, uses the connection module's createTables()
* for DDL generation from Schema.json, and executes MSSQL seed SQL.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionMSSQL = require('meadow-connection-mssql');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderMSSQL extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'MSSQL';
		this.options.StorageProviderModule = 'meadow-connection-mssql';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the MSSQL provider
		this.fable.serviceManager.addServiceType('MeadowMSSQLProvider', libMeadowConnectionMSSQL);
		this.fable.serviceManager.instantiateServiceProvider('MeadowMSSQLProvider');

		this.fable.MeadowMSSQLProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`MSSQL connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('MSSQL database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-MSSQL.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();
		let tmpPool = this.fable.MeadowMSSQLProvider.pool;

		let tmpAnticipate = this.fable.newAnticipate();

		// Step 1: Create tables using the connection module's DDL generator
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				let tmpSchemaFile = libPath.join(tmpSchemaPath, 'Schema.json');
				let tmpSchema;

				try
				{
					tmpSchema = JSON.parse(libFS.readFileSync(tmpSchemaFile, 'utf8'));
				}
				catch (pError)
				{
					this.log.error(`Error reading Schema.json: ${pError}`);
					return fStepComplete(pError);
				}

				this.log.info('Creating MSSQL tables from Schema.json...');
				this.fable.MeadowMSSQLProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating MSSQL tables: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('MSSQL tables created.');
						return fStepComplete();
					});
			});

		// Step 2: Seed data if needed
		tmpAnticipate.anticipate(
			(fStepComplete) =>
			{
				let tmpSeedCheckQuery = tmpSchemaProvider.getSeedCheckQuery();

				if (!tmpSeedCheckQuery)
				{
					this.log.info('No seed check query provided, skipping seed.');
					return fStepComplete();
				}

				tmpPool.request().query(tmpSeedCheckQuery)
					.then(
						(pResult) =>
						{
							let tmpCount = (pResult.recordset && pResult.recordset.length > 0) ? pResult.recordset[0].cnt : 0;

							if (tmpCount > 0)
							{
								this.log.info('MSSQL data already seeded, skipping.');
								return fStepComplete();
							}

							// Load and execute the MSSQL seed SQL
							let tmpSeedSQLPath = libPath.join(tmpSchemaPath, 'mssql_create', 'BookStore-SeedData.sql');

							if (!libFS.existsSync(tmpSeedSQLPath))
							{
								this.log.warn(`MSSQL seed SQL not found at ${tmpSeedSQLPath}, skipping seed.`);
								return fStepComplete();
							}

							this.log.info('Seeding initial data into MSSQL...');
							let tmpSeedSQL = libFS.readFileSync(tmpSeedSQLPath, 'utf8');

							// MSSQL uses GO as batch separator; split and execute each batch
							let tmpBatches = tmpSeedSQL.split(/^\s*GO\s*$/mi).map((pBatch) => pBatch.trim()).filter((pBatch) => pBatch.length > 0);

							let tmpBatchIndex = 0;
							let tmpExecuteNext = () =>
							{
								if (tmpBatchIndex >= tmpBatches.length)
								{
									this.log.info('MSSQL seed data loaded.');
									return fStepComplete();
								}

								tmpPool.request().query(tmpBatches[tmpBatchIndex])
									.then(
										() =>
										{
											tmpBatchIndex++;
											return tmpExecuteNext();
										})
									.catch(
										(pExecError) =>
										{
											this.log.error(`Error executing seed batch ${tmpBatchIndex}: ${pExecError}`);
											return fStepComplete(pExecError);
										});
							};

							return tmpExecuteNext();
						})
					.catch(
						(pError) =>
						{
							this.log.error(`Error running seed check query: ${pError}`);
							return fStepComplete(pError);
						});
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`MSSQL schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderMSSQL;
