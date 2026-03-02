module.exports = (
	{
		"Product": "RetoldHarnessEntertainment",
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
					"path": "./Retold-Harness-Entertainment-Requests.log"
				}
			],

		"APIServerPort": parseInt(process.env.PORT, 10) || 8088,

		"HarnessSchema": process.env.HARNESS_SCHEMA || "entertainment",
		"HarnessProvider": process.env.HARNESS_PROVIDER || "sqlite",

		"RetoldDataServiceOptions":
		{
			"StorageProvider": "SQLite",
			"StorageProviderModule": "meadow-connection-sqlite",

			"FullMeadowSchemaPath": `${__dirname}/entertainment/`,
			"FullMeadowSchemaFilename": `Schema.json`,
		},

		"SQLite":
			{
				"SQLiteFilePath": `${__dirname}/../../data/entertainment.sqlite`
			},

		"MySQL":
			{
				"Server": process.env.MYSQL_HOST || "127.0.0.1",
				"Port": parseInt(process.env.MYSQL_PORT, 10) || 3306,
				"User": process.env.MYSQL_USER || "root",
				"Password": process.env.MYSQL_PASSWORD || "1234567890",
				"Database": process.env.MYSQL_DATABASE || "entertainment",
				"ConnectionPoolLimit": 5
			},

		"MSSQL":
			{
				"server": process.env.MSSQL_HOST || "127.0.0.1",
				"port": parseInt(process.env.MSSQL_PORT, 10) || 1433,
				"user": process.env.MSSQL_USER || "sa",
				"password": process.env.MSSQL_PASSWORD || "Retold1234567890!",
				"database": process.env.MSSQL_DATABASE || "entertainment"
			},

		"PostgreSQL":
			{
				"Server": process.env.PGSQL_HOST || "127.0.0.1",
				"Port": parseInt(process.env.PGSQL_PORT, 10) || 5432,
				"User": process.env.PGSQL_USER || "postgres",
				"Password": process.env.PGSQL_PASSWORD || "retold1234567890",
				"Database": process.env.PGSQL_DATABASE || "entertainment",
				"ConnectionPoolLimit": 5
			},

		"MongoDB":
			{
				"Server": process.env.MONGODB_HOST || "127.0.0.1",
				"Port": parseInt(process.env.MONGODB_PORT, 10) || 27017,
				"Database": process.env.MONGODB_DATABASE || "entertainment"
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
				"Core": process.env.SOLR_CORE || "entertainment",
				"Path": "/solr",
				"Secure": false
			}
	});
