module.exports = (
	{
		"Product": "MeadowEndpointsTestBookStore",
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
					"path": "./Retold-Harness-Requests.log"
				}
			],

		"APIServerPort": parseInt(process.env.PORT, 10) || 8086,

		"HarnessSchema": process.env.HARNESS_SCHEMA || "bookstore",
		"HarnessProvider": process.env.HARNESS_PROVIDER || "sqlite",

		"RetoldDataServiceOptions":
		{
			"StorageProvider": "SQLite",
			"StorageProviderModule": "meadow-connection-sqlite",

			"FullMeadowSchemaPath": `${__dirname}/schemas/bookstore/`,
			"FullMeadowSchemaFilename": `Schema.json`,
		},

		"SQLite":
			{
				"SQLiteFilePath": `${__dirname}/../data/bookstore.sqlite`
			}
	});