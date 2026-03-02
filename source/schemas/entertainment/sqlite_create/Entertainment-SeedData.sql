-- Entertainment Schema - Static Seed Data
-- Data Sources (9), Admin User (1)

-- Admin User
INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
	VALUES (1, 1001, 'admin', 'hash123', 'Admin', 'User', 'Admin User', '{}');

-- Data Sources (provenance tracking for each data source)
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (1, 'ds-imdb-title-basics', 'IMDb Title Basics', 'https://datasets.imdbws.com/title.basics.tsv.gz', 'IMDb non-commercial dataset containing basic title information: type, primary title, original title, year, runtime, genres.', 'tsv-gzipped', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (2, 'ds-imdb-title-ratings', 'IMDb Title Ratings', 'https://datasets.imdbws.com/title.ratings.tsv.gz', 'IMDb non-commercial dataset containing user ratings and vote counts for titles.', 'tsv-gzipped', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (3, 'ds-imdb-name-basics', 'IMDb Name Basics', 'https://datasets.imdbws.com/name.basics.tsv.gz', 'IMDb non-commercial dataset containing basic name information: primary name, birth/death year, professions, known titles.', 'tsv-gzipped', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (4, 'ds-imdb-title-principals', 'IMDb Title Principals', 'https://datasets.imdbws.com/title.principals.tsv.gz', 'IMDb non-commercial dataset containing principal cast and crew for titles with ordering and category information.', 'tsv-gzipped', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (5, 'ds-wikidata-musicians', 'Wikidata Musicians', 'https://query.wikidata.org/sparql', 'Wikidata SPARQL query for musical artists including singers, musicians, composers, and bands with biographical data.', 'sparql-json', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (6, 'ds-wikidata-albums', 'Wikidata Albums and Songs', 'https://query.wikidata.org/sparql', 'Wikidata SPARQL query for music albums, singles, and recordings with artist associations and release information.', 'sparql-json', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (7, 'ds-curated-soundtracks', 'Curated Movie Soundtracks', '', 'Curated dataset of notable movie soundtrack entries linking films to their featured songs and scores.', 'json', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (8, 'ds-curated-concerts', 'Curated Concert and Setlist Data', '', 'Curated dataset of concert venues, live performance events, and setlist entries with song positions.', 'json', '2025');

INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (9, 'ds-musicbrainz-dump', 'MusicBrainz Database Dump', 'https://data.metabrainz.org/pub/musicbrainz/data/fullexport/', 'MusicBrainz open music encyclopedia full database dump. Artists, releases, recordings, and track listings. CC0 public domain.', 'tsv-pg-copy', '2026');
