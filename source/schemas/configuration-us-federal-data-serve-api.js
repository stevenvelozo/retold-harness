module.exports = (
	{
		"Product": "RetoldHarnessUSFederalData",
		"ProductVersion": "1.0.0",

		"UUID":
			{
				"DataCenter": 0,
				"Worker": 0
			},
		"LogStreams":
			[
				{
					"streamtype": "simpleflatfile",
					"level": "info",
					"path": "./Retold-Harness-USFederalData-Requests.log"
				}
			],

		"APIServerPort": parseInt(process.env.PORT, 10) || 8087,

		"HarnessSchema": process.env.HARNESS_SCHEMA || "us-federal-data",
		"HarnessProvider": process.env.HARNESS_PROVIDER || "sqlite",

		"RetoldDataServiceOptions":
		{
			"StorageProvider": "SQLite",
			"StorageProviderModule": "meadow-connection-sqlite",

			"FullMeadowSchemaPath": `${__dirname}/us-federal-data/`,
			"FullMeadowSchemaFilename": `Schema.json`,
		},

		"SQLite":
			{
				"SQLiteFilePath": `${__dirname}/../../data/us-federal-data.sqlite`
			},

		"MySQL":
			{
				"Server": process.env.MYSQL_HOST || "127.0.0.1",
				"Port": parseInt(process.env.MYSQL_PORT, 10) || 3306,
				"User": process.env.MYSQL_USER || "root",
				"Password": process.env.MYSQL_PASSWORD || "1234567890",
				"Database": process.env.MYSQL_DATABASE || "us_federal_data",
				"ConnectionPoolLimit": 5
			},

		"MSSQL":
			{
				"server": process.env.MSSQL_HOST || "127.0.0.1",
				"port": parseInt(process.env.MSSQL_PORT, 10) || 1433,
				"user": process.env.MSSQL_USER || "sa",
				"password": process.env.MSSQL_PASSWORD || "Retold1234567890!",
				"database": process.env.MSSQL_DATABASE || "us_federal_data"
			},

		"PostgreSQL":
			{
				"Server": process.env.PGSQL_HOST || "127.0.0.1",
				"Port": parseInt(process.env.PGSQL_PORT, 10) || 5432,
				"User": process.env.PGSQL_USER || "postgres",
				"Password": process.env.PGSQL_PASSWORD || "retold1234567890",
				"Database": process.env.PGSQL_DATABASE || "us_federal_data",
				"ConnectionPoolLimit": 5
			},

		"MongoDB":
			{
				"Server": process.env.MONGODB_HOST || "127.0.0.1",
				"Port": parseInt(process.env.MONGODB_PORT, 10) || 27017,
				"Database": process.env.MONGODB_DATABASE || "us_federal_data"
			},

		"DGraph":
			{
				"Server": process.env.DGRAPH_HOST || "127.0.0.1",
				"Port": parseInt(process.env.DGRAPH_PORT, 10) || 8080
			},

		"Solr":
			{
				"Server": process.env.SOLR_HOST || "127.0.0.1",
				"Port": parseInt(process.env.SOLR_PORT, 10) || 8983,
				"Core": process.env.SOLR_CORE || "us_federal_data",
				"Path": "/solr",
				"Secure": false
			}
	});
