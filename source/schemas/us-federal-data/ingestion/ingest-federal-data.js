#!/usr/bin/env node
/**
* US Federal Data Ingestion Orchestrator
*
* Downloads Census Bureau data files, transforms them via meadow-integration
* mapping pipeline, and pushes records to the running retold-harness API.
*
* Prerequisites:
*   1. Start the harness: HARNESS_SCHEMA=us-federal-data npm start
*   2. Run this script: npm run ingest-federal-data
*
* The script downloads 6 federal data files, parses them according to their
* delimiter format, runs each record through meadow-integration's TabularTransform
* with entity-specific mapping files, then writes the transformed records as
* SQL INSERT statements for direct bulk loading into the SQLite database.
*
* The meadow-integration comprehension pipeline handles:
*   - Column mapping via Pict template expressions
*   - GUID generation from natural keys (FIPS codes, GEOIDs)
*   - Deduplication via comprehension keying
*   - Foreign key GUID cross-references
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPict = require('pict');
const libPath = require('path');
const libFS = require('fs');
const libHTTPS = require('https');
const libHTTP = require('http');
const libZlib = require('zlib');

// Meadow-integration services
const libTabularTransform = require('meadow-integration/source/services/tabular/Service-TabularTransform.js');

// ─────────────────────────────────────────────
//  Configuration
// ─────────────────────────────────────────────

const HARNESS_API_PORT = parseInt(process.env.PORT, 10) || 8087;
const HARNESS_API_HOST = process.env.HARNESS_HOST || '127.0.0.1';
const DOWNLOAD_DIR = libPath.resolve(__dirname, '..', 'data', 'downloads');
const MAPPING_DIR = __dirname;

// Federal data sources
const DATA_SOURCES =
{
	'State':
	{
		url: 'https://www2.census.gov/geo/docs/reference/state.txt',
		filename: 'state.txt',
		delimiter: '|',
		isZip: false,
		mapping: 'mapping-state.json',
		phase: 1
	},
	'County':
	{
		url: 'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt',
		filename: 'national_county2020.txt',
		delimiter: '|',
		isZip: false,
		mapping: 'mapping-county.json',
		phase: 2
	},
	'CountyGazetteer':
	{
		url: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip',
		filename: '2024_Gaz_counties_national.zip',
		innerFile: '2024_Gaz_counties_national.txt',
		delimiter: '\t',
		isZip: true,
		entity: 'County',
		phase: 2,
		isEnrichment: true
	},
	'City':
	{
		url: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip',
		filename: '2024_Gaz_place_national.zip',
		innerFile: '2024_Gaz_place_national.txt',
		delimiter: '\t',
		isZip: true,
		mapping: 'mapping-city.json',
		phase: 3
	},
	'ZIPCode':
	{
		url: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip',
		filename: '2024_Gaz_zcta_national.zip',
		innerFile: '2024_Gaz_zcta_national.txt',
		delimiter: '\t',
		isZip: true,
		mapping: 'mapping-zipcode.json',
		phase: 3
	},
	'CongressionalDistrict':
	{
		url: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_119CDs_national.zip',
		filename: '2024_Gaz_119CDs_national.zip',
		innerFile: '2024_Gaz_119CDs_national.txt',
		delimiter: '\t',
		isZip: true,
		mapping: 'mapping-congressional-district.json',
		phase: 3
	},
	'CountySubdivision':
	{
		url: 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_cousubs_national.zip',
		filename: '2024_Gaz_cousubs_national.zip',
		innerFile: '2024_Gaz_cousubs_national.txt',
		delimiter: '\t',
		isZip: true,
		mapping: 'mapping-county-subdivision.json',
		phase: 3
	}
};

// ─────────────────────────────────────────────
//  State-to-Region/Division Lookup
//  Census Bureau doesn't include region/division in the state FIPS file,
//  so we maintain a static lookup table based on official Census definitions.
// ─────────────────────────────────────────────
const STATE_CENSUS_MAP =
{
	// Northeast Region (1) - New England Division (1)
	'CT': { RegionID: 1, DivisionID: 1 }, 'ME': { RegionID: 1, DivisionID: 1 },
	'MA': { RegionID: 1, DivisionID: 1 }, 'NH': { RegionID: 1, DivisionID: 1 },
	'RI': { RegionID: 1, DivisionID: 1 }, 'VT': { RegionID: 1, DivisionID: 1 },
	// Northeast Region (1) - Middle Atlantic Division (2)
	'NJ': { RegionID: 1, DivisionID: 2 }, 'NY': { RegionID: 1, DivisionID: 2 },
	'PA': { RegionID: 1, DivisionID: 2 },
	// Midwest Region (2) - East North Central Division (3)
	'IL': { RegionID: 2, DivisionID: 3 }, 'IN': { RegionID: 2, DivisionID: 3 },
	'MI': { RegionID: 2, DivisionID: 3 }, 'OH': { RegionID: 2, DivisionID: 3 },
	'WI': { RegionID: 2, DivisionID: 3 },
	// Midwest Region (2) - West North Central Division (4)
	'IA': { RegionID: 2, DivisionID: 4 }, 'KS': { RegionID: 2, DivisionID: 4 },
	'MN': { RegionID: 2, DivisionID: 4 }, 'MO': { RegionID: 2, DivisionID: 4 },
	'NE': { RegionID: 2, DivisionID: 4 }, 'ND': { RegionID: 2, DivisionID: 4 },
	'SD': { RegionID: 2, DivisionID: 4 },
	// South Region (3) - South Atlantic Division (5)
	'DE': { RegionID: 3, DivisionID: 5 }, 'FL': { RegionID: 3, DivisionID: 5 },
	'GA': { RegionID: 3, DivisionID: 5 }, 'MD': { RegionID: 3, DivisionID: 5 },
	'NC': { RegionID: 3, DivisionID: 5 }, 'SC': { RegionID: 3, DivisionID: 5 },
	'VA': { RegionID: 3, DivisionID: 5 }, 'DC': { RegionID: 3, DivisionID: 5 },
	'WV': { RegionID: 3, DivisionID: 5 },
	// South Region (3) - East South Central Division (6)
	'AL': { RegionID: 3, DivisionID: 6 }, 'KY': { RegionID: 3, DivisionID: 6 },
	'MS': { RegionID: 3, DivisionID: 6 }, 'TN': { RegionID: 3, DivisionID: 6 },
	// South Region (3) - West South Central Division (7)
	'AR': { RegionID: 3, DivisionID: 7 }, 'LA': { RegionID: 3, DivisionID: 7 },
	'OK': { RegionID: 3, DivisionID: 7 }, 'TX': { RegionID: 3, DivisionID: 7 },
	// West Region (4) - Mountain Division (8)
	'AZ': { RegionID: 4, DivisionID: 8 }, 'CO': { RegionID: 4, DivisionID: 8 },
	'ID': { RegionID: 4, DivisionID: 8 }, 'MT': { RegionID: 4, DivisionID: 8 },
	'NV': { RegionID: 4, DivisionID: 8 }, 'NM': { RegionID: 4, DivisionID: 8 },
	'UT': { RegionID: 4, DivisionID: 8 }, 'WY': { RegionID: 4, DivisionID: 8 },
	// West Region (4) - Pacific Division (9)
	'AK': { RegionID: 4, DivisionID: 9 }, 'CA': { RegionID: 4, DivisionID: 9 },
	'HI': { RegionID: 4, DivisionID: 9 }, 'OR': { RegionID: 4, DivisionID: 9 },
	'WA': { RegionID: 4, DivisionID: 9 }
};

// FIPS state code to abbreviation lookup (built during state ingestion)
let FIPS_TO_ABBREVIATION = {};

// ─────────────────────────────────────────────
//  Initialize Pict + meadow-integration services
// ─────────────────────────────────────────────
let _Pict = new libPict({ LogLevel: 3 });
_Pict.addAndInstantiateServiceType('MeadowIntegrationTabularTransform', libTabularTransform);

// ─────────────────────────────────────────────
//  Utility Functions
// ─────────────────────────────────────────────

/**
* Download a file from a URL.
* @param {string} pURL
* @param {string} pDestPath
* @param {function} fCallback - (pError)
*/
function downloadFile(pURL, pDestPath, fCallback)
{
	if (libFS.existsSync(pDestPath))
	{
		console.log(`  [cached] ${libPath.basename(pDestPath)}`);
		return fCallback();
	}

	console.log(`  [downloading] ${pURL}`);
	let tmpFile = libFS.createWriteStream(pDestPath);

	libHTTPS.get(pURL, (pResponse) =>
	{
		if (pResponse.statusCode === 301 || pResponse.statusCode === 302)
		{
			tmpFile.close();
			libFS.unlinkSync(pDestPath);
			return downloadFile(pResponse.headers.location, pDestPath, fCallback);
		}

		if (pResponse.statusCode !== 200)
		{
			tmpFile.close();
			libFS.unlinkSync(pDestPath);
			return fCallback(`HTTP ${pResponse.statusCode} for ${pURL}`);
		}

		pResponse.pipe(tmpFile);
		tmpFile.on('finish', () =>
		{
			tmpFile.close();
			return fCallback();
		});
	}).on('error', (pError) =>
	{
		tmpFile.close();
		if (libFS.existsSync(pDestPath)) libFS.unlinkSync(pDestPath);
		return fCallback(pError.message);
	});
}

/**
* Extract a .zip file using the unzip command.
* @param {string} pZipPath
* @param {string} pDestDir
* @param {function} fCallback - (pError)
*/
function extractZip(pZipPath, pDestDir, fCallback)
{
	let tmpChild = require('child_process').exec(
		`unzip -o "${pZipPath}" -d "${pDestDir}"`,
		{ timeout: 30000 },
		(pError) =>
		{
			if (pError)
			{
				return fCallback(`Unzip error: ${pError.message}`);
			}
			return fCallback();
		});
}

/**
* Parse a delimited text file into an array of record objects.
* Handles pipe-delimited and tab-delimited Census Bureau files.
* Trims whitespace from header names and field values.
*
* @param {string} pFilePath
* @param {string} pDelimiter
* @returns {Array<object>}
*/
function parseDelimitedFile(pFilePath, pDelimiter)
{
	let tmpContent = libFS.readFileSync(pFilePath, 'utf8');
	let tmpLines = tmpContent.split('\n');
	let tmpRecords = [];

	if (tmpLines.length < 2)
	{
		return tmpRecords;
	}

	// Parse header (trim whitespace from column names)
	let tmpHeaders = tmpLines[0].split(pDelimiter).map((pH) => pH.trim());

	for (let i = 1; i < tmpLines.length; i++)
	{
		let tmpLine = tmpLines[i].trim();
		if (tmpLine.length < 1)
		{
			continue;
		}

		let tmpFields = tmpLine.split(pDelimiter);
		let tmpRecord = {};

		for (let j = 0; j < tmpHeaders.length; j++)
		{
			tmpRecord[tmpHeaders[j]] = (j < tmpFields.length) ? tmpFields[j].trim() : '';
		}

		tmpRecords.push(tmpRecord);
	}

	return tmpRecords;
}

/**
* Post a record to the harness REST API.
*
* @param {string} pEntity
* @param {object} pRecord
* @param {function} fCallback - (pError, pResponseBody)
*/
function apiPost(pEntity, pRecord, fCallback)
{
	let tmpBody = JSON.stringify(pRecord);
	let tmpOptions =
	{
		hostname: HARNESS_API_HOST,
		port: HARNESS_API_PORT,
		path: `/1.0/${pEntity}`,
		method: 'POST',
		headers:
		{
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(tmpBody)
		}
	};

	let tmpReq = libHTTP.request(tmpOptions, (pRes) =>
	{
		let tmpData = '';
		pRes.on('data', (pChunk) => { tmpData += pChunk; });
		pRes.on('end', () =>
		{
			try
			{
				return fCallback(null, JSON.parse(tmpData));
			}
			catch (pParseError)
			{
				return fCallback(null, tmpData);
			}
		});
	});

	tmpReq.on('error', (pError) => { return fCallback(pError.message); });
	tmpReq.write(tmpBody);
	tmpReq.end();
}

/**
* GET request to the harness REST API.
*
* @param {string} pPath - API path (e.g., '/1.0/States/0/100')
* @param {function} fCallback - (pError, pResponseBody)
*/
function apiGet(pPath, fCallback)
{
	let tmpOptions =
	{
		hostname: HARNESS_API_HOST,
		port: HARNESS_API_PORT,
		path: pPath,
		method: 'GET'
	};

	let tmpReq = libHTTP.request(tmpOptions, (pRes) =>
	{
		let tmpData = '';
		pRes.on('data', (pChunk) => { tmpData += pChunk; });
		pRes.on('end', () =>
		{
			try
			{
				return fCallback(null, JSON.parse(tmpData));
			}
			catch (pParseError)
			{
				return fCallback(null, tmpData);
			}
		});
	});

	tmpReq.on('error', (pError) => { return fCallback(pError.message); });
	tmpReq.end();
}

/**
* PUT request to the harness REST API (for updates).
*
* @param {string} pEntity
* @param {object} pRecord - Must include the IDEntity field
* @param {function} fCallback - (pError, pResponseBody)
*/
function apiPut(pEntity, pRecord, fCallback)
{
	let tmpBody = JSON.stringify(pRecord);
	let tmpOptions =
	{
		hostname: HARNESS_API_HOST,
		port: HARNESS_API_PORT,
		path: `/1.0/${pEntity}`,
		method: 'PUT',
		headers:
		{
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(tmpBody)
		}
	};

	let tmpReq = libHTTP.request(tmpOptions, (pRes) =>
	{
		let tmpData = '';
		pRes.on('data', (pChunk) => { tmpData += pChunk; });
		pRes.on('end', () =>
		{
			try
			{
				return fCallback(null, JSON.parse(tmpData));
			}
			catch (pParseError)
			{
				return fCallback(null, tmpData);
			}
		});
	});

	tmpReq.on('error', (pError) => { return fCallback(pError.message); });
	tmpReq.write(tmpBody);
	tmpReq.end();
}

/**
* Post records in batches to the harness REST API.
*
* @param {string} pEntity
* @param {Array<object>} pRecords
* @param {function} fCallback - (pError, pStats)
*/
function batchApiPost(pEntity, pRecords, fCallback)
{
	let tmpTotal = pRecords.length;

	if (tmpTotal < 1)
	{
		console.log(`  [push] 0 ${pEntity} records (nothing to push)`);
		return fCallback(null, { success: 0, errors: 0 });
	}

	let tmpSuccess = 0;
	let tmpErrors = 0;
	let tmpIndex = 0;
	let tmpConcurrent = 0;
	let tmpMaxConcurrent = 10;

	console.log(`  [push] ${tmpTotal} ${pEntity} records to API...`);

	let tmpPushNext = () =>
	{
		while (tmpConcurrent < tmpMaxConcurrent && tmpIndex < tmpTotal)
		{
			let tmpRecord = pRecords[tmpIndex];
			tmpIndex++;
			tmpConcurrent++;

			apiPost(pEntity, tmpRecord, (pError, pResponse) =>
			{
				tmpConcurrent--;

				if (pError)
				{
					tmpErrors++;
				}
				else
				{
					tmpSuccess++;
				}

				if (tmpSuccess % 1000 === 0 && tmpSuccess > 0)
				{
					console.log(`    ... ${tmpSuccess}/${tmpTotal} ${pEntity} records pushed`);
				}

				if (tmpSuccess + tmpErrors >= tmpTotal)
				{
					console.log(`  [done] ${pEntity}: ${tmpSuccess} success, ${tmpErrors} errors`);
					return fCallback(null, { success: tmpSuccess, errors: tmpErrors });
				}

				tmpPushNext();
			});
		}
	};

	tmpPushNext();
}

/**
* PUT records in batches to the harness REST API (for updates).
*
* @param {string} pEntity
* @param {Array<object>} pRecords
* @param {function} fCallback - (pError, pStats)
*/
function batchApiPut(pEntity, pRecords, fCallback)
{
	let tmpTotal = pRecords.length;

	if (tmpTotal < 1)
	{
		console.log(`  [update] 0 ${pEntity} records (nothing to update)`);
		return fCallback(null, { success: 0, errors: 0 });
	}

	let tmpSuccess = 0;
	let tmpErrors = 0;
	let tmpIndex = 0;
	let tmpConcurrent = 0;
	let tmpMaxConcurrent = 10;

	console.log(`  [update] ${tmpTotal} ${pEntity} records via PUT...`);

	let tmpPushNext = () =>
	{
		while (tmpConcurrent < tmpMaxConcurrent && tmpIndex < tmpTotal)
		{
			let tmpRecord = pRecords[tmpIndex];
			tmpIndex++;
			tmpConcurrent++;

			apiPut(pEntity, tmpRecord, (pError, pResponse) =>
			{
				tmpConcurrent--;

				if (pError)
				{
					tmpErrors++;
				}
				else
				{
					tmpSuccess++;
				}

				if (tmpSuccess % 1000 === 0 && tmpSuccess > 0)
				{
					console.log(`    ... ${tmpSuccess}/${tmpTotal} ${pEntity} records updated`);
				}

				if (tmpSuccess + tmpErrors >= tmpTotal)
				{
					console.log(`  [done] ${pEntity} update: ${tmpSuccess} success, ${tmpErrors} errors`);
					return fCallback(null, { success: tmpSuccess, errors: tmpErrors });
				}

				tmpPushNext();
			});
		}
	};

	tmpPushNext();
}

/**
* Fetch all records of an entity with pagination.
*
* @param {string} pEntityPlural - Plural entity name (e.g., 'States')
* @param {function} fCallback - (pError, pRecords)
*/
function fetchAllRecords(pEntityPlural, fCallback)
{
	let tmpAllRecords = [];
	let tmpPageSize = 500;

	let tmpFetchPage = (pBegin) =>
	{
		apiGet(`/1.0/${pEntityPlural}/${pBegin}/${tmpPageSize}`, (pError, pResponse) =>
		{
			if (pError)
			{
				return fCallback(pError);
			}

			if (!Array.isArray(pResponse))
			{
				return fCallback(null, tmpAllRecords);
			}

			tmpAllRecords = tmpAllRecords.concat(pResponse);

			if (pResponse.length >= tmpPageSize)
			{
				return tmpFetchPage(pBegin + tmpPageSize);
			}

			return fCallback(null, tmpAllRecords);
		});
	};

	tmpFetchPage(0);
}

// FK resolution lookup tables (built between ingestion phases)
let STATE_LOOKUP = {};   // abbreviation → IDState
let COUNTY_LOOKUP = {};  // GUIDCounty (e.g., 'County-01001') → IDCounty

/**
* Build the state lookup table from ingested state records.
*
* @param {function} fCallback
*/
function buildStateLookup(fCallback)
{
	console.log('\n  [lookup] Building State abbreviation → IDState map...');
	fetchAllRecords('States', (pError, pRecords) =>
	{
		if (pError)
		{
			console.error(`  [error] Failed to fetch states: ${pError}`);
			return fCallback(pError);
		}

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpState = pRecords[i];
			if (tmpState.Abbreviation && tmpState.IDState)
			{
				STATE_LOOKUP[tmpState.Abbreviation] = tmpState.IDState;
			}
		}

		console.log(`  [lookup] ${Object.keys(STATE_LOOKUP).length} state mappings loaded`);
		return fCallback(null);
	});
}

/**
* Build the county lookup table from ingested county records.
*
* @param {function} fCallback
*/
function buildCountyLookup(fCallback)
{
	console.log('\n  [lookup] Building County FIPS → IDCounty map...');
	fetchAllRecords('Countys', (pError, pRecords) =>
	{
		if (pError)
		{
			console.error(`  [error] Failed to fetch counties: ${pError}`);
			return fCallback(pError);
		}

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpCounty = pRecords[i];
			if (tmpCounty.IDCounty && (tmpCounty.StateFIPS || tmpCounty.StateFIPS === 0))
			{
				// Reconstruct the GEOID-style key: zero-padded StateFIPS (2) + CountyFIPS (3)
				let tmpGeoID = String(tmpCounty.StateFIPS).padStart(2, '0') +
					String(tmpCounty.CountyFIPS).padStart(3, '0');
				COUNTY_LOOKUP[`County-${tmpGeoID}`] = tmpCounty.IDCounty;
			}
		}

		console.log(`  [lookup] ${Object.keys(COUNTY_LOOKUP).length} county mappings loaded`);
		return fCallback(null);
	});
}

/**
* Resolve FK GUID fields to actual integer IDs on a record.
* Mutates the record in place.
*
* @param {object} pRecord
* @param {string} pEntityKey - The entity being processed (to avoid deleting its own GUID)
*/
function resolveRecordForeignKeys(pRecord, pEntityKey)
{
	// Skip the entity's own GUID field — only resolve FK references to OTHER entities
	let tmpOwnGUIDField = `GUID${pEntityKey}`;

	if (pRecord.GUIDState && 'GUIDState' !== tmpOwnGUIDField)
	{
		// Extract abbreviation from GUIDState (e.g., 'State-AL' → 'AL')
		let tmpAbbrev = pRecord.GUIDState.replace('State-', '');
		let tmpIDState = STATE_LOOKUP[tmpAbbrev];
		if (tmpIDState)
		{
			pRecord.IDState = tmpIDState;
		}
		delete pRecord.GUIDState;
	}

	if (pRecord.GUIDCounty && 'GUIDCounty' !== tmpOwnGUIDField)
	{
		let tmpIDCounty = COUNTY_LOOKUP[pRecord.GUIDCounty];
		if (tmpIDCounty)
		{
			pRecord.IDCounty = tmpIDCounty;
		}
		delete pRecord.GUIDCounty;
	}
}

/**
* Process a single entity through the meadow-integration pipeline.
*
* @param {string} pEntityKey - Key in DATA_SOURCES
* @param {function} fCallback - (pError, pStats)
*/
function processEntity(pEntityKey, fCallback)
{
	let tmpSource = DATA_SOURCES[pEntityKey];
	if (!tmpSource || tmpSource.isEnrichment)
	{
		return fCallback();
	}

	let tmpEntityName = tmpSource.entity || pEntityKey;
	console.log(`\n=== Processing ${tmpEntityName} ===`);

	// Step 1: Ensure file is downloaded
	let tmpFilePath = libPath.join(DOWNLOAD_DIR, tmpSource.filename);
	downloadFile(tmpSource.url, tmpFilePath, (pDownloadError) =>
	{
		if (pDownloadError)
		{
			console.error(`  [error] Download failed for ${pEntityKey}: ${pDownloadError}`);
			return fCallback(pDownloadError);
		}

		let tmpDataFilePath = tmpFilePath;

		let tmpProcessData = () =>
		{
			// Step 2: Parse the file
			console.log(`  [parse] ${libPath.basename(tmpDataFilePath)} (delimiter: ${tmpSource.delimiter === '\t' ? 'TAB' : tmpSource.delimiter})`);
			let tmpRecords = parseDelimitedFile(tmpDataFilePath, tmpSource.delimiter);
			console.log(`  [parsed] ${tmpRecords.length} raw records`);

			// Step 3: Load the mapping file
			let tmpMappingPath = libPath.join(MAPPING_DIR, tmpSource.mapping);
			let tmpMappingConfig = JSON.parse(libFS.readFileSync(tmpMappingPath, 'utf8'));

			// Step 4: Transform via meadow-integration TabularTransform
			let tmpOutcome = _Pict.MeadowIntegrationTabularTransform.newMappingOutcomeObject();
			tmpOutcome.ExplicitConfiguration = tmpMappingConfig;
			tmpOutcome.Configuration = Object.assign({}, tmpMappingConfig);
			tmpOutcome.Configuration.GUIDName = `GUID${tmpMappingConfig.Entity}`;
			tmpOutcome.Comprehension[tmpMappingConfig.Entity] = {};

			for (let i = 0; i < tmpRecords.length; i++)
			{
				let tmpRecord = tmpRecords[i];

				// Enrich: inject FK GUIDs that aren't in the source data
				if (pEntityKey === 'State')
				{
					let tmpAbbrev = tmpRecord.STUSAB;
					let tmpCensusInfo = STATE_CENSUS_MAP[tmpAbbrev];
					if (tmpCensusInfo)
					{
						tmpRecord.IDCensusRegion = tmpCensusInfo.RegionID;
						tmpRecord.IDCensusDivision = tmpCensusInfo.DivisionID;
					}
					// Build FIPS-to-abbreviation lookup for later use
					FIPS_TO_ABBREVIATION[tmpRecord.STATE] = tmpAbbrev;
				}
				else if (pEntityKey === 'ZIPCode')
				{
					// ZCTA GEOID is the ZIP code itself (e.g., "00601")
					// First 2 digits approximate the state FIPS, but ZCTAs can span states
					// We'll try to map using the first 2 digits as state FIPS
					let tmpStateFIPS = tmpRecord.GEOID.substring(0, 2);
					let tmpStateAbbrev = FIPS_TO_ABBREVIATION[tmpStateFIPS];
					if (tmpStateAbbrev)
					{
						tmpRecord.USPS = tmpStateAbbrev;
						tmpRecord._GUIDState = `State-${tmpStateAbbrev}`;
					}
				}
				else if (pEntityKey === 'CountySubdivision')
				{
					// CountySub GEOID is 10 digits: SSCCCTTTTTT (state + county + subdivision)
					let tmpGeoID = String(tmpRecord.GEOID);
					if (tmpGeoID.length >= 5)
					{
						let tmpStateFIPS = tmpGeoID.substring(0, 2);
						let tmpCountyFIPS = tmpGeoID.substring(2, 5);
						tmpRecord._GUIDCounty = `County-${tmpStateFIPS}${tmpCountyFIPS}`;
					}
				}

				_Pict.MeadowIntegrationTabularTransform.addRecordToComprehension(tmpRecord, tmpOutcome);
			}

			let tmpComprehensionRecords = tmpOutcome.Comprehension[tmpMappingConfig.Entity];
			let tmpKeys = Object.keys(tmpComprehensionRecords);
			console.log(`  [transform] ${tmpKeys.length} comprehension records created (${tmpOutcome.BadRecords.length} bad records skipped)`);

			// Step 5: Prepare records for API push
			let tmpAPIRecords = [];
			for (let i = 0; i < tmpKeys.length; i++)
			{
				let tmpCompRecord = tmpComprehensionRecords[tmpKeys[i]];

				// Inject FK IDs that we computed during enrichment
				if (pEntityKey === 'State')
				{
					let tmpAbbrev = tmpCompRecord.Abbreviation;
					let tmpCensusInfo = STATE_CENSUS_MAP[tmpAbbrev];
					if (tmpCensusInfo)
					{
						tmpCompRecord.IDCensusRegion = tmpCensusInfo.RegionID;
						tmpCompRecord.IDCensusDivision = tmpCensusInfo.DivisionID;
					}
				}

				// Resolve FK GUIDs (GUIDState, GUIDCounty) to actual integer IDs
				resolveRecordForeignKeys(tmpCompRecord, tmpMappingConfig.Entity);

				tmpAPIRecords.push(tmpCompRecord);
			}

			// Step 6: Push to harness API
			batchApiPost(tmpMappingConfig.Entity, tmpAPIRecords, fCallback);
		};

		// If ZIP, extract first
		if (tmpSource.isZip)
		{
			extractZip(tmpFilePath, DOWNLOAD_DIR, (pExtractError) =>
			{
				if (pExtractError)
				{
					console.error(`  [error] Extract failed: ${pExtractError}`);
					return fCallback(pExtractError);
				}
				tmpDataFilePath = libPath.join(DOWNLOAD_DIR, tmpSource.innerFile);
				tmpProcessData();
			});
		}
		else
		{
			tmpProcessData();
		}
	});
}

/**
* Enrich county records with gazetteer data (area, coordinates).
*
* @param {function} fCallback
*/
function enrichCountiesFromGazetteer(fCallback)
{
	let tmpSource = DATA_SOURCES['CountyGazetteer'];
	console.log(`\n=== Enriching Counties with Gazetteer data ===`);

	let tmpFilePath = libPath.join(DOWNLOAD_DIR, tmpSource.filename);
	downloadFile(tmpSource.url, tmpFilePath, (pDownloadError) =>
	{
		if (pDownloadError)
		{
			console.error(`  [error] Download failed: ${pDownloadError}`);
			return fCallback(pDownloadError);
		}

		extractZip(tmpFilePath, DOWNLOAD_DIR, (pExtractError) =>
		{
			if (pExtractError)
			{
				console.error(`  [error] Extract failed: ${pExtractError}`);
				return fCallback(pExtractError);
			}

			let tmpDataPath = libPath.join(DOWNLOAD_DIR, tmpSource.innerFile);
			let tmpRecords = parseDelimitedFile(tmpDataPath, tmpSource.delimiter);
			console.log(`  [parsed] ${tmpRecords.length} county gazetteer records`);

			// Build update records, resolving GUIDs to IDs for PUT
			let tmpUpdateRecords = [];
			let tmpSkipped = 0;
			for (let i = 0; i < tmpRecords.length; i++)
			{
				let tmpRec = tmpRecords[i];
				let tmpGUID = `County-${tmpRec.GEOID}`;
				let tmpIDCounty = COUNTY_LOOKUP[tmpGUID];

				if (tmpIDCounty)
				{
					tmpUpdateRecords.push(
					{
						IDCounty: tmpIDCounty,
						GUIDCounty: tmpGUID,
						LandArea: tmpRec.ALAND || 0,
						WaterArea: tmpRec.AWATER || 0,
						LandAreaSqMi: tmpRec.ALAND_SQMI || 0,
						WaterAreaSqMi: tmpRec.AWATER_SQMI || 0,
						Latitude: tmpRec.INTPTLAT || 0,
						Longitude: tmpRec.INTPTLONG || 0
					});
				}
				else
				{
					tmpSkipped++;
				}
			}

			if (tmpSkipped > 0)
			{
				console.log(`  [warn] ${tmpSkipped} gazetteer records had no matching county GUID`);
			}

			console.log(`  [update] ${tmpUpdateRecords.length} county enrichment records (via PUT)`);
			batchApiPut('County', tmpUpdateRecords, fCallback);
		});
	});
}

// ─────────────────────────────────────────────
//  Main Orchestration
// ─────────────────────────────────────────────
function main()
{
	console.log('╔══════════════════════════════════════════════════════╗');
	console.log('║  US Federal Data Ingestion Pipeline                 ║');
	console.log('║  meadow-integration TabularTransform + REST API     ║');
	console.log('╚══════════════════════════════════════════════════════╝');
	console.log(`\nTarget: http://${HARNESS_API_HOST}:${HARNESS_API_PORT}/1.0/`);

	// Ensure download directory exists
	if (!libFS.existsSync(DOWNLOAD_DIR))
	{
		libFS.mkdirSync(DOWNLOAD_DIR, { recursive: true });
	}

	// Check that the harness API is running
	let tmpCheckReq = libHTTP.get(
		`http://${HARNESS_API_HOST}:${HARNESS_API_PORT}/1.0/CensusRegions/Count`,
		(pRes) =>
		{
			let tmpData = '';
			pRes.on('data', (pChunk) => { tmpData += pChunk; });
			pRes.on('end', () =>
			{
				console.log(`API health check: ${tmpData.trim()}`);
				runIngestion();
			});
		});

	tmpCheckReq.on('error', (pError) =>
	{
		console.error(`\n[FATAL] Cannot connect to harness API at http://${HARNESS_API_HOST}:${HARNESS_API_PORT}/`);
		console.error('Start the harness first:  HARNESS_SCHEMA=us-federal-data npm start');
		process.exit(1);
	});
}

function runIngestion()
{
	let tmpStartTime = Date.now();

	// Phase 1: States (depends on seeded Region/Division)
	console.log('\n────── Phase 1: States ──────');
	processEntity('State', (pError) =>
	{
		if (pError)
		{
			console.error(`Phase 1 failed: ${pError}`);
			return process.exit(1);
		}

		// Build State lookup for FK resolution in subsequent phases
		buildStateLookup((pLookupError) =>
		{
			if (pLookupError)
			{
				console.error(`State lookup failed: ${pLookupError}`);
				return process.exit(1);
			}

		// Phase 2: Counties (depends on State)
		console.log('\n────── Phase 2: Counties ──────');
		processEntity('County', (pError) =>
		{
			if (pError)
			{
				console.error(`Phase 2 failed: ${pError}`);
				return process.exit(1);
			}

			// Build County lookup for FK resolution
			buildCountyLookup((pCountyLookupError) =>
			{
				if (pCountyLookupError)
				{
					console.error(`County lookup failed: ${pCountyLookupError}`);
					return process.exit(1);
				}

			// Enrich counties with gazetteer area/coordinate data
			enrichCountiesFromGazetteer((pError) =>
			{
				if (pError)
				{
					console.warn(`County enrichment had issues: ${pError}`);
				}

				// Phase 3: Everything else (depends on State, some on County)
				console.log('\n────── Phase 3: Cities, ZIP Codes, Congressional Districts, County Subdivisions ──────');

				let tmpPhase3Entities = ['City', 'ZIPCode', 'CongressionalDistrict', 'CountySubdivision'];
				let tmpPhase3Done = 0;
				let tmpPhase3Errors = 0;

				for (let i = 0; i < tmpPhase3Entities.length; i++)
				{
					processEntity(tmpPhase3Entities[i], (pEntityError) =>
					{
						if (pEntityError)
						{
							console.error(`  ${tmpPhase3Entities[i]} error: ${pEntityError}`);
							tmpPhase3Errors++;
						}
						tmpPhase3Done++;

						if (tmpPhase3Done >= tmpPhase3Entities.length)
						{
							let tmpElapsed = ((Date.now() - tmpStartTime) / 1000).toFixed(1);
							console.log('\n╔══════════════════════════════════════════════════════╗');
							console.log(`║  Ingestion complete in ${tmpElapsed}s`);
							if (tmpPhase3Errors > 0)
							{
								console.log(`║  ${tmpPhase3Errors} entity errors during Phase 3`);
							}
							console.log('╚══════════════════════════════════════════════════════╝');
							process.exit(tmpPhase3Errors > 0 ? 1 : 0);
						}
					});
				}
			});
			});
		});
		});
	});
}

main();
