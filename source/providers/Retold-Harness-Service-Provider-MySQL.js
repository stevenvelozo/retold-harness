/**
* Retold Harness Provider - MySQL
*
* MySQL-specific provider configurator. Handles MySQL connection via
* meadow-connection-mysql, uses the connection module's createTables()
* for DDL generation from Schema.json, and executes MySQL seed SQL.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPath = require('path');
const libFS = require('fs');

const libMeadowConnectionMySQL = require('meadow-connection-mysql');

const libRetoldHarnessMeadowProviderConfigurator = require('./Retold-Harness-Service-MeadowProviderConfigurator.js');

class RetoldHarnessProviderMySQL extends libRetoldHarnessMeadowProviderConfigurator
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'MeadowProviderConfigurator';

		// Set the storage provider info for this provider type
		this.options.StorageProvider = 'MySQL';
		this.options.StorageProviderModule = 'meadow-connection-mysql';
	}

	connectDatabase(fCallback)
	{
		// Register and connect the MySQL provider
		this.fable.serviceManager.addServiceType('MeadowMySQLProvider', libMeadowConnectionMySQL);
		this.fable.serviceManager.instantiateServiceProvider('MeadowMySQLProvider');

		this.fable.MeadowMySQLProvider.connectAsync(
			(pError) =>
			{
				if (pError)
				{
					this.log.error(`MySQL connection error: ${pError}`);
					return fCallback(pError);
				}

				this.log.info('MySQL database connected.');
				return fCallback();
			});
	}

	initializeSchema(fCallback)
	{
		let tmpSchemaProvider = this.fable.HarnessSchemaProvider;

		if (!tmpSchemaProvider)
		{
			this.log.error('Provider-MySQL.initializeSchema(): No HarnessSchemaProvider registered.');
			return fCallback('No HarnessSchemaProvider registered');
		}

		let tmpSchemaPath = tmpSchemaProvider.getSchemaPath();
		let tmpPool = this.fable.MeadowMySQLProvider.pool;

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

				this.log.info('Creating MySQL tables from Schema.json...');
				this.fable.MeadowMySQLProvider.createTables(tmpSchema,
					(pError) =>
					{
						if (pError)
						{
							this.log.error(`Error creating MySQL tables: ${pError}`);
							return fStepComplete(pError);
						}
						this.log.info('MySQL tables created.');
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
					(pError, pRows) =>
					{
						if (pError)
						{
							this.log.error(`Error running seed check query: ${pError}`);
							return fStepComplete(pError);
						}

						let tmpCount = (pRows && pRows.length > 0) ? pRows[0].cnt : 0;

						if (tmpCount > 0)
						{
							this.log.info('MySQL data already seeded, skipping.');
							return fStepComplete();
						}

						// Load and execute the MySQL seed SQL
						let tmpSeedSQLPath = libPath.join(tmpSchemaPath, 'mysql_create', 'MeadowModel-PopulateDatabase.sql');

						if (!libFS.existsSync(tmpSeedSQLPath))
						{
							this.log.warn(`MySQL seed SQL not found at ${tmpSeedSQLPath}, skipping seed.`);
							return fStepComplete();
						}

						this.log.info('Seeding initial data into MySQL...');
						let tmpSeedSQL = libFS.readFileSync(tmpSeedSQLPath, 'utf8');

						// MySQL supports multiple statements in a single query if multipleStatements is enabled
						// Split by semicolons and execute each statement
						let tmpStatements = tmpSeedSQL.split(';').map((pStatement) => pStatement.trim()).filter((pStatement) => pStatement.length > 0);

						let tmpStatementIndex = 0;
						let tmpExecuteNext = () =>
						{
							if (tmpStatementIndex >= tmpStatements.length)
							{
								this.log.info('MySQL seed data loaded.');
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
					this.log.error(`MySQL schema initialization error: ${pError}`);
					return fCallback(pError);
				}
				return fCallback();
			});
	}
}

module.exports = RetoldHarnessProviderMySQL;
