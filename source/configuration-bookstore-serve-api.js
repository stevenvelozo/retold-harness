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
			"StorageProvider": "MySQL",
			"StorageProviderModule": "meadow-connection-mysql",

			"FullMeadowSchemaPath": `${__dirname}/model/`,
			"FullMeadowSchemaFilename": `MeadowModel-Extended.json`,
		},

		"MySQL":
			{
				"Server": "127.0.0.1",
				"Port": 3306,
				"User": "root",
				"Password": "123456789",
				"Database": "bookstore",
				"ConnectionPoolLimit": 20
			},
		"MeadowConnectionMySQLAutoConnect": true
	});