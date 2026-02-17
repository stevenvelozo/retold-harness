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

		"APIServerPort": 8086,

		"RetoldDataServiceOptions":
		{
			"StorageProvider": "SQLite",
			"StorageProviderModule": "meadow-connection-sqlite",

			"FullMeadowSchemaPath": `${__dirname}/model/`,
			"FullMeadowSchemaFilename": `MeadowModel-Extended.json`,
		},

		"SQLite":
			{
				"SQLiteFilePath": `${__dirname}/../data/bookstore.sqlite`
			}
	});