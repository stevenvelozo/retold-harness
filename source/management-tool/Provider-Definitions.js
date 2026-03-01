/**
* Provider Definitions
*
* Static metadata for every retold-harness database provider.
*
* @author Steven Velozo <steven@velozo.com>
*/
module.exports =
{
	'sqlite':
	{
		Key: 'sqlite',
		Label: 'SQLite',
		DockerService: false,
		ContainerName: false,
		DefaultPort: 'N/A',
		EnvPrefix: '',
		HasSeedData: true,
		Description: 'File-based SQL database. No server required.',
		DockerImage: 'N/A',
		LocalOnly: true
	},
	'mysql':
	{
		Key: 'mysql',
		Label: 'MySQL',
		DockerService: 'mysql',
		ContainerName: 'retold-harness-mysql',
		DefaultPort: 3306,
		EnvPrefix: 'MYSQL',
		HasSeedData: true,
		Description: 'MySQL 8 relational database.',
		DockerImage: 'mysql:8',
		LocalOnly: false
	},
	'mssql':
	{
		Key: 'mssql',
		Label: 'MSSQL',
		DockerService: 'mssql',
		ContainerName: 'retold-harness-mssql',
		DefaultPort: 1433,
		EnvPrefix: 'MSSQL',
		HasSeedData: true,
		Description: 'Microsoft SQL Server 2022.',
		DockerImage: 'mcr.microsoft.com/mssql/server:2022-latest',
		LocalOnly: false
	},
	'postgresql':
	{
		Key: 'postgresql',
		Label: 'PostgreSQL',
		DockerService: 'postgresql',
		ContainerName: 'retold-harness-postgresql',
		DefaultPort: 5432,
		EnvPrefix: 'PGSQL',
		HasSeedData: true,
		Description: 'PostgreSQL 16 relational database.',
		DockerImage: 'postgres:16',
		LocalOnly: false
	},
	'mongodb':
	{
		Key: 'mongodb',
		Label: 'MongoDB',
		DockerService: 'mongodb',
		ContainerName: 'retold-harness-mongodb',
		DefaultPort: 27017,
		EnvPrefix: 'MONGODB',
		HasSeedData: false,
		Description: 'MongoDB 7 document database.',
		DockerImage: 'mongo:7',
		LocalOnly: false
	},
	'dgraph':
	{
		Key: 'dgraph',
		Label: 'DGraph',
		DockerService: 'dgraph',
		ContainerName: 'retold-harness-dgraph',
		DefaultPort: 8080,
		EnvPrefix: 'DGRAPH',
		HasSeedData: false,
		Description: 'DGraph graph database.',
		DockerImage: 'dgraph/standalone:latest',
		LocalOnly: false
	},
	'solr':
	{
		Key: 'solr',
		Label: 'Solr',
		DockerService: 'solr',
		ContainerName: 'retold-harness-solr',
		DefaultPort: 8983,
		EnvPrefix: 'SOLR',
		HasSeedData: false,
		Description: 'Apache Solr 9 search platform.',
		DockerImage: 'solr:9',
		LocalOnly: false
	}
};
