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
					"streamtype": "console"
				}
			],

		"APIServerPort": 8086,

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