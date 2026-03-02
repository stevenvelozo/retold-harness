-- US Federal Data - Static Seed Data
-- Census Regions (4), Census Divisions (9), Data Sources (6), Admin User (1)

-- Admin User
INSERT INTO User (IDUser, GUIDUser, LoginID, Password, NameFirst, NameLast, FullName, Config)
	VALUES (1, 1001, 'admin', 'hash123', 'Admin', 'User', 'Admin User', '{}');

-- Census Regions (4 official US Census Bureau regions)
INSERT INTO CensusRegion (IDCensusRegion, GUIDCensusRegion, Name, RegionCode)
	VALUES (1, 'census-region-northeast', 'Northeast', 1);
INSERT INTO CensusRegion (IDCensusRegion, GUIDCensusRegion, Name, RegionCode)
	VALUES (2, 'census-region-midwest', 'Midwest', 2);
INSERT INTO CensusRegion (IDCensusRegion, GUIDCensusRegion, Name, RegionCode)
	VALUES (3, 'census-region-south', 'South', 3);
INSERT INTO CensusRegion (IDCensusRegion, GUIDCensusRegion, Name, RegionCode)
	VALUES (4, 'census-region-west', 'West', 4);

-- Census Divisions (9 official US Census Bureau divisions)
-- Northeast
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (1, 'census-division-new-england', 'New England', 1, 1);
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (2, 'census-division-mid-atlantic', 'Middle Atlantic', 2, 1);
-- Midwest
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (3, 'census-division-east-north-central', 'East North Central', 3, 2);
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (4, 'census-division-west-north-central', 'West North Central', 4, 2);
-- South
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (5, 'census-division-south-atlantic', 'South Atlantic', 5, 3);
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (6, 'census-division-east-south-central', 'East South Central', 6, 3);
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (7, 'census-division-west-south-central', 'West South Central', 7, 3);
-- West
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (8, 'census-division-mountain', 'Mountain', 8, 4);
INSERT INTO CensusDivision (IDCensusDivision, GUIDCensusDivision, Name, DivisionCode, IDCensusRegion)
	VALUES (9, 'census-division-pacific', 'Pacific', 9, 4);

-- Data Sources (provenance tracking for each federal data file)
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (1, 'ds-state-fips', 'State FIPS Codes', 'https://www2.census.gov/geo/docs/reference/state.txt', 'FIPS state codes, abbreviations, and names from the US Census Bureau ANSI reference files.', 'pipe-delimited', '2020');
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (2, 'ds-county-fips', 'County FIPS Codes', 'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt', 'FIPS county codes with state cross-references from the US Census Bureau 2020 reference files.', 'pipe-delimited', '2020');
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (3, 'ds-city-gazetteer', 'Places/Cities Gazetteer', 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.txt', 'Census Bureau Gazetteer file for incorporated places and census-designated places with geographic coordinates and area measurements.', 'tab-delimited', '2024');
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (4, 'ds-zcta-gazetteer', 'ZCTA/ZIP Code Gazetteer', 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.txt', 'Census Bureau Gazetteer file for ZIP Code Tabulation Areas with geographic coordinates and area measurements.', 'tab-delimited', '2024');
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (5, 'ds-cd-gazetteer', 'Congressional Districts Gazetteer', 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cd119_national.txt', 'Census Bureau Gazetteer file for 119th Congress congressional districts with geographic coordinates and area measurements.', 'tab-delimited', '2024');
INSERT INTO DataSource (IDDataSource, GUIDDataSource, Name, URL, Description, FileFormat, Vintage)
	VALUES (6, 'ds-cousub-gazetteer', 'County Subdivisions Gazetteer', 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cousub_national.txt', 'Census Bureau Gazetteer file for county subdivisions (townships, boroughs, etc.) with geographic coordinates and area measurements.', 'tab-delimited', '2024');
