#!/usr/bin/env node
/**
* Entertainment Data Ingestion Script
*
* Ingests data from 9 sources into 16 entities:
*   Sources:
*     1. IMDb title.basics.tsv.gz   → Movie, Genre, MovieGenre
*     2. IMDb title.ratings.tsv.gz  → MovieRating
*     3. IMDb name.basics.tsv.gz    → Person
*     4. IMDb title.principals.tsv.gz → MovieCredit
*     5. Wikidata SPARQL (musicians) → Artist
*     6. Wikidata SPARQL (albums+songs) → Album, Song, AlbumTrack
*     7. Curated soundtracks.json   → Soundtrack (+ Song)
*     8. Curated concerts.json      → Venue, Concert, SetlistEntry
*     9. MusicBrainz database dump  → Artist, Album, Song, AlbumTrack
*
*   Phases:
*     1. Download IMDb files (cached)
*     2. Parse IMDb data (multi-pass filtered streaming)
*     3. POST IMDb entities with FK resolution
*     4. Query Wikidata for musicians → POST Artists
*     5. Query Wikidata for albums and songs → POST Albums, Songs
*     6. Query Wikidata for venues → POST Venues
*     7. Process curated soundtracks → POST Songs, Soundtracks
*     8. Process curated concerts → POST Venues, Concerts, SetlistEntries
*     9. Download and extract MusicBrainz dump (cached)
*    10. Parse MusicBrainz data → POST Artists, Albums, Songs, AlbumTracks
*
* @author Steven Velozo <steven@velozo.com>
*/
'use strict';

const libHTTP = require('http');
const libHTTPS = require('https');
const libFS = require('fs');
const libPath = require('path');
const libZlib = require('zlib');
const libReadline = require('readline');
const libChildProcess = require('child_process');

// ============================================================
// Configuration
// ============================================================
const HARNESS_API_HOST = '127.0.0.1';
const HARNESS_API_PORT = parseInt(process.env.ENTERTAINMENT_PORT, 10) || 8088;
const DOWNLOAD_DIR = libPath.join(__dirname, '..', '..', '..', '..', 'data', 'entertainment', 'downloads');
const CURATED_DIR = libPath.join(__dirname, '..', 'curated');
const CONCURRENCY = 5;
const POST_BATCH_SIZE = parseInt(process.env.POST_BATCH_SIZE, 10) || 500;
const MIN_VOTES = parseInt(process.env.MIN_VOTES, 10) || 10000;

// Data Source IDs (must match seed data)
const DS_IMDB_TITLE_BASICS = 1;
const DS_IMDB_TITLE_RATINGS = 2;
const DS_IMDB_NAME_BASICS = 3;
const DS_IMDB_TITLE_PRINCIPALS = 4;
const DS_WIKIDATA_MUSICIANS = 5;
const DS_WIKIDATA_ALBUMS = 6;
const DS_CURATED_SOUNDTRACKS = 7;
const DS_CURATED_CONCERTS = 8;
const DS_MUSICBRAINZ = 9;

// MusicBrainz dump configuration
const MB_DUMP_URL = 'https://data.metabrainz.org/pub/musicbrainz/data/fullexport/20260228-002116/mbdump.tar.bz2';
const MB_EXTRACT_DIR = libPath.join(DOWNLOAD_DIR, 'musicbrainz');
const MAX_MB_ARTISTS = parseInt(process.env.MAX_MB_ARTISTS, 10) || 2000;
const MAX_MB_ALBUMS_PER_ARTIST = parseInt(process.env.MAX_MB_ALBUMS_PER_ARTIST, 10) || 30;
const MB_TABLES = ['artist', 'artist_type', 'release_group', 'release_group_primary_type',
	'artist_credit_name', 'recording', 'track', 'medium', 'release', 'area'];

// IMDb file definitions
const IMDB_FILES =
{
	ratings: { url: 'https://datasets.imdbws.com/title.ratings.tsv.gz', filename: 'title.ratings.tsv.gz' },
	basics: { url: 'https://datasets.imdbws.com/title.basics.tsv.gz', filename: 'title.basics.tsv.gz' },
	principals: { url: 'https://datasets.imdbws.com/title.principals.tsv.gz', filename: 'title.principals.tsv.gz' },
	names: { url: 'https://datasets.imdbws.com/name.basics.tsv.gz', filename: 'name.basics.tsv.gz' }
};

// Wikidata SPARQL queries
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const SPARQL_USER_AGENT = 'RetoldHarness/1.0 (https://github.com/stevenvelozo/retold-harness; entertainment-ingestion) Node.js';

const SPARQL_MUSICIANS = `SELECT DISTINCT ?artist ?artistLabel ?birthYear ?deathYear ?countryLabel WHERE {
  VALUES ?occupation { wd:Q177220 wd:Q639669 wd:Q36834 }
  ?artist wdt:P106 ?occupation .
  ?artist wdt:P569 ?birthDate .
  BIND(YEAR(?birthDate) AS ?birthYear)
  OPTIONAL { ?artist wdt:P570 ?deathDate . BIND(YEAR(?deathDate) AS ?deathYear) }
  OPTIONAL { ?artist wdt:P27 ?country }
  FILTER(?birthYear > 1940)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 5000`;

const SPARQL_BANDS = `SELECT DISTINCT ?artist ?artistLabel ?startYear ?endYear ?countryLabel WHERE {
  ?artist wdt:P31 wd:Q215380 .
  OPTIONAL { ?artist wdt:P571 ?startDate . BIND(YEAR(?startDate) AS ?startYear) }
  OPTIONAL { ?artist wdt:P576 ?endDate . BIND(YEAR(?endDate) AS ?endYear) }
  OPTIONAL { ?artist wdt:P495 ?country }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 3000`;

const SPARQL_ALBUMS = `SELECT DISTINCT ?album ?albumLabel ?artist ?artistLabel ?year WHERE {
  ?album wdt:P31 wd:Q482994 .
  ?album wdt:P175 ?artist .
  ?album wdt:P577 ?date .
  BIND(YEAR(?date) AS ?year)
  FILTER(?year > 2000)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 5000`;

const SPARQL_SONGS = `SELECT DISTINCT ?song ?songLabel ?artist ?artistLabel ?year WHERE {
  ?song wdt:P31 wd:Q134556 .
  ?song wdt:P175 ?artist .
  OPTIONAL { ?song wdt:P577 ?date . BIND(YEAR(?date) AS ?year) }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 8000`;

const SPARQL_VENUES = `SELECT DISTINCT ?venue ?venueLabel ?cityLabel ?countryLabel ?capacity WHERE {
  ?venue wdt:P31 wd:Q18674739 .
  OPTIONAL { ?venue wdt:P131 ?city }
  OPTIONAL { ?venue wdt:P17 ?country }
  OPTIONAL { ?venue wdt:P1083 ?capacity }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
} LIMIT 2000`;

// ============================================================
// In-memory data stores (populated during parsing)
// ============================================================
const QUALIFYING_MOVIES = new Set();   // tconst values with enough votes
const QUALIFYING_PEOPLE = new Set();   // nconst values referenced by credits
const RATINGS_DATA = {};               // tconst → { averageRating, numVotes }
const MOVIE_RECORDS = [];              // parsed movie records
const GENRE_SET = new Set();           // unique genre names
const MOVIE_GENRE_PAIRS = [];          // [{ tconst, genre }]
const CREDIT_RECORDS = [];             // parsed credit records
const PERSON_RECORDS = [];             // parsed person records

// Lookup tables (built from API after POSTing)
const MOVIE_LOOKUP = {};       // ExternalID (tconst) → IDMovie
const PERSON_LOOKUP = {};      // ExternalID (nconst) → IDPerson
const GENRE_LOOKUP = {};       // genre name → IDGenre
const ARTIST_LOOKUP = {};      // ExternalID (QID or curated) → IDArtist
const ARTIST_NAME_LOOKUP = {}; // artist name (lowercase) → IDArtist
const SONG_LOOKUP = {};        // ExternalID → IDSong
const SONG_TITLE_LOOKUP = {};  // song title (lowercase) → IDSong
const VENUE_LOOKUP = {};       // curated venueId OR ExternalID → IDVenue
const CONCERT_LOOKUP = {};     // curated concertId → IDConcert
const ALBUM_LOOKUP = {};       // ExternalID (QID) → IDAlbum


// ============================================================
// Utility Functions
// ============================================================
function cleanIMDb(pValue)
{
	return (pValue === '\\N' || pValue === undefined) ? '' : pValue;
}

function cleanIMDbNum(pValue)
{
	if (pValue === '\\N' || pValue === undefined || pValue === '') return 0;
	let tmpNum = parseInt(pValue, 10);
	return isNaN(tmpNum) ? 0 : tmpNum;
}

function cleanIMDbFloat(pValue)
{
	if (pValue === '\\N' || pValue === undefined || pValue === '') return 0;
	let tmpNum = parseFloat(pValue);
	return isNaN(tmpNum) ? 0 : tmpNum;
}

function extractQID(pUri)
{
	if (!pUri) return '';
	let tmpMatch = pUri.match(/Q\d+$/);
	return tmpMatch ? tmpMatch[0] : '';
}

function ensureDir(pDirPath)
{
	if (!libFS.existsSync(pDirPath))
	{
		libFS.mkdirSync(pDirPath, { recursive: true });
	}
}


// ============================================================
// Download Functions
// ============================================================
function downloadFile(pUrl, pDestPath, fCallback)
{
	if (libFS.existsSync(pDestPath))
	{
		console.log(`  [download] Using cached: ${libPath.basename(pDestPath)}`);
		return fCallback(null);
	}

	console.log(`  [download] Downloading: ${libPath.basename(pDestPath)} from ${pUrl}`);

	let tmpFile = libFS.createWriteStream(pDestPath);

	let tmpDoRequest = (pRequestUrl, pDepth) =>
	{
		if (pDepth > 5) return fCallback('Too many redirects');

		libHTTPS.get(pRequestUrl,
		{
			headers: { 'User-Agent': SPARQL_USER_AGENT }
		}, (pResponse) =>
		{
			if (pResponse.statusCode === 301 || pResponse.statusCode === 302 || pResponse.statusCode === 307)
			{
				let tmpLocation = pResponse.headers.location;
				console.log(`  [download] Following redirect...`);
				pResponse.resume();
				return tmpDoRequest(tmpLocation, pDepth + 1);
			}

			if (pResponse.statusCode !== 200)
			{
				pResponse.resume();
				return fCallback(`HTTP ${pResponse.statusCode} for ${pUrl}`);
			}

			let tmpDownloaded = 0;
			let tmpContentLength = parseInt(pResponse.headers['content-length'], 10) || 0;
			let tmpLastPct = -1;

			pResponse.on('data', (pChunk) =>
			{
				tmpDownloaded += pChunk.length;
				if (tmpContentLength > 0)
				{
					let tmpPct = Math.floor((tmpDownloaded / tmpContentLength) * 10) * 10;
					if (tmpPct > tmpLastPct)
					{
						tmpLastPct = tmpPct;
						console.log(`  [download] ${libPath.basename(pDestPath)}: ${tmpPct}% (${Math.round(tmpDownloaded / 1024 / 1024)} MB)`);
					}
				}
			});

			pResponse.pipe(tmpFile);

			tmpFile.on('finish', () =>
			{
				tmpFile.close();
				console.log(`  [download] Complete: ${libPath.basename(pDestPath)} (${Math.round(tmpDownloaded / 1024 / 1024)} MB)`);
				return fCallback(null);
			});
		}).on('error', (pError) =>
		{
			libFS.unlink(pDestPath, () => {});
			return fCallback(pError.message);
		});
	};

	tmpDoRequest(pUrl, 0);
}

function downloadFileSequential(pFileList, fCallback)
{
	let tmpIndex = 0;
	let tmpNext = () =>
	{
		if (tmpIndex >= pFileList.length) return fCallback(null);
		let tmpFile = pFileList[tmpIndex++];
		downloadFile(tmpFile.url, libPath.join(DOWNLOAD_DIR, tmpFile.filename), (pError) =>
		{
			if (pError)
			{
				console.error(`  [download] ERROR: ${pError} — skipping ${tmpFile.filename}`);
			}
			tmpNext();
		});
	};
	tmpNext();
}


// ============================================================
// Gzipped TSV Streaming
// ============================================================
function streamGzippedTsv(pFilePath, pRecordCallback, fCallback)
{
	if (!libFS.existsSync(pFilePath))
	{
		console.error(`  [stream] File not found: ${pFilePath}`);
		return fCallback(`File not found: ${pFilePath}`);
	}

	let tmpReadStream = libFS.createReadStream(pFilePath);
	let tmpGunzip = libZlib.createGunzip();
	let tmpRL = libReadline.createInterface(
	{
		input: tmpReadStream.pipe(tmpGunzip),
		crlfDelay: Infinity
	});

	let tmpHeaders = null;
	let tmpLineCount = 0;

	tmpRL.on('line', (pLine) =>
	{
		if (!tmpHeaders)
		{
			tmpHeaders = pLine.split('\t');
			return;
		}

		tmpLineCount++;
		let tmpValues = pLine.split('\t');
		let tmpRecord = {};
		for (let i = 0; i < tmpHeaders.length; i++)
		{
			tmpRecord[tmpHeaders[i]] = tmpValues[i] || '';
		}
		pRecordCallback(tmpRecord);

		if (tmpLineCount % 1000000 === 0)
		{
			console.log(`  [stream] ${libPath.basename(pFilePath)}: ${(tmpLineCount / 1000000).toFixed(1)}M lines...`);
		}
	});

	tmpRL.on('close', () =>
	{
		console.log(`  [stream] ${libPath.basename(pFilePath)}: ${tmpLineCount.toLocaleString()} lines total.`);
		return fCallback(null);
	});

	tmpRL.on('error', (pError) =>
	{
		return fCallback(pError.message || pError);
	});

	tmpGunzip.on('error', (pError) =>
	{
		return fCallback(`Gunzip error: ${pError.message}`);
	});
}


// ============================================================
// Plain TSV Streaming (headerless PostgreSQL COPY format)
// ============================================================
function streamPlainTsv(pFilePath, pColumnCallback, fCallback)
{
	if (!libFS.existsSync(pFilePath))
	{
		console.error(`  [stream] File not found: ${pFilePath}`);
		return fCallback(`File not found: ${pFilePath}`);
	}

	let tmpReadStream = libFS.createReadStream(pFilePath, { encoding: 'utf-8' });
	let tmpRL = libReadline.createInterface(
	{
		input: tmpReadStream,
		crlfDelay: Infinity
	});

	let tmpLineCount = 0;

	tmpRL.on('line', (pLine) =>
	{
		tmpLineCount++;
		let tmpCols = pLine.split('\t');
		pColumnCallback(tmpCols);

		if (tmpLineCount % 1000000 === 0)
		{
			console.log(`  [stream] ${libPath.basename(pFilePath)}: ${(tmpLineCount / 1000000).toFixed(1)}M lines...`);
		}
	});

	tmpRL.on('close', () =>
	{
		console.log(`  [stream] ${libPath.basename(pFilePath)}: ${tmpLineCount.toLocaleString()} lines total.`);
		return fCallback(null, tmpLineCount);
	});

	tmpRL.on('error', (pError) =>
	{
		return fCallback(pError.message || pError);
	});
}


// ============================================================
// Filtered TSV Streaming (pre-filter with awk for backpressure)
// ============================================================
// For very large files (tens of millions of lines), Node.js readline
// creates excessive GC pressure even when filtering to a small subset.
// This function uses awk as a native pre-filter: only matching lines
// are piped into Node.js, keeping memory bounded.
//
// pFilterColumn: 0-based column index to filter on
// pFilterIds:    Set of string IDs that must match that column
function filteredStreamPlainTsv(pFilePath, pFilterColumn, pFilterIds, pColumnCallback, fCallback)
{
	if (!libFS.existsSync(pFilePath))
	{
		console.error(`  [filtered] File not found: ${pFilePath}`);
		return fCallback(`File not found: ${pFilePath}`);
	}

	if (pFilterIds.size === 0)
	{
		console.log(`  [filtered] Empty filter set — skipping ${libPath.basename(pFilePath)}`);
		return fCallback(null, 0);
	}

	// Write filter IDs to a temp file for awk
	let tmpIdFile = pFilePath + '.filter_ids.tmp';
	let tmpIdStream = libFS.createWriteStream(tmpIdFile);

	let tmpIdIterator = pFilterIds.values();
	let tmpWriteIds = () =>
	{
		let tmpDrain = true;
		while (tmpDrain)
		{
			let tmpNext = tmpIdIterator.next();
			if (tmpNext.done)
			{
				tmpIdStream.end();
				return;
			}
			tmpDrain = tmpIdStream.write(tmpNext.value + '\n');
		}
		tmpIdStream.once('drain', tmpWriteIds);
	};
	tmpWriteIds();

	tmpIdStream.on('finish', () =>
	{
		console.log(`  [filtered] Wrote ${pFilterIds.size.toLocaleString()} filter IDs to temp file`);
		console.log(`  [filtered] Spawning awk to pre-filter ${libPath.basename(pFilePath)} on column ${pFilterColumn}...`);

		// awk script: load IDs from file 1, then filter file 2 on column (1-indexed)
		let tmpAwkCol = `$${pFilterColumn + 1}`;
		let tmpAwkScript = `FNR==NR{ids[$1];next} ${tmpAwkCol} in ids`;

		let tmpProc = libChildProcess.spawn('awk',
			['-F', '\t', tmpAwkScript, tmpIdFile, pFilePath],
			{ stdio: ['ignore', 'pipe', 'pipe'] });

		let tmpRL = libReadline.createInterface(
		{
			input: tmpProc.stdout,
			crlfDelay: Infinity
		});

		let tmpMatchCount = 0;
		let tmpCallbackFired = false;

		tmpRL.on('line', (pLine) =>
		{
			tmpMatchCount++;
			let tmpCols = pLine.split('\t');
			pColumnCallback(tmpCols);

			if (tmpMatchCount % 100000 === 0)
			{
				console.log(`  [filtered] ${libPath.basename(pFilePath)}: ${tmpMatchCount.toLocaleString()} matching lines...`);
			}
		});

		tmpRL.on('close', () =>
		{
			if (tmpCallbackFired) return;
			tmpCallbackFired = true;
			console.log(`  [filtered] ${libPath.basename(pFilePath)}: ${tmpMatchCount.toLocaleString()} matching lines total.`);
			try { libFS.unlinkSync(tmpIdFile); } catch (e) { /* ignore */ }
			return fCallback(null, tmpMatchCount);
		});

		tmpProc.stderr.on('data', (pData) =>
		{
			console.error(`  [filtered] awk stderr: ${pData.toString().trim()}`);
		});

		tmpProc.on('error', (pError) =>
		{
			if (tmpCallbackFired) return;
			tmpCallbackFired = true;
			try { libFS.unlinkSync(tmpIdFile); } catch (e) { /* ignore */ }
			return fCallback(`awk spawn error: ${pError.message}`);
		});

		tmpProc.on('close', (pCode) =>
		{
			if (pCode !== 0 && !tmpCallbackFired)
			{
				tmpCallbackFired = true;
				try { libFS.unlinkSync(tmpIdFile); } catch (e) { /* ignore */ }
				return fCallback(`awk exited with code ${pCode}`);
			}
		});
	});

	tmpIdStream.on('error', (pError) =>
	{
		return fCallback(`Error writing filter IDs: ${pError.message}`);
	});
}


// ============================================================
// MusicBrainz Dump Extraction
// ============================================================
function extractMBTables(pTarPath, pOutputDir, pTableNames, fCallback)
{
	let tmpFileArgs = pTableNames.map((t) => `mbdump/${t}`);
	let tmpArgs = ['-xjf', pTarPath, '-C', pOutputDir].concat(tmpFileArgs);

	console.log(`  [extract] Extracting ${pTableNames.length} tables from MusicBrainz dump...`);
	console.log(`  [extract] This may take 10-15 minutes (decompressing 7GB bz2)...`);

	let tmpProc = libChildProcess.spawn('tar', tmpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

	tmpProc.stderr.on('data', () => { /* tar progress */ });

	tmpProc.on('close', (pCode) =>
	{
		if (pCode !== 0)
		{
			return fCallback(`tar extract exited with code ${pCode}`);
		}
		console.log(`  [extract] Done. Files extracted to ${pOutputDir}/mbdump/`);
		return fCallback(null);
	});

	tmpProc.on('error', (pError) =>
	{
		return fCallback(`tar spawn error: ${pError.message}`);
	});
}


// ============================================================
// Wikidata SPARQL Query
// ============================================================
function querySparql(pQuery, pRetries, fCallback)
{
	if (typeof pRetries === 'function')
	{
		fCallback = pRetries;
		pRetries = 3;
	}

	let tmpQueryEncoded = encodeURIComponent(pQuery);
	let tmpUrl = `${SPARQL_ENDPOINT}?format=json&query=${tmpQueryEncoded}`;

	console.log(`  [sparql] Querying Wikidata (${pQuery.length} chars)...`);

	libHTTPS.get(tmpUrl,
	{
		headers:
		{
			'User-Agent': SPARQL_USER_AGENT,
			'Accept': 'application/json'
		},
		timeout: 90000
	}, (pResponse) =>
	{
		if (pResponse.statusCode === 429 || pResponse.statusCode === 503)
		{
			pResponse.resume();
			if (pRetries > 0)
			{
				console.log(`  [sparql] Rate limited (${pResponse.statusCode}), retrying in 10s... (${pRetries} retries left)`);
				return setTimeout(() => querySparql(pQuery, pRetries - 1, fCallback), 10000);
			}
			return fCallback(`SPARQL rate limited after retries`);
		}

		if (pResponse.statusCode !== 200)
		{
			pResponse.resume();
			if (pRetries > 0)
			{
				console.log(`  [sparql] HTTP ${pResponse.statusCode}, retrying in 5s...`);
				return setTimeout(() => querySparql(pQuery, pRetries - 1, fCallback), 5000);
			}
			return fCallback(`SPARQL HTTP ${pResponse.statusCode}`);
		}

		let tmpData = '';
		pResponse.on('data', (pChunk) => { tmpData += pChunk; });
		pResponse.on('end', () =>
		{
			try
			{
				let tmpResult = JSON.parse(tmpData);
				let tmpBindings = tmpResult.results.bindings;
				let tmpRecords = [];

				for (let i = 0; i < tmpBindings.length; i++)
				{
					let tmpBinding = tmpBindings[i];
					let tmpRecord = {};
					for (let tmpKey in tmpBinding)
					{
						let tmpVal = tmpBinding[tmpKey];
						tmpRecord[tmpKey] = tmpVal.value || '';
						// Extract QID from URIs
						if (tmpVal.type === 'uri' && tmpVal.value.indexOf('wikidata.org/entity/') > -1)
						{
							tmpRecord[tmpKey + 'QID'] = extractQID(tmpVal.value);
						}
					}
					tmpRecords.push(tmpRecord);
				}

				console.log(`  [sparql] Got ${tmpRecords.length} results.`);
				return fCallback(null, tmpRecords);
			}
			catch (pParseError)
			{
				if (pRetries > 0)
				{
					console.log(`  [sparql] Parse error, retrying in 5s...`);
					return setTimeout(() => querySparql(pQuery, pRetries - 1, fCallback), 5000);
				}
				return fCallback(`SPARQL parse error: ${pParseError.message}`);
			}
		});
	}).on('error', (pError) =>
	{
		if (pRetries > 0)
		{
			console.log(`  [sparql] Network error, retrying in 5s...`);
			return setTimeout(() => querySparql(pQuery, pRetries - 1, fCallback), 5000);
		}
		return fCallback(`SPARQL network error: ${pError.message}`);
	}).on('timeout', () =>
	{
		if (pRetries > 0)
		{
			console.log(`  [sparql] Timeout, retrying in 5s...`);
			return setTimeout(() => querySparql(pQuery, pRetries - 1, fCallback), 5000);
		}
		return fCallback('SPARQL timeout after retries');
	});
}


// ============================================================
// API Functions
// ============================================================
function apiPost(pPath, pData, fCallback)
{
	let tmpBody = JSON.stringify(pData);
	let tmpOptions =
	{
		hostname: HARNESS_API_HOST,
		port: HARNESS_API_PORT,
		path: pPath,
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
			try { return fCallback(null, JSON.parse(tmpData)); }
			catch (pParseError) { return fCallback(null, tmpData); }
		});
	});
	tmpReq.on('error', (pError) => { return fCallback(pError.message); });
	tmpReq.write(tmpBody);
	tmpReq.end();
}

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
			try { return fCallback(null, JSON.parse(tmpData)); }
			catch (pParseError) { return fCallback(null, tmpData); }
		});
	});
	tmpReq.on('error', (pError) => { return fCallback(pError.message); });
	tmpReq.end();
}

function batchApiPost(pEntity, pRecords, fCallback)
{
	let tmpTotal = pRecords.length;
	if (tmpTotal < 1)
	{
		console.log(`  [push] 0 ${pEntity} records (nothing to push)`);
		return fCallback(null, { success: 0, errors: 0 });
	}

	// Backpressure governor: process records in chunks of POST_BATCH_SIZE.
	// Each chunk is fully completed before the next begins, keeping memory
	// bounded and preventing the API server from being overwhelmed.
	let tmpTotalChunks = Math.ceil(tmpTotal / POST_BATCH_SIZE);
	console.log(`  [push] Posting ${tmpTotal.toLocaleString()} ${pEntity} records (${tmpTotalChunks} chunks × ${POST_BATCH_SIZE}, concurrency: ${CONCURRENCY})...`);

	let tmpGlobalSuccess = 0;
	let tmpGlobalErrors = 0;
	let tmpChunkIndex = 0;

	let tmpProcessChunk = () =>
	{
		if (tmpChunkIndex >= tmpTotalChunks)
		{
			console.log(`  [push] ${pEntity}: ${tmpGlobalSuccess.toLocaleString()} success, ${tmpGlobalErrors} errors`);
			return fCallback(null, { success: tmpGlobalSuccess, errors: tmpGlobalErrors });
		}

		let tmpStart = tmpChunkIndex * POST_BATCH_SIZE;
		let tmpEnd = Math.min(tmpStart + POST_BATCH_SIZE, tmpTotal);
		let tmpChunkSize = tmpEnd - tmpStart;
		tmpChunkIndex++;

		let tmpIdx = tmpStart;
		let tmpChunkDone = 0;
		let tmpActive = 0;

		let tmpPostNext = () =>
		{
			while (tmpActive < CONCURRENCY && tmpIdx < tmpEnd)
			{
				let tmpRecord = pRecords[tmpIdx++];
				tmpActive++;

				apiPost(`/1.0/${pEntity}`, tmpRecord, (pError, pResult) =>
				{
					tmpActive--;
					if (pError || (pResult && pResult.Error))
					{
						tmpGlobalErrors++;
					}
					else
					{
						tmpGlobalSuccess++;
					}

					tmpChunkDone++;

					if (tmpChunkDone >= tmpChunkSize)
					{
						// Chunk complete — log progress and process next chunk
						if (tmpTotalChunks > 2 && tmpChunkIndex % Math.max(1, Math.floor(tmpTotalChunks / 10)) === 0)
						{
							let tmpPct = Math.round((tmpChunkIndex / tmpTotalChunks) * 100);
							console.log(`  [push] ${pEntity}: ${tmpPct}% (${tmpGlobalSuccess.toLocaleString()} success so far)`);
						}
						return tmpProcessChunk();
					}

					tmpPostNext();
				});
			}
		};

		tmpPostNext();
	};

	tmpProcessChunk();
}


// ============================================================
// Lookup Builders
// ============================================================
function fetchAllRecords(pEntityPlural, fCallback)
{
	let tmpAllRecords = [];
	let tmpPageSize = 500;

	let tmpFetchPage = (pBegin) =>
	{
		apiGet(`/1.0/${pEntityPlural}/${pBegin}/${tmpPageSize}`, (pError, pResponse) =>
		{
			if (pError) return fCallback(pError);
			if (!Array.isArray(pResponse)) return fCallback(null, tmpAllRecords);
			tmpAllRecords = tmpAllRecords.concat(pResponse);
			if (pResponse.length >= tmpPageSize) return tmpFetchPage(pBegin + tmpPageSize);
			return fCallback(null, tmpAllRecords);
		});
	};

	tmpFetchPage(0);
}

function buildExternalIDLookup(pEntityPlural, pIdField, pLookupObj, fCallback)
{
	fetchAllRecords(pEntityPlural, (pError, pRecords) =>
	{
		if (pError)
		{
			console.error(`  [lookup] Error fetching ${pEntityPlural}: ${pError}`);
			return fCallback(pError);
		}

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpRec = pRecords[i];
			if (tmpRec.ExternalID && tmpRec[pIdField])
			{
				pLookupObj[tmpRec.ExternalID] = tmpRec[pIdField];
			}
		}

		console.log(`  [lookup] Built ${pEntityPlural} lookup: ${Object.keys(pLookupObj).length} entries`);
		return fCallback(null);
	});
}

function buildGenreLookup(fCallback)
{
	fetchAllRecords('Genres', (pError, pRecords) =>
	{
		if (pError) return fCallback(pError);

		for (let i = 0; i < pRecords.length; i++)
		{
			if (pRecords[i].Name && pRecords[i].IDGenre)
			{
				GENRE_LOOKUP[pRecords[i].Name] = pRecords[i].IDGenre;
			}
		}

		console.log(`  [lookup] Built Genre lookup: ${Object.keys(GENRE_LOOKUP).length} entries`);
		return fCallback(null);
	});
}

function buildArtistLookups(fCallback)
{
	fetchAllRecords('Artists', (pError, pRecords) =>
	{
		if (pError) return fCallback(pError);

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpRec = pRecords[i];
			if (tmpRec.IDArtist)
			{
				if (tmpRec.ExternalID) ARTIST_LOOKUP[tmpRec.ExternalID] = tmpRec.IDArtist;
				if (tmpRec.Name) ARTIST_NAME_LOOKUP[tmpRec.Name.toLowerCase()] = tmpRec.IDArtist;
			}
		}

		console.log(`  [lookup] Built Artist lookups: ${Object.keys(ARTIST_LOOKUP).length} by ID, ${Object.keys(ARTIST_NAME_LOOKUP).length} by name`);
		return fCallback(null);
	});
}

function buildSongLookups(fCallback)
{
	fetchAllRecords('Songs', (pError, pRecords) =>
	{
		if (pError) return fCallback(pError);

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpRec = pRecords[i];
			if (tmpRec.IDSong)
			{
				if (tmpRec.ExternalID) SONG_LOOKUP[tmpRec.ExternalID] = tmpRec.IDSong;
				if (tmpRec.Title) SONG_TITLE_LOOKUP[tmpRec.Title.toLowerCase()] = tmpRec.IDSong;
			}
		}

		console.log(`  [lookup] Built Song lookups: ${Object.keys(SONG_LOOKUP).length} by ID, ${Object.keys(SONG_TITLE_LOOKUP).length} by title`);
		return fCallback(null);
	});
}

function buildVenueLookup(fCallback)
{
	fetchAllRecords('Venues', (pError, pRecords) =>
	{
		if (pError) return fCallback(pError);

		for (let i = 0; i < pRecords.length; i++)
		{
			let tmpRec = pRecords[i];
			if (tmpRec.IDVenue)
			{
				if (tmpRec.ExternalID) VENUE_LOOKUP[tmpRec.ExternalID] = tmpRec.IDVenue;
				// Also index by name for curated matching
				if (tmpRec.Name) VENUE_LOOKUP[tmpRec.Name.toLowerCase()] = tmpRec.IDVenue;
			}
		}

		console.log(`  [lookup] Built Venue lookup: ${Object.keys(VENUE_LOOKUP).length} entries`);
		return fCallback(null);
	});
}


// ============================================================
// Step Runner
// ============================================================
function runSteps(pSteps, fCallback)
{
	let tmpIndex = 0;
	let tmpStartTime = Date.now();

	let tmpNext = () =>
	{
		if (tmpIndex >= pSteps.length) return fCallback();
		let tmpStep = pSteps[tmpIndex];
		tmpIndex++;
		console.log(`\n${'='.repeat(60)}`);
		console.log(`Phase ${tmpIndex}/${pSteps.length}: ${tmpStep.name}`);
		console.log('='.repeat(60));
		let tmpPhaseStart = Date.now();
		tmpStep.fn((pError) =>
		{
			if (pError) console.error(`  [ERROR] Phase failed: ${pError}`);
			let tmpElapsed = ((Date.now() - tmpPhaseStart) / 1000).toFixed(1);
			console.log(`  Phase ${tmpIndex} completed in ${tmpElapsed}s`);
			tmpNext();
		});
	};

	tmpNext();
}


// ============================================================
// Phase 1: Download IMDb Files
// ============================================================
function phase1DownloadIMDb(fCallback)
{
	ensureDir(DOWNLOAD_DIR);
	console.log(`  Download directory: ${DOWNLOAD_DIR}`);

	downloadFileSequential(
	[
		IMDB_FILES.ratings,
		IMDB_FILES.basics,
		IMDB_FILES.principals,
		IMDB_FILES.names
	], fCallback);
}


// ============================================================
// Phase 2: Parse IMDb Data (multi-pass)
// ============================================================
function phase2ParseIMDb(fCallback)
{
	// Step 1: Parse ratings to build qualifying movie set
	console.log(`\n  --- Step 2a: Parse ratings (filter: numVotes > ${MIN_VOTES}) ---`);
	streamGzippedTsv(libPath.join(DOWNLOAD_DIR, IMDB_FILES.ratings.filename), (pRecord) =>
	{
		let tmpVotes = cleanIMDbNum(pRecord.numVotes);
		if (tmpVotes >= MIN_VOTES)
		{
			QUALIFYING_MOVIES.add(pRecord.tconst);
			RATINGS_DATA[pRecord.tconst] =
			{
				averageRating: cleanIMDbFloat(pRecord.averageRating),
				numVotes: tmpVotes
			};
		}
	}, (pError) =>
	{
		if (pError) return fCallback(pError);
		console.log(`  Qualifying movies (numVotes >= ${MIN_VOTES}): ${QUALIFYING_MOVIES.size.toLocaleString()}`);

		// Step 2: Parse title.basics for movies
		console.log(`\n  --- Step 2b: Parse title.basics (filter: movie + qualifying) ---`);
		streamGzippedTsv(libPath.join(DOWNLOAD_DIR, IMDB_FILES.basics.filename), (pRecord) =>
		{
			if (pRecord.titleType !== 'movie') return;
			if (!QUALIFYING_MOVIES.has(pRecord.tconst)) return;

			MOVIE_RECORDS.push(
			{
				Title: cleanIMDb(pRecord.primaryTitle),
				OriginalTitle: cleanIMDb(pRecord.originalTitle),
				ExternalID: pRecord.tconst,
				IsAdult: cleanIMDbNum(pRecord.isAdult),
				StartYear: cleanIMDbNum(pRecord.startYear),
				EndYear: cleanIMDbNum(pRecord.endYear),
				RuntimeMinutes: cleanIMDbNum(pRecord.runtimeMinutes),
				GenreList: cleanIMDb(pRecord.genres),
				IDDataSource: DS_IMDB_TITLE_BASICS
			});

			// Extract genres
			let tmpGenres = cleanIMDb(pRecord.genres);
			if (tmpGenres)
			{
				let tmpGenreList = tmpGenres.split(',');
				for (let g = 0; g < tmpGenreList.length; g++)
				{
					let tmpGenre = tmpGenreList[g].trim();
					if (tmpGenre)
					{
						GENRE_SET.add(tmpGenre);
						MOVIE_GENRE_PAIRS.push({ tconst: pRecord.tconst, genre: tmpGenre });
					}
				}
			}
		}, (pError2) =>
		{
			if (pError2) return fCallback(pError2);
			console.log(`  Movies collected: ${MOVIE_RECORDS.length.toLocaleString()}`);
			console.log(`  Genres found: ${GENRE_SET.size}`);
			console.log(`  MovieGenre pairs: ${MOVIE_GENRE_PAIRS.length.toLocaleString()}`);

			// Update QUALIFYING_MOVIES to only movies we actually found in basics
			// (ratings may include TV shows, etc.)
			let tmpMovieTconsts = new Set(MOVIE_RECORDS.map(m => m.ExternalID));

			// Step 3: Parse title.principals for credits
			console.log(`\n  --- Step 2c: Parse title.principals (filter: qualifying movies) ---`);
			streamGzippedTsv(libPath.join(DOWNLOAD_DIR, IMDB_FILES.principals.filename), (pRecord) =>
			{
				if (!tmpMovieTconsts.has(pRecord.tconst)) return;

				QUALIFYING_PEOPLE.add(pRecord.nconst);

				CREDIT_RECORDS.push(
				{
					Ordering: cleanIMDbNum(pRecord.ordering),
					Category: cleanIMDb(pRecord.category),
					Job: cleanIMDb(pRecord.job),
					Characters: cleanIMDb(pRecord.characters),
					_tconst: pRecord.tconst,
					_nconst: pRecord.nconst,
					IDDataSource: DS_IMDB_TITLE_PRINCIPALS
				});
			}, (pError3) =>
			{
				if (pError3) return fCallback(pError3);
				console.log(`  Credits collected: ${CREDIT_RECORDS.length.toLocaleString()}`);
				console.log(`  Unique people referenced: ${QUALIFYING_PEOPLE.size.toLocaleString()}`);

				// Step 4: Parse name.basics for people
				console.log(`\n  --- Step 2d: Parse name.basics (filter: qualifying people) ---`);
				streamGzippedTsv(libPath.join(DOWNLOAD_DIR, IMDB_FILES.names.filename), (pRecord) =>
				{
					if (!QUALIFYING_PEOPLE.has(pRecord.nconst)) return;

					PERSON_RECORDS.push(
					{
						Name: cleanIMDb(pRecord.primaryName),
						ExternalID: pRecord.nconst,
						BirthYear: cleanIMDbNum(pRecord.birthYear),
						DeathYear: cleanIMDbNum(pRecord.deathYear),
						PrimaryProfessions: cleanIMDb(pRecord.primaryProfession),
						KnownForTitles: cleanIMDb(pRecord.knownForTitles),
						IDDataSource: DS_IMDB_NAME_BASICS
					});
				}, (pError4) =>
				{
					if (pError4) return fCallback(pError4);
					console.log(`  People collected: ${PERSON_RECORDS.length.toLocaleString()}`);
					return fCallback(null);
				});
			});
		});
	});
}


// ============================================================
// Phase 3: POST IMDb Entities with FK Resolution
// ============================================================
function phase3PostIMDb(fCallback)
{
	// Step 3a: POST Genres
	console.log(`\n  --- Step 3a: POST Genres ---`);
	let tmpGenreRecords = [];
	GENRE_SET.forEach((pGenre) =>
	{
		tmpGenreRecords.push(
		{
			Name: pGenre,
			Category: 'movie',
			IDDataSource: DS_IMDB_TITLE_BASICS
		});
	});

	batchApiPost('Genre', tmpGenreRecords, (pError) =>
	{
		if (pError) console.error(`  Genre POST error: ${pError}`);

		// Build genre lookup
		buildGenreLookup((pError2) =>
		{
			if (pError2) console.error(`  Genre lookup error: ${pError2}`);

			// Step 3b: POST Movies
			console.log(`\n  --- Step 3b: POST Movies ---`);
			batchApiPost('Movie', MOVIE_RECORDS, (pError3) =>
			{
				if (pError3) console.error(`  Movie POST error: ${pError3}`);

				// Build movie lookup
				buildExternalIDLookup('Movies', 'IDMovie', MOVIE_LOOKUP, (pError4) =>
				{
					if (pError4) console.error(`  Movie lookup error: ${pError4}`);

					// Step 3c: POST People
					console.log(`\n  --- Step 3c: POST People ---`);
					batchApiPost('Person', PERSON_RECORDS, (pError5) =>
					{
						if (pError5) console.error(`  Person POST error: ${pError5}`);

						// Build person lookup
						buildExternalIDLookup('Persons', 'IDPerson', PERSON_LOOKUP, (pError6) =>
						{
							if (pError6) console.error(`  Person lookup error: ${pError6}`);

							// Step 3d: POST MovieGenre junctions
							console.log(`\n  --- Step 3d: POST MovieGenre junctions ---`);
							let tmpMGRecords = [];
							for (let i = 0; i < MOVIE_GENRE_PAIRS.length; i++)
							{
								let tmpPair = MOVIE_GENRE_PAIRS[i];
								let tmpIDMovie = MOVIE_LOOKUP[tmpPair.tconst];
								let tmpIDGenre = GENRE_LOOKUP[tmpPair.genre];
								if (tmpIDMovie && tmpIDGenre)
								{
									tmpMGRecords.push({ IDMovie: tmpIDMovie, IDGenre: tmpIDGenre });
								}
							}

							batchApiPost('MovieGenre', tmpMGRecords, (pError7) =>
							{
								if (pError7) console.error(`  MovieGenre POST error: ${pError7}`);

								// Step 3e: POST MovieCredits
								console.log(`\n  --- Step 3e: POST MovieCredits ---`);
								let tmpCreditRecordsResolved = [];
								for (let i = 0; i < CREDIT_RECORDS.length; i++)
								{
									let tmpCredit = CREDIT_RECORDS[i];
									let tmpIDMovie = MOVIE_LOOKUP[tmpCredit._tconst];
									let tmpIDPerson = PERSON_LOOKUP[tmpCredit._nconst];
									if (tmpIDMovie && tmpIDPerson)
									{
										tmpCreditRecordsResolved.push(
										{
											Ordering: tmpCredit.Ordering,
											Category: tmpCredit.Category,
											Job: tmpCredit.Job,
											Characters: tmpCredit.Characters,
											IDMovie: tmpIDMovie,
											IDPerson: tmpIDPerson,
											IDDataSource: tmpCredit.IDDataSource
										});
									}
								}

								batchApiPost('MovieCredit', tmpCreditRecordsResolved, (pError8) =>
								{
									if (pError8) console.error(`  MovieCredit POST error: ${pError8}`);

									// Step 3f: POST MovieRatings
									console.log(`\n  --- Step 3f: POST MovieRatings ---`);
									let tmpRatingRecords = [];
									for (let tmpTconst in RATINGS_DATA)
									{
										let tmpIDMovie = MOVIE_LOOKUP[tmpTconst];
										if (tmpIDMovie)
										{
											tmpRatingRecords.push(
											{
												AverageRating: RATINGS_DATA[tmpTconst].averageRating,
												NumVotes: RATINGS_DATA[tmpTconst].numVotes,
												IDMovie: tmpIDMovie,
												IDDataSource: DS_IMDB_TITLE_RATINGS
											});
										}
									}

									batchApiPost('MovieRating', tmpRatingRecords, (pError9) =>
									{
										if (pError9) console.error(`  MovieRating POST error: ${pError9}`);

										// Free memory
										MOVIE_RECORDS.length = 0;
										CREDIT_RECORDS.length = 0;
										PERSON_RECORDS.length = 0;
										MOVIE_GENRE_PAIRS.length = 0;

										return fCallback(null);
									});
								});
							});
						});
					});
				});
			});
		});
	});
}


// ============================================================
// Phase 4: Wikidata Musicians → Artists
// ============================================================
function phase4WikidataMusicians(fCallback)
{
	console.log(`\n  --- Step 4a: Query Wikidata for solo musicians ---`);
	querySparql(SPARQL_MUSICIANS, (pError, pMusicians) =>
	{
		if (pError)
		{
			console.error(`  WARNING: Wikidata musicians query failed: ${pError}`);
			pMusicians = [];
		}

		// Deduplicate by QID
		let tmpSeen = new Set();
		let tmpArtistRecords = [];

		for (let i = 0; i < pMusicians.length; i++)
		{
			let tmpRec = pMusicians[i];
			let tmpQID = tmpRec.artistQID;
			if (!tmpQID || tmpSeen.has(tmpQID)) continue;
			tmpSeen.add(tmpQID);

			tmpArtistRecords.push(
			{
				Name: tmpRec.artistLabel || tmpQID,
				ExternalID: tmpQID,
				ArtistType: 'person',
				BeginYear: cleanIMDbNum(tmpRec.birthYear),
				EndYear: cleanIMDbNum(tmpRec.deathYear),
				Country: tmpRec.countryLabel || '',
				IDDataSource: DS_WIKIDATA_MUSICIANS
			});
		}

		console.log(`  Solo musicians (deduped): ${tmpArtistRecords.length}`);

		// Wait 2s before next SPARQL query
		setTimeout(() =>
		{
			console.log(`\n  --- Step 4b: Query Wikidata for bands ---`);
			querySparql(SPARQL_BANDS, (pError2, pBands) =>
			{
				if (pError2)
				{
					console.error(`  WARNING: Wikidata bands query failed: ${pError2}`);
					pBands = [];
				}

				for (let i = 0; i < pBands.length; i++)
				{
					let tmpRec = pBands[i];
					let tmpQID = tmpRec.artistQID;
					if (!tmpQID || tmpSeen.has(tmpQID)) continue;
					tmpSeen.add(tmpQID);

					tmpArtistRecords.push(
					{
						Name: tmpRec.artistLabel || tmpQID,
						ExternalID: tmpQID,
						ArtistType: 'group',
						BeginYear: cleanIMDbNum(tmpRec.startYear),
						EndYear: cleanIMDbNum(tmpRec.endYear),
						Country: tmpRec.countryLabel || '',
						IDDataSource: DS_WIKIDATA_MUSICIANS
					});
				}

				console.log(`  Total artists (musicians + bands): ${tmpArtistRecords.length}`);

				batchApiPost('Artist', tmpArtistRecords, (pError3) =>
				{
					if (pError3) console.error(`  Artist POST error: ${pError3}`);

					buildArtistLookups((pError4) =>
					{
						if (pError4) console.error(`  Artist lookup error: ${pError4}`);
						return fCallback(null);
					});
				});
			});
		}, 2000);
	});
}


// ============================================================
// Phase 5: Wikidata Albums and Songs
// ============================================================
function phase5WikidataAlbumsAndSongs(fCallback)
{
	console.log(`\n  --- Step 5a: Query Wikidata for albums ---`);
	querySparql(SPARQL_ALBUMS, (pError, pAlbums) =>
	{
		if (pError)
		{
			console.error(`  WARNING: Wikidata albums query failed: ${pError}`);
			pAlbums = [];
		}

		// Deduplicate by album QID
		let tmpAlbumSeen = new Set();
		let tmpAlbumRecords = [];

		for (let i = 0; i < pAlbums.length; i++)
		{
			let tmpRec = pAlbums[i];
			let tmpAlbumQID = tmpRec.albumQID;
			if (!tmpAlbumQID || tmpAlbumSeen.has(tmpAlbumQID)) continue;
			tmpAlbumSeen.add(tmpAlbumQID);

			let tmpArtistQID = tmpRec.artistQID;
			let tmpIDArtist = ARTIST_LOOKUP[tmpArtistQID] || 0;

			tmpAlbumRecords.push(
			{
				Title: tmpRec.albumLabel || tmpAlbumQID,
				ExternalID: tmpAlbumQID,
				AlbumType: 'studio',
				ReleaseYear: cleanIMDbNum(tmpRec.year),
				IDArtist: tmpIDArtist,
				IDDataSource: DS_WIKIDATA_ALBUMS
			});
		}

		console.log(`  Albums (deduped): ${tmpAlbumRecords.length}`);

		batchApiPost('Album', tmpAlbumRecords, (pError2) =>
		{
			if (pError2) console.error(`  Album POST error: ${pError2}`);

			// Build album lookup
			fetchAllRecords('Albums', (pError3, pAlbumRecs) =>
			{
				if (!pError3 && pAlbumRecs)
				{
					for (let i = 0; i < pAlbumRecs.length; i++)
					{
						if (pAlbumRecs[i].ExternalID && pAlbumRecs[i].IDAlbum)
						{
							ALBUM_LOOKUP[pAlbumRecs[i].ExternalID] = pAlbumRecs[i].IDAlbum;
						}
					}
					console.log(`  [lookup] Built Album lookup: ${Object.keys(ALBUM_LOOKUP).length} entries`);
				}

				// Wait 2s, then query songs
				setTimeout(() =>
				{
					console.log(`\n  --- Step 5b: Query Wikidata for songs ---`);
					querySparql(SPARQL_SONGS, (pError4, pSongs) =>
					{
						if (pError4)
						{
							console.error(`  WARNING: Wikidata songs query failed: ${pError4}`);
							pSongs = [];
						}

						let tmpSongSeen = new Set();
						let tmpSongRecords = [];

						for (let i = 0; i < pSongs.length; i++)
						{
							let tmpRec = pSongs[i];
							let tmpSongQID = tmpRec.songQID;
							if (!tmpSongQID || tmpSongSeen.has(tmpSongQID)) continue;
							tmpSongSeen.add(tmpSongQID);

							let tmpArtistQID = tmpRec.artistQID;
							let tmpIDArtist = ARTIST_LOOKUP[tmpArtistQID] || 0;

							tmpSongRecords.push(
							{
								Title: tmpRec.songLabel || tmpSongQID,
								ExternalID: tmpSongQID,
								ReleaseYear: cleanIMDbNum(tmpRec.year),
								IDArtist: tmpIDArtist,
								IDDataSource: DS_WIKIDATA_ALBUMS
							});
						}

						console.log(`  Songs (deduped): ${tmpSongRecords.length}`);

						batchApiPost('Song', tmpSongRecords, (pError5) =>
						{
							if (pError5) console.error(`  Song POST error: ${pError5}`);

							buildSongLookups((pError6) =>
							{
								if (pError6) console.error(`  Song lookup error: ${pError6}`);
								return fCallback(null);
							});
						});
					});
				}, 2000);
			});
		});
	});
}


// ============================================================
// Phase 6: Wikidata Venues
// ============================================================
function phase6WikidataVenues(fCallback)
{
	console.log(`\n  --- Step 6: Query Wikidata for music venues ---`);
	querySparql(SPARQL_VENUES, (pError, pVenues) =>
	{
		if (pError)
		{
			console.error(`  WARNING: Wikidata venues query failed: ${pError}`);
			pVenues = [];
		}

		let tmpVenueSeen = new Set();
		let tmpVenueRecords = [];

		for (let i = 0; i < pVenues.length; i++)
		{
			let tmpRec = pVenues[i];
			let tmpQID = tmpRec.venueQID;
			if (!tmpQID || tmpVenueSeen.has(tmpQID)) continue;
			tmpVenueSeen.add(tmpQID);

			tmpVenueRecords.push(
			{
				Name: tmpRec.venueLabel || tmpQID,
				City: tmpRec.cityLabel || '',
				Country: tmpRec.countryLabel || '',
				Capacity: cleanIMDbNum(tmpRec.capacity),
				ExternalID: tmpQID,
				IDDataSource: DS_WIKIDATA_MUSICIANS
			});
		}

		console.log(`  Venues from Wikidata (deduped): ${tmpVenueRecords.length}`);

		batchApiPost('Venue', tmpVenueRecords, (pError2) =>
		{
			if (pError2) console.error(`  Venue POST error: ${pError2}`);

			buildVenueLookup((pError3) =>
			{
				if (pError3) console.error(`  Venue lookup error: ${pError3}`);
				return fCallback(null);
			});
		});
	});
}


// ============================================================
// Phase 7: Curated Soundtracks
// ============================================================
function phase7CuratedSoundtracks(fCallback)
{
	let tmpSoundtrackPath = libPath.join(CURATED_DIR, 'soundtracks.json');
	if (!libFS.existsSync(tmpSoundtrackPath))
	{
		console.log(`  No soundtracks.json found, skipping.`);
		return fCallback(null);
	}

	console.log(`  --- Step 7a: Load curated soundtracks ---`);
	let tmpSoundtrackData = JSON.parse(libFS.readFileSync(tmpSoundtrackPath, 'utf8'));
	console.log(`  Loaded ${tmpSoundtrackData.length} movies with soundtrack data.`);

	// First, create Song records for all soundtrack songs
	let tmpSongRecords = [];
	let tmpSongIndex = {}; // track which songs we're creating (by title+artist key)

	for (let i = 0; i < tmpSoundtrackData.length; i++)
	{
		let tmpMovie = tmpSoundtrackData[i];
		for (let j = 0; j < tmpMovie.songs.length; j++)
		{
			let tmpSong = tmpMovie.songs[j];
			let tmpKey = `${tmpSong.title}||${tmpSong.artist}`.toLowerCase();

			if (!tmpSongIndex[tmpKey])
			{
				// Check if this song already exists (from Wikidata)
				let tmpExistingID = SONG_TITLE_LOOKUP[tmpSong.title.toLowerCase()];
				if (tmpExistingID)
				{
					tmpSongIndex[tmpKey] = tmpExistingID;
				}
				else
				{
					tmpSongIndex[tmpKey] = 'pending';
					let tmpIDArtist = ARTIST_NAME_LOOKUP[tmpSong.artist.toLowerCase()] || 0;

					tmpSongRecords.push(
					{
						Title: tmpSong.title,
						ExternalID: `curated-song-${tmpKey.replace(/[^a-z0-9]/g, '-')}`,
						IDArtist: tmpIDArtist,
						IDDataSource: DS_CURATED_SOUNDTRACKS
					});
				}
			}
		}
	}

	console.log(`  New songs to create: ${tmpSongRecords.length}`);

	batchApiPost('Song', tmpSongRecords, (pError) =>
	{
		if (pError) console.error(`  Soundtrack Song POST error: ${pError}`);

		// Rebuild song lookups to include new songs
		buildSongLookups((pError2) =>
		{
			if (pError2) console.error(`  Song lookup rebuild error: ${pError2}`);

			// Now create Soundtrack junction records
			console.log(`\n  --- Step 7b: POST Soundtrack junctions ---`);
			let tmpSoundtrackRecords = [];

			for (let i = 0; i < tmpSoundtrackData.length; i++)
			{
				let tmpMovie = tmpSoundtrackData[i];
				let tmpIDMovie = MOVIE_LOOKUP[tmpMovie.movieIMDbID] || 0;

				for (let j = 0; j < tmpMovie.songs.length; j++)
				{
					let tmpSong = tmpMovie.songs[j];
					let tmpIDSong = SONG_TITLE_LOOKUP[tmpSong.title.toLowerCase()] || 0;

					tmpSoundtrackRecords.push(
					{
						Role: tmpSong.role || '',
						Composer: tmpSong.composer || '',
						IDMovie: tmpIDMovie,
						IDSong: tmpIDSong,
						IDDataSource: DS_CURATED_SOUNDTRACKS
					});
				}
			}

			console.log(`  Soundtrack junctions to create: ${tmpSoundtrackRecords.length}`);
			let tmpLinked = tmpSoundtrackRecords.filter(r => r.IDMovie > 0 && r.IDSong > 0).length;
			console.log(`  Fully linked (movie+song resolved): ${tmpLinked}`);

			batchApiPost('Soundtrack', tmpSoundtrackRecords, (pError3) =>
			{
				if (pError3) console.error(`  Soundtrack POST error: ${pError3}`);
				return fCallback(null);
			});
		});
	});
}


// ============================================================
// Phase 8: Curated Concerts and Setlists
// ============================================================
function phase8CuratedConcerts(fCallback)
{
	let tmpConcertPath = libPath.join(CURATED_DIR, 'concerts.json');
	if (!libFS.existsSync(tmpConcertPath))
	{
		console.log(`  No concerts.json found, skipping.`);
		return fCallback(null);
	}

	console.log(`  --- Step 8a: Load curated concerts ---`);
	let tmpConcertData = JSON.parse(libFS.readFileSync(tmpConcertPath, 'utf8'));
	console.log(`  Loaded ${tmpConcertData.venues.length} venues, ${tmpConcertData.concerts.length} concerts.`);

	// Step 8a: Create curated venues (skip if already exists by name)
	let tmpVenueRecords = [];
	let tmpCuratedVenueMap = {}; // curated id → venue record

	for (let i = 0; i < tmpConcertData.venues.length; i++)
	{
		let tmpVenue = tmpConcertData.venues[i];
		let tmpExisting = VENUE_LOOKUP[tmpVenue.name.toLowerCase()];

		if (!tmpExisting)
		{
			tmpVenueRecords.push(
			{
				Name: tmpVenue.name,
				City: tmpVenue.city || '',
				State: tmpVenue.state || '',
				Country: tmpVenue.country || '',
				Latitude: tmpVenue.latitude || 0,
				Longitude: tmpVenue.longitude || 0,
				Capacity: tmpVenue.capacity || 0,
				ExternalID: tmpVenue.id,
				IDDataSource: DS_CURATED_CONCERTS
			});
		}
		tmpCuratedVenueMap[tmpVenue.id] = tmpVenue;
	}

	console.log(`  New venues to create: ${tmpVenueRecords.length}`);

	batchApiPost('Venue', tmpVenueRecords, (pError) =>
	{
		if (pError) console.error(`  Venue POST error: ${pError}`);

		// Rebuild venue lookup
		buildVenueLookup((pError2) =>
		{
			if (pError2) console.error(`  Venue lookup rebuild error: ${pError2}`);

			// Step 8b: Create artists that appear in concerts but don't exist yet
			console.log(`\n  --- Step 8b: Create missing concert artists ---`);
			let tmpNewArtistRecords = [];
			let tmpNewArtistNames = new Set();

			for (let i = 0; i < tmpConcertData.concerts.length; i++)
			{
				let tmpConcert = tmpConcertData.concerts[i];
				let tmpArtistName = tmpConcert.artistName;

				if (tmpArtistName && !ARTIST_NAME_LOOKUP[tmpArtistName.toLowerCase()] && !tmpNewArtistNames.has(tmpArtistName.toLowerCase()))
				{
					tmpNewArtistNames.add(tmpArtistName.toLowerCase());
					tmpNewArtistRecords.push(
					{
						Name: tmpArtistName,
						ExternalID: `curated-artist-${tmpArtistName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
						ArtistType: 'person',
						IDDataSource: DS_CURATED_CONCERTS
					});
				}
			}

			console.log(`  New artists from concerts: ${tmpNewArtistRecords.length}`);

			batchApiPost('Artist', tmpNewArtistRecords, (pError3) =>
			{
				if (pError3) console.error(`  Concert Artist POST error: ${pError3}`);

				// Rebuild artist lookups
				buildArtistLookups((pError4) =>
				{
					if (pError4) console.error(`  Artist lookup rebuild error: ${pError4}`);

					// Step 8c: Create concert records
					console.log(`\n  --- Step 8c: POST Concerts ---`);
					let tmpConcertRecords = [];

					for (let i = 0; i < tmpConcertData.concerts.length; i++)
					{
						let tmpConcert = tmpConcertData.concerts[i];

						// Resolve artist
						let tmpIDArtist = ARTIST_NAME_LOOKUP[tmpConcert.artistName.toLowerCase()] || 0;

						// Resolve venue
						let tmpVenueInfo = tmpCuratedVenueMap[tmpConcert.venueId];
						let tmpIDVenue = 0;
						if (tmpVenueInfo)
						{
							tmpIDVenue = VENUE_LOOKUP[tmpVenueInfo.name.toLowerCase()] || VENUE_LOOKUP[tmpConcert.venueId] || 0;
						}

						tmpConcertRecords.push(
						{
							Name: tmpConcert.name,
							EventDate: tmpConcert.date || '',
							TourName: tmpConcert.tourName || '',
							IDArtist: tmpIDArtist,
							IDVenue: tmpIDVenue,
							IDDataSource: DS_CURATED_CONCERTS
						});
					}

					batchApiPost('Concert', tmpConcertRecords, (pError5) =>
					{
						if (pError5) console.error(`  Concert POST error: ${pError5}`);

						// Build concert lookup by Name
						fetchAllRecords('Concerts', (pError6, pConcertRecs) =>
						{
							if (!pError6 && pConcertRecs)
							{
								for (let i = 0; i < pConcertRecs.length; i++)
								{
									if (pConcertRecs[i].Name && pConcertRecs[i].IDConcert)
									{
										CONCERT_LOOKUP[pConcertRecs[i].Name] = pConcertRecs[i].IDConcert;
									}
								}
								console.log(`  [lookup] Built Concert lookup: ${Object.keys(CONCERT_LOOKUP).length} entries`);
							}

							// Rebuild song lookups (to include curated soundtrack songs)
							buildSongLookups((pError7) =>
							{
								if (pError7) console.error(`  Song lookup rebuild error: ${pError7}`);

								// Step 8d: Create setlist entries
								console.log(`\n  --- Step 8d: POST SetlistEntries ---`);
								let tmpSetlistRecords = [];
								let tmpNewSongsNeeded = [];
								let tmpNewSongKeys = new Set();

								// First pass: identify songs we need to create
								for (let i = 0; i < tmpConcertData.concerts.length; i++)
								{
									let tmpConcert = tmpConcertData.concerts[i];
									if (!tmpConcert.setlist) continue;

									for (let j = 0; j < tmpConcert.setlist.length; j++)
									{
										let tmpEntry = tmpConcert.setlist[j];
										let tmpSongTitle = tmpEntry.songTitle;
										if (tmpSongTitle && !SONG_TITLE_LOOKUP[tmpSongTitle.toLowerCase()] && !tmpNewSongKeys.has(tmpSongTitle.toLowerCase()))
										{
											tmpNewSongKeys.add(tmpSongTitle.toLowerCase());
											let tmpIDArtist = ARTIST_NAME_LOOKUP[tmpConcert.artistName.toLowerCase()] || 0;
											tmpNewSongsNeeded.push(
											{
												Title: tmpSongTitle,
												ExternalID: `curated-setlist-song-${tmpSongTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
												IDArtist: tmpIDArtist,
												IDDataSource: DS_CURATED_CONCERTS
											});
										}
									}
								}

								if (tmpNewSongsNeeded.length > 0)
								{
									console.log(`  Creating ${tmpNewSongsNeeded.length} missing setlist songs...`);
								}

								batchApiPost('Song', tmpNewSongsNeeded, (pError8) =>
								{
									if (pError8) console.error(`  Setlist Song POST error: ${pError8}`);

									// Final rebuild of song lookups
									buildSongLookups((pError9) =>
									{
										if (pError9) console.error(`  Song lookup final rebuild error: ${pError9}`);

										// Now create setlist entries
										for (let i = 0; i < tmpConcertData.concerts.length; i++)
										{
											let tmpConcert = tmpConcertData.concerts[i];
											let tmpIDConcert = CONCERT_LOOKUP[tmpConcert.name] || 0;
											if (!tmpConcert.setlist) continue;

											for (let j = 0; j < tmpConcert.setlist.length; j++)
											{
												let tmpEntry = tmpConcert.setlist[j];
												let tmpIDSong = SONG_TITLE_LOOKUP[tmpEntry.songTitle.toLowerCase()] || 0;

												tmpSetlistRecords.push(
												{
													Position: tmpEntry.position || (j + 1),
													IsEncore: tmpEntry.isEncore ? 1 : 0,
													Info: tmpEntry.info || '',
													IDConcert: tmpIDConcert,
													IDSong: tmpIDSong,
													IDDataSource: DS_CURATED_CONCERTS
												});
											}
										}

										console.log(`  SetlistEntry records: ${tmpSetlistRecords.length}`);
										let tmpLinked = tmpSetlistRecords.filter(r => r.IDConcert > 0 && r.IDSong > 0).length;
										console.log(`  Fully linked (concert+song): ${tmpLinked}`);

										batchApiPost('SetlistEntry', tmpSetlistRecords, (pError10) =>
										{
											if (pError10) console.error(`  SetlistEntry POST error: ${pError10}`);
											return fCallback(null);
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
}


// ============================================================
// Phase 9: Download and Extract MusicBrainz Database Dump
// ============================================================
function phase9DownloadMusicBrainz(fCallback)
{
	ensureDir(DOWNLOAD_DIR);
	ensureDir(MB_EXTRACT_DIR);

	let tmpTarPath = libPath.join(DOWNLOAD_DIR, 'mbdump.tar.bz2');

	console.log(`  MusicBrainz dump: ${tmpTarPath}`);
	console.log(`  Extract directory: ${MB_EXTRACT_DIR}`);

	// Download the dump (7GB, cached locally)
	downloadFile(MB_DUMP_URL, tmpTarPath, (pError) =>
	{
		if (pError)
		{
			console.error(`  ERROR downloading MusicBrainz dump: ${pError}`);
			return fCallback(pError);
		}

		// Check if already extracted
		let tmpCheckFile = libPath.join(MB_EXTRACT_DIR, 'mbdump', 'artist');
		if (libFS.existsSync(tmpCheckFile))
		{
			console.log(`  [extract] Using cached extraction: ${MB_EXTRACT_DIR}/mbdump/`);
			return fCallback(null);
		}

		// Extract needed tables
		extractMBTables(tmpTarPath, MB_EXTRACT_DIR, MB_TABLES, fCallback);
	});
}


// ============================================================
// Phase 10: Parse and POST MusicBrainz Data
// ============================================================
function phase10ParseAndPostMusicBrainz(fCallback)
{
	let tmpMBDir = libPath.join(MB_EXTRACT_DIR, 'mbdump');

	// MusicBrainz parsing data stores
	let tmpArtistTypeMap = {};        // MB artist_type.id → name
	let tmpRGTypeMap = {};            // MB release_group_primary_type.id → name
	let tmpAreaMap = {};              // MB area.id → name
	let tmpAlbumTypeId = null;        // The MB type ID for "Album"
	let tmpCreditToArtist = {};       // MB artist_credit_id → artist_id
	let tmpArtistAlbumCount = {};     // MB artist_id → album count
	let tmpAlbumsByArtist = {};       // MB artist_id → [{rg_id, gid, name}]
	let tmpFinalArtistIds = new Set();
	let tmpFinalAlbums = [];          // [{rg_id, gid, name, mb_artist_id}]
	let tmpFinalAlbumRGIds = new Set();
	let tmpArtistDataMB = {};         // MB artist_id → {gid, name, sort_name, ...}
	let tmpRGIdToGid = {};            // rg_id → gid (for album lookup resolution)
	let tmpRGToArtistId = {};         // rg_id → mb_artist_id
	let tmpReleaseToRG = {};          // MB release_id → rg_id
	let tmpReleaseIds = new Set();
	let tmpMediumToRG = {};           // MB medium_id → {rg_id, disc_number}
	let tmpMediumIds = new Set();
	let tmpTrackDataMB = [];          // [{recording_id, rg_id, position, disc_number}]
	let tmpRecordingIds = new Set();
	let tmpRecordingDataMB = {};      // MB recording_id → {gid, name, length}

	// MB-specific lookup tables (MB gid → API ID)
	let tmpMBAlbumLookup = {};        // MB album gid → IDAlbum
	let tmpMBSongLookup = {};         // MB recording gid → IDSong

	// -------------------------------------------------------
	// Step 10a: Parse small lookup tables
	// -------------------------------------------------------
	console.log(`\n  --- Step 10a: Parse lookup tables (artist_type, release_group_primary_type, area) ---`);

	streamPlainTsv(libPath.join(tmpMBDir, 'artist_type'), (pCols) =>
	{
		tmpArtistTypeMap[pCols[0]] = cleanIMDb(pCols[1]);
	}, (pError) =>
	{
		if (pError) return fCallback(pError);
		console.log(`  Artist types: ${JSON.stringify(tmpArtistTypeMap)}`);

		streamPlainTsv(libPath.join(tmpMBDir, 'release_group_primary_type'), (pCols) =>
		{
			tmpRGTypeMap[pCols[0]] = cleanIMDb(pCols[1]);
			if (cleanIMDb(pCols[1]) === 'Album') tmpAlbumTypeId = pCols[0];
		}, (pError2) =>
		{
			if (pError2) return fCallback(pError2);
			console.log(`  Release group types: ${JSON.stringify(tmpRGTypeMap)}`);
			console.log(`  Album type ID: ${tmpAlbumTypeId}`);

			streamPlainTsv(libPath.join(tmpMBDir, 'area'), (pCols) =>
			{
				tmpAreaMap[pCols[0]] = cleanIMDb(pCols[2]);
			}, (pError3) =>
			{
				if (pError3) return fCallback(pError3);
				console.log(`  Areas: ${Object.keys(tmpAreaMap).length.toLocaleString()}`);
				doStep10b();
			});
		});
	});

	// -------------------------------------------------------
	// Step 10b: Parse artist_credit_name (primary artist per credit)
	// -------------------------------------------------------
	function doStep10b()
	{
		console.log(`\n  --- Step 10b: Parse artist_credit_name (primary artists) ---`);
		streamPlainTsv(libPath.join(tmpMBDir, 'artist_credit_name'), (pCols) =>
		{
			// cols: artist_credit(0), position(1), artist(2), name(3), join_phrase(4)
			if (pCols[1] === '0')
			{
				tmpCreditToArtist[pCols[0]] = pCols[2];
			}
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Credit→artist mappings: ${Object.keys(tmpCreditToArtist).length.toLocaleString()}`);
			doStep10c();
		});
	}

	// -------------------------------------------------------
	// Step 10c: Parse release_group (Albums) → count per artist → select top N
	// -------------------------------------------------------
	function doStep10c()
	{
		console.log(`\n  --- Step 10c: Parse release_group (filter: Albums, select top ${MAX_MB_ARTISTS} artists, max ${MAX_MB_ALBUMS_PER_ARTIST}/artist) ---`);
		let tmpTotalAlbums = 0;

		streamPlainTsv(libPath.join(tmpMBDir, 'release_group'), (pCols) =>
		{
			// cols: id(0), gid(1), name(2), artist_credit(3), type(4), ...
			if (pCols[4] !== tmpAlbumTypeId) return;
			tmpTotalAlbums++;

			let tmpArtistId = tmpCreditToArtist[pCols[3]];
			if (!tmpArtistId) return;

			if (!tmpArtistAlbumCount[tmpArtistId]) tmpArtistAlbumCount[tmpArtistId] = 0;
			tmpArtistAlbumCount[tmpArtistId]++;

			if (!tmpAlbumsByArtist[tmpArtistId]) tmpAlbumsByArtist[tmpArtistId] = [];
			tmpAlbumsByArtist[tmpArtistId].push(
			{
				rg_id: pCols[0],
				gid: pCols[1],
				name: cleanIMDb(pCols[2])
			});
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Total albums (type=Album): ${tmpTotalAlbums.toLocaleString()}`);
			console.log(`  Unique artists with albums: ${Object.keys(tmpArtistAlbumCount).length.toLocaleString()}`);

			// Filter: skip artists with excessive albums (likely VA/compilation credits)
			// and those with fewer than 3 albums (not prolific enough to warrant inclusion)
			let tmpFiltered = Object.entries(tmpArtistAlbumCount)
				.filter((a) => a[1] >= 3 && a[1] <= 200);

			console.log(`  Artists with 3-200 albums: ${tmpFiltered.length.toLocaleString()}`);

			// Sort by album count descending, take top MAX_MB_ARTISTS
			let tmpSorted = tmpFiltered
				.sort((a, b) => b[1] - a[1])
				.slice(0, MAX_MB_ARTISTS);

			if (tmpSorted.length > 0)
			{
				console.log(`  Top ${tmpSorted.length} artists selected (albums: ${tmpSorted[tmpSorted.length - 1][1]}-${tmpSorted[0][1]})`);
			}

			// Build final sets, cap albums per artist
			for (let i = 0; i < tmpSorted.length; i++)
			{
				let tmpId = tmpSorted[i][0];
				tmpFinalArtistIds.add(tmpId);

				let tmpAlbums = tmpAlbumsByArtist[tmpId] || [];
				let tmpCap = Math.min(tmpAlbums.length, MAX_MB_ALBUMS_PER_ARTIST);
				for (let j = 0; j < tmpCap; j++)
				{
					let tmpAlbum = tmpAlbums[j];
					tmpFinalAlbums.push(
					{
						rg_id: tmpAlbum.rg_id,
						gid: tmpAlbum.gid,
						name: tmpAlbum.name,
						mb_artist_id: tmpId
					});
					tmpFinalAlbumRGIds.add(tmpAlbum.rg_id);
					tmpRGIdToGid[tmpAlbum.rg_id] = tmpAlbum.gid;
					tmpRGToArtistId[tmpAlbum.rg_id] = tmpId;
				}
			}

			console.log(`  Final albums to ingest: ${tmpFinalAlbums.length.toLocaleString()}`);

			// Free memory
			tmpCreditToArtist = null;
			tmpArtistAlbumCount = null;
			tmpAlbumsByArtist = null;

			doStep10d();
		});
	}

	// -------------------------------------------------------
	// Step 10d: Parse artist → get data for final artists
	// -------------------------------------------------------
	function doStep10d()
	{
		console.log(`\n  --- Step 10d: Parse artist (filter: final set) ---`);
		streamPlainTsv(libPath.join(tmpMBDir, 'artist'), (pCols) =>
		{
			// cols: id(0), gid(1), name(2), sort_name(3), begin_date_year(4), ..., type(10), area(11), gender(12), comment(13)
			if (!tmpFinalArtistIds.has(pCols[0])) return;

			let tmpTypeName = tmpArtistTypeMap[pCols[10]] || '';
			let tmpAreaName = tmpAreaMap[pCols[11]] || '';

			tmpArtistDataMB[pCols[0]] =
			{
				gid: pCols[1],
				name: cleanIMDb(pCols[2]),
				sort_name: cleanIMDb(pCols[3]),
				begin_year: cleanIMDbNum(pCols[4]),
				end_year: cleanIMDbNum(pCols[7]),
				type: tmpTypeName.toLowerCase() || 'person',
				area_name: tmpAreaName,
				comment: cleanIMDb(pCols[13])
			};
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Artists collected: ${Object.keys(tmpArtistDataMB).length.toLocaleString()}`);
			doStep10e();
		});
	}

	// -------------------------------------------------------
	// Step 10e: Parse release → one release per album
	// -------------------------------------------------------
	function doStep10e()
	{
		console.log(`\n  --- Step 10e: Parse release (one per album) ---`);
		let tmpRGsCovered = new Set();

		streamPlainTsv(libPath.join(tmpMBDir, 'release'), (pCols) =>
		{
			// cols: id(0), gid(1), name(2), artist_credit(3), release_group(4), status(5), ...
			let tmpRGId = pCols[4];
			if (!tmpFinalAlbumRGIds.has(tmpRGId)) return;
			if (tmpRGsCovered.has(tmpRGId)) return;

			tmpRGsCovered.add(tmpRGId);
			tmpReleaseToRG[pCols[0]] = tmpRGId;
			tmpReleaseIds.add(pCols[0]);
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Releases mapped: ${tmpReleaseIds.size.toLocaleString()} (1 per album)`);
			doStep10f();
		});
	}

	// -------------------------------------------------------
	// Step 10f: Parse medium → link releases to media
	// -------------------------------------------------------
	function doStep10f()
	{
		console.log(`\n  --- Step 10f: Parse medium (for selected releases) ---`);
		streamPlainTsv(libPath.join(tmpMBDir, 'medium'), (pCols) =>
		{
			// cols: id(0), release(1), position(2), format(3), ...
			if (!tmpReleaseIds.has(pCols[1])) return;

			let tmpRGId = tmpReleaseToRG[pCols[1]];
			tmpMediumToRG[pCols[0]] =
			{
				rg_id: tmpRGId,
				disc_number: cleanIMDbNum(pCols[2])
			};
			tmpMediumIds.add(pCols[0]);
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Media mapped: ${tmpMediumIds.size.toLocaleString()}`);

			// Free release data
			tmpReleaseToRG = null;
			tmpReleaseIds = null;

			doStep10g();
		});
	}

	// -------------------------------------------------------
	// Step 10g: Parse track → collect tracks and recording IDs
	//   Uses awk pre-filter (54M+ lines → ~1M matching)
	// -------------------------------------------------------
	function doStep10g()
	{
		console.log(`\n  --- Step 10g: Parse track (awk-filtered on medium, ~54M lines) ---`);
		filteredStreamPlainTsv(libPath.join(tmpMBDir, 'track'), 3, tmpMediumIds, (pCols) =>
		{
			// cols: id(0), gid(1), recording(2), medium(3), position(4), number(5), name(6), ...
			let tmpMedInfo = tmpMediumToRG[pCols[3]];
			if (!tmpMedInfo) return;

			tmpRecordingIds.add(pCols[2]);

			tmpTrackDataMB.push(
			{
				recording_id: pCols[2],
				rg_id: tmpMedInfo.rg_id,
				position: cleanIMDbNum(pCols[4]),
				disc_number: tmpMedInfo.disc_number
			});
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Tracks collected: ${tmpTrackDataMB.length.toLocaleString()}`);
			console.log(`  Unique recordings: ${tmpRecordingIds.size.toLocaleString()}`);

			// Free medium data
			tmpMediumToRG = null;
			tmpMediumIds = null;

			doStep10h();
		});
	}

	// -------------------------------------------------------
	// Step 10h: Parse recording → get song details
	//   Uses awk pre-filter (35M+ lines → ~840K matching)
	// -------------------------------------------------------
	function doStep10h()
	{
		console.log(`\n  --- Step 10h: Parse recording (awk-filtered on ID, ~35M lines) ---`);
		filteredStreamPlainTsv(libPath.join(tmpMBDir, 'recording'), 0, tmpRecordingIds, (pCols) =>
		{
			// cols: id(0), gid(1), name(2), artist_credit(3), length(4), ...
			tmpRecordingDataMB[pCols[0]] =
			{
				gid: pCols[1],
				name: cleanIMDb(pCols[2]),
				length: cleanIMDbNum(pCols[4])
			};
		}, (pError) =>
		{
			if (pError) return fCallback(pError);
			console.log(`  Recordings collected: ${Object.keys(tmpRecordingDataMB).length.toLocaleString()}`);
			console.log(`\n  --- Parsing complete. Starting POST phase... ---`);
			doStep10i();
		});
	}

	// -------------------------------------------------------
	// Step 10i: POST MusicBrainz Artists
	// -------------------------------------------------------
	function doStep10i()
	{
		console.log(`\n  --- Step 10i: POST MusicBrainz Artists ---`);
		let tmpArtistRecords = [];

		for (let tmpId in tmpArtistDataMB)
		{
			let tmpA = tmpArtistDataMB[tmpId];
			tmpArtistRecords.push(
			{
				Name: tmpA.name,
				SortName: tmpA.sort_name,
				ExternalID: tmpA.gid,
				ArtistType: tmpA.type,
				BeginYear: tmpA.begin_year,
				EndYear: tmpA.end_year,
				Country: tmpA.area_name,
				Disambiguation: tmpA.comment,
				IDDataSource: DS_MUSICBRAINZ
			});
		}

		batchApiPost('Artist', tmpArtistRecords, (pError) =>
		{
			if (pError) console.error(`  MB Artist POST error: ${pError}`);

			buildArtistLookups((pError2) =>
			{
				if (pError2) console.error(`  Artist lookup rebuild error: ${pError2}`);
				doStep10j();
			});
		});
	}

	// -------------------------------------------------------
	// Step 10j: POST MusicBrainz Albums
	// -------------------------------------------------------
	function doStep10j()
	{
		console.log(`\n  --- Step 10j: POST MusicBrainz Albums ---`);
		let tmpAlbumRecords = [];

		for (let i = 0; i < tmpFinalAlbums.length; i++)
		{
			let tmpAlbum = tmpFinalAlbums[i];
			let tmpArtist = tmpArtistDataMB[tmpAlbum.mb_artist_id];
			let tmpIDArtist = tmpArtist ? (ARTIST_LOOKUP[tmpArtist.gid] || 0) : 0;

			tmpAlbumRecords.push(
			{
				Title: tmpAlbum.name,
				ExternalID: tmpAlbum.gid,
				AlbumType: 'album',
				IDArtist: tmpIDArtist,
				IDDataSource: DS_MUSICBRAINZ
			});
		}

		batchApiPost('Album', tmpAlbumRecords, (pError) =>
		{
			if (pError) console.error(`  MB Album POST error: ${pError}`);

			// Build album lookup (ExternalID gid → IDAlbum)
			fetchAllRecords('Albums', (pError2, pAlbumRecs) =>
			{
				if (!pError2 && pAlbumRecs)
				{
					for (let i = 0; i < pAlbumRecs.length; i++)
					{
						if (pAlbumRecs[i].ExternalID && pAlbumRecs[i].IDAlbum)
						{
							ALBUM_LOOKUP[pAlbumRecs[i].ExternalID] = pAlbumRecs[i].IDAlbum;
						}
					}
					console.log(`  [lookup] Built Album lookup: ${Object.keys(ALBUM_LOOKUP).length} entries`);
				}
				doStep10k();
			});
		});
	}

	// -------------------------------------------------------
	// Step 10k: POST MusicBrainz Songs (recordings)
	// -------------------------------------------------------
	function doStep10k()
	{
		console.log(`\n  --- Step 10k: POST MusicBrainz Songs ---`);
		let tmpSongRecords = [];
		let tmpSeenGids = new Set();

		// Derive artist for each recording from its album
		let tmpRecToArtistGid = {};
		for (let i = 0; i < tmpTrackDataMB.length; i++)
		{
			let tmpTrack = tmpTrackDataMB[i];
			if (!tmpRecToArtistGid[tmpTrack.recording_id])
			{
				let tmpArtistId = tmpRGToArtistId[tmpTrack.rg_id];
				let tmpArtist = tmpArtistId ? tmpArtistDataMB[tmpArtistId] : null;
				if (tmpArtist) tmpRecToArtistGid[tmpTrack.recording_id] = tmpArtist.gid;
			}
		}

		for (let tmpRecId in tmpRecordingDataMB)
		{
			let tmpRec = tmpRecordingDataMB[tmpRecId];
			if (tmpSeenGids.has(tmpRec.gid)) continue;
			tmpSeenGids.add(tmpRec.gid);

			let tmpArtistGid = tmpRecToArtistGid[tmpRecId] || '';
			let tmpIDArtist = ARTIST_LOOKUP[tmpArtistGid] || 0;

			tmpSongRecords.push(
			{
				Title: tmpRec.name,
				ExternalID: tmpRec.gid,
				DurationSeconds: Math.round(tmpRec.length / 1000),
				IDArtist: tmpIDArtist,
				IDDataSource: DS_MUSICBRAINZ
			});
		}

		console.log(`  Songs to create: ${tmpSongRecords.length.toLocaleString()}`);

		batchApiPost('Song', tmpSongRecords, (pError) =>
		{
			if (pError) console.error(`  MB Song POST error: ${pError}`);

			buildSongLookups((pError2) =>
			{
				if (pError2) console.error(`  Song lookup rebuild error: ${pError2}`);
				doStep10l();
			});
		});
	}

	// -------------------------------------------------------
	// Step 10l: POST MusicBrainz AlbumTracks
	// -------------------------------------------------------
	function doStep10l()
	{
		console.log(`\n  --- Step 10l: POST MusicBrainz AlbumTracks ---`);
		let tmpAlbumTrackRecords = [];

		for (let i = 0; i < tmpTrackDataMB.length; i++)
		{
			let tmpTrack = tmpTrackDataMB[i];
			let tmpAlbumGid = tmpRGIdToGid[tmpTrack.rg_id];
			let tmpIDAlbum = ALBUM_LOOKUP[tmpAlbumGid] || 0;

			let tmpRecording = tmpRecordingDataMB[tmpTrack.recording_id];
			let tmpRecGid = tmpRecording ? tmpRecording.gid : '';
			let tmpIDSong = SONG_LOOKUP[tmpRecGid] || 0;

			if (tmpIDAlbum > 0 && tmpIDSong > 0)
			{
				tmpAlbumTrackRecords.push(
				{
					TrackNumber: tmpTrack.position,
					DiscNumber: tmpTrack.disc_number,
					IDAlbum: tmpIDAlbum,
					IDSong: tmpIDSong
				});
			}
		}

		console.log(`  AlbumTrack records: ${tmpAlbumTrackRecords.length.toLocaleString()}`);

		batchApiPost('AlbumTrack', tmpAlbumTrackRecords, (pError) =>
		{
			if (pError) console.error(`  MB AlbumTrack POST error: ${pError}`);

			// Free all MB parsing data
			tmpArtistDataMB = null;
			tmpFinalAlbums = null;
			tmpTrackDataMB = null;
			tmpRecordingDataMB = null;

			return fCallback(null);
		});
	}
}


// ============================================================
// Main Orchestrator
// ============================================================
function main()
{
	console.log('╔══════════════════════════════════════════════════════════╗');
	console.log('║    Entertainment Data Ingestion Pipeline                ║');
	console.log('║    9 sources → 16 entities                             ║');
	console.log('╚══════════════════════════════════════════════════════════╝');
	console.log(`  API: http://${HARNESS_API_HOST}:${HARNESS_API_PORT}`);
	console.log(`  IMDb filter: numVotes >= ${MIN_VOTES}`);
	console.log(`  MusicBrainz top artists: ${MAX_MB_ARTISTS} (max ${MAX_MB_ALBUMS_PER_ARTIST} albums each)`);
	console.log(`  POST governor: ${POST_BATCH_SIZE} records/chunk, concurrency ${CONCURRENCY}`);
	console.log(`  Download cache: ${DOWNLOAD_DIR}`);
	console.log(`  Curated data: ${CURATED_DIR}`);

	let tmpStartTime = Date.now();

	runSteps(
	[
		{ name: 'Download IMDb datasets', fn: phase1DownloadIMDb },
		{ name: 'Parse IMDb data (multi-pass streaming)', fn: phase2ParseIMDb },
		{ name: 'POST IMDb entities (Genres, Movies, People, Credits, Ratings)', fn: phase3PostIMDb },
		{ name: 'Wikidata musicians → Artists', fn: phase4WikidataMusicians },
		{ name: 'Wikidata albums and songs → Albums, Songs', fn: phase5WikidataAlbumsAndSongs },
		{ name: 'Wikidata venues → Venues', fn: phase6WikidataVenues },
		{ name: 'Curated soundtracks → Songs, Soundtracks', fn: phase7CuratedSoundtracks },
		{ name: 'Curated concerts → Venues, Concerts, SetlistEntries', fn: phase8CuratedConcerts },
		{ name: 'Download and extract MusicBrainz dump', fn: phase9DownloadMusicBrainz },
		{ name: 'MusicBrainz data → Artists, Albums, Songs, AlbumTracks', fn: phase10ParseAndPostMusicBrainz }
	], () =>
	{
		let tmpTotalTime = ((Date.now() - tmpStartTime) / 1000).toFixed(1);
		console.log('\n╔══════════════════════════════════════════════════════════╗');
		console.log('║    Ingestion Complete!                                   ║');
		console.log('╚══════════════════════════════════════════════════════════╝');
		console.log(`  Total time: ${tmpTotalTime}s`);

		// Print summary counts
		let tmpEntities = ['Genres', 'Persons', 'Movies', 'MovieGenres', 'MovieCredits',
			'MovieRatings', 'Artists', 'Albums', 'Songs', 'AlbumTracks',
			'Soundtracks', 'Venues', 'Concerts', 'SetlistEntrys'];

		let tmpRemaining = tmpEntities.length;
		let tmpResults = {};

		for (let i = 0; i < tmpEntities.length; i++)
		{
			let tmpEntity = tmpEntities[i];
			apiGet(`/1.0/${tmpEntity}/Count`, (pError, pResult) =>
			{
				tmpResults[tmpEntity] = (pResult && pResult.Count !== undefined) ? pResult.Count : '?';
				tmpRemaining--;

				if (tmpRemaining <= 0)
				{
					console.log('\n  Entity Counts:');
					for (let j = 0; j < tmpEntities.length; j++)
					{
						let tmpName = tmpEntities[j].padEnd(20);
						console.log(`    ${tmpName} ${tmpResults[tmpEntities[j]]}`);
					}
					console.log('');
					process.exit(0);
				}
			});
		}
	});
}

// Run the ingestion
main();
