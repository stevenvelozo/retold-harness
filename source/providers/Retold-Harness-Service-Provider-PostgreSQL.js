/**
* Retold Harness Provider - PostgreSQL
*
* PostgreSQL-specific provider configurator. Handles PostgreSQL connection via
* meadow-connection-postgresql, uses the connection module's createTables()
* for DDL generation from Schema.json, and executes PostgreSQL seed SQL.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionPostgreSQL = require('meadow-connection-postgresql');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderPostgreSQL extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'PostgreSQL';
		this.options.StorageProviderModule = 'meadow-connection-postgresql';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the PostgreSQL provider
		this.fable.serviceManager.addServiceType('MeadowPostgreSQLProvider', libMeadowConnectionPostgreSQL);
		this.fable.serviceManager.instantiateServiceProvider('MeadowPostgreSQLProvider');

		this.fable.MeadowPostgreSQLProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`PostgreSQL connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('PostgreSQL database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-PostgreSQL.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();
		let tmpPool = this.fable.MeadowPostgreSQLProvider.pool;

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

				this.log.info('Creating PostgreSQL tables from Schema.json...');
				this.fable.MeadowPostgreSQLProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating PostgreSQL tables: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('PostgreSQL tables created.');
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

				tmpPool.query(tmpSeedCheckQuery,
					(pError, pResult) =>
					{
						if (pError)
						{
							this.log.error(`Error running seed check query: ${pError}`);
							return fStepComplete(pError);
						}

						let tmpCount = (pResult.rows && pResult.rows.length > 0) ? pResult.rows[0].cnt : 0;

						if (tmpCount > 0)
						{
							this.log.info('PostgreSQL data already seeded, skipping.');
							return fStepComplete();
						}

						// Load and execute the PostgreSQL seed SQL
						let tmpSeedSQLPath = libPath.join(tmpSchemaPath, 'pgsql_create', 'BookStore-SeedData.sql');

						if (!libFS.existsSync(tmpSeedSQLPath))
						{
							this.log.warn(`PostgreSQL seed SQL not found at ${tmpSeedSQLPath}, skipping seed.`);
							return fStepComplete();
						}

						this.log.info('Seeding initial data into PostgreSQL...');
						let tmpSeedSQL = libFS.readFileSync(tmpSeedSQLPath, 'utf8');

						// Split by semicolons and execute each statement
						let tmpStatements = tmpSeedSQL.split(';').map((pStatement) => pStatement.trim()).filter((pStatement) => pStatement.length > 0 && !pStatement.startsWith('--'));

						let tmpStatementIndex = 0;
						let tmpExecuteNext = () =>
						{
							if (tmpStatementIndex >= tmpStatements.length)
							{
								this.log.info('PostgreSQL seed data loaded.');
								return fStepComplete();
							}

							tmpPool.query(tmpStatements[tmpStatementIndex],
								(pExecError) =>
								{
									if (pExecError)
									{
										this.log.error(`Error executing seed statement ${tmpStatementIndex}: ${pExecError}`);
										return fStepComplete(pExecError);
									}
									tmpStatementIndex++;
									return tmpExecuteNext();
								});
						};

						return tmpExecuteNext();
					});
			});

		tmpAnticipate.wait(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`PostgreSQL schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderPostgreSQL;
