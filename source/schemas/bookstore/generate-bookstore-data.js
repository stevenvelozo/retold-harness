#!/usr/bin/env node
/**
 * Deterministic Bookstore Data Generator
 *
 * Generates realistic seed data for the retold-harness bookstore schema.
 * Uses a seeded PRNG (mulberry32) so output is identical across runs.
 *
 * Usage:
 *   node generate-bookstore-data.js [--seed=N]
 *
 * Output:
 *   sqlite_create/BookStore-SeedData-Generated.sql
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
'use strict';

const libFS = require('fs');
const libPath = require('path');

// ============================================================
// Configuration
// ============================================================
const DEFAULT_SEED = 20240101;
const SEED = parseInt((process.argv.find((pArg) => pArg.startsWith('--seed=')) || '').split('=')[1], 10) || DEFAULT_SEED;

const OUTPUT_FILE = libPath.join(__dirname, 'sqlite_create', 'BookStore-SeedData-Generated.sql');

// ID range offsets (avoid conflicts with existing seed data)
const USER_ID_START = 100;
const BOOKSTORE_ID_START = 200;
const EMPLOYEE_ID_START = 100;
const BOOKPRICE_ID_START = 1;
const INVENTORY_ID_START = 1;
const SALE_ID_START = 100;
const SALEITEM_ID_START = 100;
const REVIEW_ID_START = 100;

// Volume targets
const USER_COUNT = 1200;
const PHYSICAL_STORE_COUNT = 20;
const CLOSED_STORE_COUNT = 4;
const EMPLOYEES_PER_STORE_MIN = 4;
const EMPLOYEES_PER_STORE_MAX = 8;
const PRICES_PER_BOOK_MIN = 2;
const PRICES_PER_BOOK_MAX = 4;
const EXISTING_BOOK_COUNT = 10000;
const REVIEW_COUNT = 22000;
const SALE_DATE_START = '2021-01-01';
const SALE_DATE_END = '2024-12-31';
const INVENTORY_QUARTERS = 16; // 4 years * 4 quarters
const BOOKS_PER_STORE_INVENTORY = 150; // subset of books stocked per quarter per store

// ============================================================
// PRNG — mulberry32
// ============================================================
let _PRNGState = SEED;

function _random()
{
	let t = _PRNGState += 0x6D2B79F5;
	t = Math.imul(t ^ t >>> 15, t | 1);
	t ^= t + Math.imul(t ^ t >>> 7, t | 61);
	return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function randomInt(pMin, pMax)
{
	return Math.floor(_random() * (pMax - pMin + 1)) + pMin;
}

function randomFloat(pMin, pMax, pDecimals)
{
	let tmpVal = _random() * (pMax - pMin) + pMin;
	let tmpFactor = Math.pow(10, pDecimals || 2);
	return Math.round(tmpVal * tmpFactor) / tmpFactor;
}

function pick(pArray)
{
	return pArray[Math.floor(_random() * pArray.length)];
}

function weightedPick(pOptions, pWeights)
{
	let tmpTotal = pWeights.reduce((pSum, pW) => pSum + pW, 0);
	let tmpRoll = _random() * tmpTotal;
	let tmpAccum = 0;
	for (let i = 0; i < pOptions.length; i++)
	{
		tmpAccum += pWeights[i];
		if (tmpRoll < tmpAccum)
		{
			return pOptions[i];
		}
	}
	return pOptions[pOptions.length - 1];
}

let _GUIDCounter = 0;
function guid()
{
	_GUIDCounter++;
	let tmpHex = _GUIDCounter.toString(16).padStart(8, '0');
	let tmpR1 = Math.floor(_random() * 0xFFFF).toString(16).padStart(4, '0');
	let tmpR2 = Math.floor(_random() * 0xFFFF).toString(16).padStart(4, '0');
	let tmpR3 = Math.floor(_random() * 0xFFFF).toString(16).padStart(4, '0');
	let tmpR4 = Math.floor(_random() * 0xFFFFFFFF).toString(16).padStart(8, '0');
	return `gen-${tmpHex}-${tmpR1}-${tmpR2}-${tmpR3}-${tmpR4}`;
}

// ============================================================
// Date Helpers
// ============================================================
function formatDate(pDate)
{
	let tmpYear = pDate.getFullYear();
	let tmpMonth = String(pDate.getMonth() + 1).padStart(2, '0');
	let tmpDay = String(pDate.getDate()).padStart(2, '0');
	let tmpHours = String(pDate.getHours()).padStart(2, '0');
	let tmpMinutes = String(pDate.getMinutes()).padStart(2, '0');
	let tmpSeconds = String(pDate.getSeconds()).padStart(2, '0');
	return `${tmpYear}-${tmpMonth}-${tmpDay} ${tmpHours}:${tmpMinutes}:${tmpSeconds}`;
}

function randomDate(pStartStr, pEndStr)
{
	let tmpStart = new Date(pStartStr).getTime();
	let tmpEnd = new Date(pEndStr).getTime();
	let tmpTime = tmpStart + _random() * (tmpEnd - tmpStart);
	return new Date(tmpTime);
}

function addDays(pDate, pDays)
{
	let tmpDate = new Date(pDate.getTime());
	tmpDate.setDate(tmpDate.getDate() + pDays);
	return tmpDate;
}

// ============================================================
// SQL Helpers
// ============================================================
function escapeSQL(pString)
{
	if (pString === null || pString === undefined)
	{
		return '';
	}
	return String(pString).replace(/'/g, "''");
}

function batchInsert(pTable, pColumns, pRows, pBatchSize)
{
	let tmpBatch = pBatchSize || 500;
	let tmpSQL = [];
	let tmpColList = pColumns.join(', ');

	for (let i = 0; i < pRows.length; i += tmpBatch)
	{
		let tmpChunk = pRows.slice(i, i + tmpBatch);
		let tmpValues = tmpChunk.map((pRow) =>
		{
			let tmpVals = pColumns.map((pCol) =>
			{
				let tmpVal = pRow[pCol];
				if (tmpVal === null || tmpVal === undefined)
				{
					return "''";
				}
				if (typeof tmpVal === 'number')
				{
					return String(tmpVal);
				}
				return `'${escapeSQL(tmpVal)}'`;
			});
			return `(${tmpVals.join(',')})`;
		});
		tmpSQL.push(`INSERT OR IGNORE INTO ${pTable}\n\t(${tmpColList})\nVALUES\n\t${tmpValues.join(',\n\t')};`);
	}
	return tmpSQL.join('\n\n');
}

// ============================================================
// Data Arrays
// ============================================================
const FIRST_NAMES = [
	'James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth',
	'William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen',
	'Charles','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra',
	'Donald','Ashley','Steven','Kimberly','Paul','Emily','Andrew','Donna','Joshua','Michelle',
	'Kenneth','Carol','Kevin','Amanda','Brian','Dorothy','George','Melissa','Timothy','Deborah',
	'Ronald','Stephanie','Edward','Rebecca','Jason','Sharon','Jeffrey','Laura','Ryan','Cynthia',
	'Jacob','Kathleen','Gary','Amy','Nicholas','Angela','Eric','Shirley','Jonathan','Anna',
	'Stephen','Brenda','Larry','Pamela','Justin','Emma','Scott','Nicole','Brandon','Helen',
	'Benjamin','Samantha','Samuel','Katherine','Raymond','Christine','Gregory','Debra','Frank','Rachel',
	'Alexander','Carolyn','Patrick','Janet','Jack','Catherine','Dennis','Maria','Jerry','Heather',
	'Tyler','Diane','Aaron','Ruth','Jose','Julie','Adam','Olivia','Nathan','Joyce'
];

const LAST_NAMES = [
	'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
	'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
	'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
	'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
	'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
	'Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes',
	'Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper',
	'Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson',
	'Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes',
	'Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez'
];

const CITY_STATE_ZIP = [
	{ city: 'Portland', state: 'OR', zip: '97201' },
	{ city: 'Seattle', state: 'WA', zip: '98101' },
	{ city: 'Denver', state: 'CO', zip: '80201' },
	{ city: 'Austin', state: 'TX', zip: '73301' },
	{ city: 'Chicago', state: 'IL', zip: '60601' },
	{ city: 'San Francisco', state: 'CA', zip: '94101' },
	{ city: 'New York', state: 'NY', zip: '10001' },
	{ city: 'Los Angeles', state: 'CA', zip: '90001' },
	{ city: 'Boston', state: 'MA', zip: '02101' },
	{ city: 'Philadelphia', state: 'PA', zip: '19101' },
	{ city: 'Phoenix', state: 'AZ', zip: '85001' },
	{ city: 'San Diego', state: 'CA', zip: '92101' },
	{ city: 'Dallas', state: 'TX', zip: '75201' },
	{ city: 'Houston', state: 'TX', zip: '77001' },
	{ city: 'Minneapolis', state: 'MN', zip: '55401' },
	{ city: 'Nashville', state: 'TN', zip: '37201' },
	{ city: 'Atlanta', state: 'GA', zip: '30301' },
	{ city: 'Miami', state: 'FL', zip: '33101' },
	{ city: 'Detroit', state: 'MI', zip: '48201' },
	{ city: 'Charlotte', state: 'NC', zip: '28201' },
	{ city: 'Salt Lake City', state: 'UT', zip: '84101' },
	{ city: 'Kansas City', state: 'MO', zip: '64101' },
	{ city: 'Columbus', state: 'OH', zip: '43201' },
	{ city: 'Indianapolis', state: 'IN', zip: '46201' },
	{ city: 'San Antonio', state: 'TX', zip: '78201' },
	{ city: 'Pittsburgh', state: 'PA', zip: '15201' },
	{ city: 'Sacramento', state: 'CA', zip: '95801' },
	{ city: 'Orlando', state: 'FL', zip: '32801' },
	{ city: 'Cleveland', state: 'OH', zip: '44101' },
	{ city: 'St. Louis', state: 'MO', zip: '63101' },
	{ city: 'Tampa', state: 'FL', zip: '33601' },
	{ city: 'Raleigh', state: 'NC', zip: '27601' },
	{ city: 'Milwaukee', state: 'WI', zip: '53201' },
	{ city: 'Tucson', state: 'AZ', zip: '85701' },
	{ city: 'Richmond', state: 'VA', zip: '23219' },
	{ city: 'Boise', state: 'ID', zip: '83701' },
	{ city: 'Albuquerque', state: 'NM', zip: '87101' },
	{ city: 'Omaha', state: 'NE', zip: '68101' },
	{ city: 'Louisville', state: 'KY', zip: '40201' },
	{ city: 'New Orleans', state: 'LA', zip: '70112' }
];

const STREET_NAMES = [
	'Oak','Pine','Maple','Cedar','Elm','Birch','Main','Park','Lake','River',
	'Hill','Valley','Forest','Meadow','Spring','Sunset','Highland','Lincoln','Washington','Franklin',
	'Liberty','Church','Market','Union','Academy','College','Prospect','Grove','Chestnut','Walnut'
];

const STREET_SUFFIXES = [
	'Street','Avenue','Drive','Lane','Road','Court','Boulevard','Way','Place','Circle'
];

const STORE_NAME_PREFIXES = [
	'Retold Books','Chapter House','Page Turner','Bookworm','The Reading Room',
	'Shelf Life','Between the Lines','Novel Ideas','Cover to Cover','The Book Nook',
	'Inkwell Books','Storied Pages','Bound Together','Open Book','Fireside Books',
	'The Turning Page','Paperback Paradise','Readers Haven','Bookmark','Folio Books'
];

const EMPLOYEE_TITLES = [
	'Store Manager','Assistant Manager','Sales Associate','Inventory Clerk','Cashier','Shift Lead'
];

const PAYMENT_METHODS = ['Credit','Debit','Cash','Online'];
const PAYMENT_WEIGHTS = [45, 25, 15, 15];

const INSTORE_PAYMENT_METHODS = ['Credit','Debit','Cash'];
const INSTORE_PAYMENT_WEIGHTS = [50, 30, 20];

const COUPON_CODES = [
	'','','','','','','','', // 80% no coupon
	'SAVE10','SAVE15','HOLIDAY22','SPRING23','SUMMER23','FALL23','NEWYEAR24','BOOKCLUB','WELCOME','LOYAL20'
];

const REVIEW_OPENERS = [
	'Really enjoyed this book.',
	'This was a page-turner from start to finish.',
	'Not what I expected but I was pleasantly surprised.',
	'I picked this up on a whim and I am glad I did.',
	'A solid read that kept me engaged throughout.',
	'I could not put this book down.',
	'Interesting premise with mostly good execution.',
	'This has quickly become one of my favorites.',
	'Had high expectations and they were met.',
	'A wonderful story that stayed with me.',
	'Not my usual genre but I thoroughly enjoyed it.',
	'Started slow but really picked up in the second half.',
	'An absolute must-read for anyone who loves books.',
	'Thought-provoking and well-crafted.',
	'Light and entertaining read.',
	'This book exceeded all my expectations.',
	'A masterful work of storytelling.',
	'Perfect weekend read.',
	'Gripping from the very first chapter.',
	'A delightful surprise from start to finish.'
];

const REVIEW_MIDDLES = [
	'The characters felt very real and relatable.',
	'The writing style is crisp and engaging.',
	'Some parts dragged a bit but overall solid.',
	'The plot twists kept me guessing the entire time.',
	'Beautiful prose that flows naturally.',
	'The world-building is absolutely superb.',
	'I found myself thinking about it long after finishing.',
	'The dialogue is sharp and authentic.',
	'Every chapter builds on the last perfectly.',
	'The pacing could have been tighter in places.',
	'Rich character development throughout.',
	'The author has a unique voice that really shines here.',
	'Some of the themes resonated deeply with me.',
	'The narrative structure is cleverly done.',
	'A few plot holes but nothing that ruins the experience.',
	'The emotional depth caught me off guard.',
	'Loved the attention to detail in every scene.',
	'The humor scattered throughout made it a joy to read.',
	'A few slow chapters in the middle section.',
	'The setting comes alive through vivid descriptions.',
	'I appreciated the nuanced take on complex topics.',
	'The suspense builds beautifully across chapters.',
	'Felt like I was right there alongside the characters.',
	'Some predictable moments but mostly fresh and original.',
	'The research that went into this is clearly extensive.',
	'Perfect balance of action and introspection.',
	'The ending ties everything together wonderfully.',
	'A couple of subplots felt underdeveloped.',
	'The writing has a warmth that draws you in.',
	'Each character has a distinct and memorable voice.'
];

const REVIEW_CLOSERS = [
	'Would definitely recommend.',
	'Already looking forward to reading more from this author.',
	'A solid addition to my bookshelf.',
	'Will be recommending this to friends.',
	'Four stars from me.',
	'One of the best I have read this year.',
	'Worth every penny.',
	'I will certainly read it again someday.',
	'A good choice for book club discussions.',
	'Highly recommended for fans of the genre.',
	'Not perfect but still very much worth reading.',
	'Glad I gave it a chance.',
	'Would make a great gift for any book lover.',
	'Looking forward to the sequel.',
	'This one will stay on my shelf for a long time.',
	'A satisfying read from beginning to end.',
	'Cannot wait to see what this author does next.',
	'Pick this one up if you get the chance.',
	'I have already recommended it to three people.',
	'This deserves a wider audience.',
	'Five stars without hesitation.',
	'An enjoyable escape from everyday life.',
	'Surprisingly good and well worth your time.',
	'I found myself savoring every page.',
	'A memorable reading experience overall.',
	'Definitely adding more of this author to my list.',
	'Exceeded my expectations in every way.',
	'A great book that speaks for itself.',
	'I am a better reader for having read this.',
	'Simply put this is a great book.'
];

// ============================================================
// Generator Functions
// ============================================================

function generateUsers()
{
	console.log('  Generating users...');
	let tmpRecords = [];

	for (let i = 0; i < USER_COUNT; i++)
	{
		let tmpID = USER_ID_START + i;
		let tmpFirst = pick(FIRST_NAMES);
		let tmpLast = pick(LAST_NAMES);
		let tmpLocation = pick(CITY_STATE_ZIP);
		let tmpStreetNum = randomInt(100, 9999);
		let tmpStreet = `${tmpStreetNum} ${pick(STREET_NAMES)} ${pick(STREET_SUFFIXES)}`;
		let tmpLogin = (tmpFirst.charAt(0) + tmpLast).toLowerCase() + tmpID;
		let tmpEmail = `${tmpFirst.toLowerCase()}.${tmpLast.toLowerCase()}${tmpID}@email.com`;

		tmpRecords.push({
			IDUser: tmpID,
			GUIDUser: guid(),
			LoginID: tmpLogin,
			Password: `hash${tmpID}`,
			NameFirst: tmpFirst,
			NameLast: tmpLast,
			FullName: `${tmpFirst} ${tmpLast}`,
			Config: '{}',
			IDCustomer: 1,
			Email: tmpEmail,
			Phone: `555-${String(randomInt(1000, 9999))}`,
			Address: tmpStreet,
			City: tmpLocation.city,
			State: tmpLocation.state,
			Postal: tmpLocation.zip,
			Country: 'US'
		});
	}

	// Note: User table does NOT have the standard audit columns (CreateDate, etc.)
	let tmpColumns = ['IDUser','GUIDUser','LoginID','Password','NameFirst','NameLast','FullName','Config',
		'IDCustomer','Email','Phone','Address','City','State','Postal','Country'];

	return { records: tmpRecords, sql: `-- Users (${tmpRecords.length} records)\n` + batchInsert('User', tmpColumns, tmpRecords) };
}

function generateBookStores()
{
	console.log('  Generating bookstores...');
	let tmpRecords = [];

	for (let i = 0; i < PHYSICAL_STORE_COUNT; i++)
	{
		let tmpID = BOOKSTORE_ID_START + i;
		let tmpLocation = CITY_STATE_ZIP[i % CITY_STATE_ZIP.length];
		let tmpName = STORE_NAME_PREFIXES[i % STORE_NAME_PREFIXES.length] + ' - ' + tmpLocation.city;
		let tmpStreetNum = randomInt(100, 9999);
		let tmpStreet = `${tmpStreetNum} ${pick(STREET_NAMES)} ${pick(STREET_SUFFIXES)}`;

		// Open dates staggered across 2018-2021
		let tmpOpenYear = 2018 + Math.floor(i / 6);
		let tmpOpenMonth = String(randomInt(1, 12)).padStart(2, '0');
		let tmpOpenDate = `${tmpOpenYear}-${tmpOpenMonth}-01 09:00:00`;

		// Some stores closed
		let tmpIsClosed = i < CLOSED_STORE_COUNT;
		let tmpCloseDate = '';
		let tmpDeleted = 0;
		if (tmpIsClosed)
		{
			let tmpCloseYear = 2023 + Math.floor(i / 3);
			let tmpCloseMonth = String(randomInt(1, 12)).padStart(2, '0');
			tmpCloseDate = `${Math.min(tmpCloseYear, 2024)}-${tmpCloseMonth}-15 17:00:00`;
			tmpDeleted = 1;
		}

		tmpRecords.push({
			IDBookStore: tmpID,
			GUIDBookStore: guid(),
			CreateDate: tmpOpenDate,
			CreatingIDUser: 99999,
			UpdateDate: tmpOpenDate,
			UpdatingIDUser: 99999,
			Deleted: tmpDeleted,
			DeleteDate: tmpCloseDate,
			DeletingIDUser: tmpIsClosed ? 99999 : 0,
			Name: tmpName,
			Address: tmpStreet,
			City: tmpLocation.city,
			State: tmpLocation.state,
			Postal: tmpLocation.zip,
			Country: 'US',
			IDCustomer: 1,
			StoreType: 'Physical',
			Phone: `555-${String(randomInt(1000, 9999))}`,
			Email: `${tmpLocation.city.toLowerCase().replace(/[^a-z]/g, '')}@retoldbooks.com`
		});
	}

	let tmpColumns = ['IDBookStore','GUIDBookStore','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','Name','Address','City','State','Postal','Country',
		'IDCustomer','StoreType','Phone','Email'];

	return { records: tmpRecords, sql: `-- BookStores (${tmpRecords.length} records)\n` + batchInsert('BookStore', tmpColumns, tmpRecords) };
}

function generateEmployees(pUsers, pStores)
{
	console.log('  Generating employees...');
	let tmpRecords = [];
	let tmpID = EMPLOYEE_ID_START;
	let tmpUserIdx = 0;

	for (let s = 0; s < pStores.length; s++)
	{
		let tmpStore = pStores[s];
		let tmpCount = randomInt(EMPLOYEES_PER_STORE_MIN, EMPLOYEES_PER_STORE_MAX);

		for (let e = 0; e < tmpCount; e++)
		{
			let tmpUser = pUsers[tmpUserIdx % pUsers.length];
			tmpUserIdx++;
			let tmpTitle = (e === 0) ? 'Store Manager' : pick(EMPLOYEE_TITLES);
			let tmpHireDate = tmpStore.CreateDate;
			let tmpIsTerminated = _random() < 0.2;
			let tmpTermDate = '';
			let tmpIsActive = 1;

			if (tmpIsTerminated)
			{
				tmpTermDate = formatDate(randomDate('2022-06-01', '2024-06-01'));
				tmpIsActive = 0;
			}

			tmpRecords.push({
				IDBookStoreEmployee: tmpID,
				GUIDBookStoreEmployee: guid(),
				CreateDate: tmpHireDate,
				CreatingIDUser: 99999,
				UpdateDate: tmpHireDate,
				UpdatingIDUser: 99999,
				Deleted: 0,
				DeleteDate: '',
				DeletingIDUser: 0,
				Title: tmpTitle,
				HireDate: tmpHireDate.substring(0, 10),
				TerminationDate: tmpTermDate ? tmpTermDate.substring(0, 10) : '',
				IsActive: tmpIsActive,
				IDUser: tmpUser.IDUser,
				IDBookStore: tmpStore.IDBookStore,
				IDCustomer: 1
			});
			tmpID++;
		}
	}

	let tmpColumns = ['IDBookStoreEmployee','GUIDBookStoreEmployee','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','Title','HireDate','TerminationDate','IsActive',
		'IDUser','IDBookStore','IDCustomer'];

	return { records: tmpRecords, sql: `-- BookStoreEmployees (${tmpRecords.length} records)\n` + batchInsert('BookStoreEmployee', tmpColumns, tmpRecords) };
}

function generateBookPrices()
{
	console.log('  Generating book prices...');
	let tmpRecords = [];
	let tmpID = BOOKPRICE_ID_START;

	// Price periods for longitudinal pricing
	let tmpPeriods = [
		{ start: '2020-01-01', end: '2021-06-30' },
		{ start: '2021-07-01', end: '2022-12-31' },
		{ start: '2023-01-01', end: '2023-12-31' },
		{ start: '2024-01-01', end: '2024-12-31' }
	];

	for (let b = 1; b <= EXISTING_BOOK_COUNT; b++)
	{
		// Each book gets 2-4 price records
		let tmpPriceCount = randomInt(PRICES_PER_BOOK_MIN, PRICES_PER_BOOK_MAX);
		// Base price for this book
		let tmpBasePrice = randomFloat(8.49, 32.49, 2);
		// Round to .99 or .49 or .95
		let tmpEndings = [0.99, 0.49, 0.95];
		tmpBasePrice = Math.floor(tmpBasePrice) + pick(tmpEndings);

		for (let p = 0; p < tmpPriceCount && p < tmpPeriods.length; p++)
		{
			// Prices tend to increase slightly over time
			let tmpPrice = tmpBasePrice + (p * randomFloat(0, 2.5, 2));
			tmpPrice = Math.floor(tmpPrice) + pick(tmpEndings);

			tmpRecords.push({
				IDBookPrice: tmpID,
				GUIDBookPrice: guid(),
				CreateDate: tmpPeriods[p].start + ' 00:00:00',
				CreatingIDUser: 99999,
				UpdateDate: tmpPeriods[p].start + ' 00:00:00',
				UpdatingIDUser: 99999,
				Deleted: 0,
				DeleteDate: '',
				DeletingIDUser: 0,
				Price: tmpPrice,
				StartDate: tmpPeriods[p].start,
				EndDate: tmpPeriods[p].end,
				Discountable: _random() < 0.7 ? 1 : 0,
				CouponCode: pick(COUPON_CODES),
				IDBook: b,
				IDCustomer: 1
			});
			tmpID++;
		}
	}

	let tmpColumns = ['IDBookPrice','GUIDBookPrice','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','Price','StartDate','EndDate','Discountable','CouponCode',
		'IDBook','IDCustomer'];

	return { records: tmpRecords, sql: `-- BookPrices (${tmpRecords.length} records)\n` + batchInsert('BookPrice', tmpColumns, tmpRecords) };
}

function generateInventory(pStores, pPrices, pEmployees)
{
	console.log('  Generating inventory...');
	let tmpRecords = [];
	let tmpID = INVENTORY_ID_START;

	// Build a lookup: IDBook -> array of price records
	let tmpPricesByBook = {};
	for (let i = 0; i < pPrices.length; i++)
	{
		let tmpBook = pPrices[i].IDBook;
		if (!tmpPricesByBook[tmpBook])
		{
			tmpPricesByBook[tmpBook] = [];
		}
		tmpPricesByBook[tmpBook].push(pPrices[i]);
	}

	// Build employee lookup by store
	let tmpEmployeesByStore = {};
	for (let i = 0; i < pEmployees.length; i++)
	{
		let tmpStore = pEmployees[i].IDBookStore;
		if (!tmpEmployeesByStore[tmpStore])
		{
			tmpEmployeesByStore[tmpStore] = [];
		}
		tmpEmployeesByStore[tmpStore].push(pEmployees[i]);
	}

	// Quarter start dates
	let tmpQuarters = [];
	for (let y = 2021; y <= 2024; y++)
	{
		tmpQuarters.push(`${y}-01-01`);
		tmpQuarters.push(`${y}-04-01`);
		tmpQuarters.push(`${y}-07-01`);
		tmpQuarters.push(`${y}-10-01`);
	}

	for (let s = 0; s < pStores.length; s++)
	{
		let tmpStore = pStores[s];
		let tmpStoreEmployees = tmpEmployeesByStore[tmpStore.IDBookStore] || [];
		if (tmpStoreEmployees.length === 0)
		{
			continue;
		}

		for (let q = 0; q < tmpQuarters.length; q++)
		{
			let tmpQuarterDate = tmpQuarters[q];

			// Skip if store wasn't open yet or already closed
			if (tmpQuarterDate < tmpStore.CreateDate.substring(0, 10))
			{
				continue;
			}
			if (tmpStore.Deleted === 1 && tmpStore.DeleteDate && tmpQuarterDate > tmpStore.DeleteDate.substring(0, 10))
			{
				continue;
			}

			// Pick a random subset of books to stock
			let tmpBookStart = randomInt(1, EXISTING_BOOK_COUNT - BOOKS_PER_STORE_INVENTORY);
			for (let b = 0; b < BOOKS_PER_STORE_INVENTORY; b++)
			{
				let tmpBookID = tmpBookStart + b;
				let tmpBookPrices = tmpPricesByBook[tmpBookID];
				if (!tmpBookPrices || tmpBookPrices.length === 0)
				{
					continue;
				}

				// Find the price active on this quarter date
				let tmpActivePrice = null;
				for (let p = 0; p < tmpBookPrices.length; p++)
				{
					if (tmpBookPrices[p].StartDate <= tmpQuarterDate && tmpBookPrices[p].EndDate >= tmpQuarterDate)
					{
						tmpActivePrice = tmpBookPrices[p];
						break;
					}
				}
				if (!tmpActivePrice)
				{
					tmpActivePrice = tmpBookPrices[tmpBookPrices.length - 1];
				}

				let tmpEmployee = pick(tmpStoreEmployees);
				let tmpCount = randomInt(1, 25);

				tmpRecords.push({
					IDBookStoreInventory: tmpID,
					GUIDBookStoreInventory: guid(),
					CreateDate: tmpQuarterDate + ' 08:00:00',
					CreatingIDUser: tmpEmployee.IDUser,
					UpdateDate: tmpQuarterDate + ' 08:00:00',
					UpdatingIDUser: tmpEmployee.IDUser,
					Deleted: 0,
					DeleteDate: '',
					DeletingIDUser: 0,
					StockDate: tmpQuarterDate,
					BookCount: tmpCount,
					AggregateBookCount: tmpCount,
					IDBook: tmpBookID,
					IDBookStore: tmpStore.IDBookStore,
					IDBookPrice: tmpActivePrice.IDBookPrice,
					StockingAssociate: tmpEmployee.IDUser,
					IDCustomer: 1
				});
				tmpID++;
			}
		}
	}

	let tmpColumns = ['IDBookStoreInventory','GUIDBookStoreInventory','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','StockDate','BookCount','AggregateBookCount',
		'IDBook','IDBookStore','IDBookPrice','StockingAssociate','IDCustomer'];

	return { records: tmpRecords, sql: `-- BookStoreInventory (${tmpRecords.length} records)\n` + batchInsert('BookStoreInventory', tmpColumns, tmpRecords) };
}

function generateSales(pStores, pUsers)
{
	console.log('  Generating sales...');
	let tmpRecords = [];
	let tmpSaleID = SALE_ID_START;

	// All stores including existing ones (ID 1 for physical, 100 for online)
	let tmpAllStores = [
		{ IDBookStore: 1, StoreType: 'Physical', CreateDate: '2018-01-01 00:00:00', Deleted: 0, DeleteDate: '' },
		{ IDBookStore: 100, StoreType: 'Online', CreateDate: '2018-01-01 00:00:00', Deleted: 0, DeleteDate: '' },
		...pStores
	];

	// Iterate day by day from start to end
	let tmpStart = new Date(SALE_DATE_START);
	let tmpEnd = new Date(SALE_DATE_END);
	let tmpCurrent = new Date(tmpStart);
	let tmpDailySaleCounter = 0;

	while (tmpCurrent <= tmpEnd)
	{
		let tmpDateStr = formatDate(tmpCurrent);
		let tmpDayOfWeek = tmpCurrent.getDay(); // 0=Sun, 5=Fri, 6=Sat
		let tmpMonth = tmpCurrent.getMonth(); // 0=Jan

		// Seasonal multiplier
		let tmpSeasonMult = 1.0;
		if (tmpMonth === 0)
		{
			tmpSeasonMult = 0.7;
		} // January slump
		else if (tmpMonth === 10 || tmpMonth === 11)
		{
			tmpSeasonMult = 1.5;
		} // Nov-Dec holiday

		// Weekend multiplier
		let tmpWeekendMult = (tmpDayOfWeek === 0 || tmpDayOfWeek === 5 || tmpDayOfWeek === 6) ? 1.4 : 0.85;

		tmpDailySaleCounter = 0;

		for (let s = 0; s < tmpAllStores.length; s++)
		{
			let tmpStore = tmpAllStores[s];
			let tmpDateShort = tmpDateStr.substring(0, 10);

			// Skip if store wasn't open or already closed
			if (tmpDateShort < tmpStore.CreateDate.substring(0, 10))
			{
				continue;
			}
			if (tmpStore.Deleted === 1 && tmpStore.DeleteDate && tmpDateShort > tmpStore.DeleteDate.substring(0, 10))
			{
				continue;
			}

			// Base sales per store per day: ~2-4 for physical, ~5-10 for online
			let tmpBaseSales = (tmpStore.StoreType === 'Online') ? randomFloat(5, 10, 0) : randomFloat(1.5, 3.5, 0);
			let tmpSalesCount = Math.round(tmpBaseSales * tmpSeasonMult * tmpWeekendMult);

			for (let i = 0; i < tmpSalesCount; i++)
			{
				let tmpUser = pick(pUsers);
				let tmpHour = randomInt(9, 21);
				let tmpMinute = randomInt(0, 59);
				let tmpSaleDate = new Date(tmpCurrent);
				tmpSaleDate.setHours(tmpHour, tmpMinute, randomInt(0, 59));

				let tmpPayment;
				if (tmpStore.StoreType === 'Online')
				{
					tmpPayment = 'Online';
				}
				else
				{
					tmpPayment = weightedPick(INSTORE_PAYMENT_METHODS, INSTORE_PAYMENT_WEIGHTS);
				}

				tmpDailySaleCounter++;
				let tmpTxnDate = tmpDateShort.replace(/-/g, '');
				let tmpTxnID = `TXN-${tmpTxnDate}-${String(tmpDailySaleCounter).padStart(5, '0')}`;

				tmpRecords.push({
					IDBookStoreSale: tmpSaleID,
					GUIDBookStoreSale: guid(),
					CreateDate: formatDate(tmpSaleDate),
					CreatingIDUser: tmpUser.IDUser,
					UpdateDate: formatDate(tmpSaleDate),
					UpdatingIDUser: tmpUser.IDUser,
					Deleted: 0,
					DeleteDate: '',
					DeletingIDUser: 0,
					SaleDate: formatDate(tmpSaleDate),
					TotalAmount: 0, // will be updated after generating items
					PaymentMethod: tmpPayment,
					TransactionID: tmpTxnID,
					IDBookStore: tmpStore.IDBookStore,
					IDUser: tmpUser.IDUser,
					IDCustomer: 1
				});
				tmpSaleID++;
			}
		}

		tmpCurrent = addDays(tmpCurrent, 1);
	}

	let tmpColumns = ['IDBookStoreSale','GUIDBookStoreSale','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','SaleDate','TotalAmount','PaymentMethod','TransactionID',
		'IDBookStore','IDUser','IDCustomer'];

	return { records: tmpRecords, sql: `-- BookStoreSales (${tmpRecords.length} records)\n` + batchInsert('BookStoreSale', tmpColumns, tmpRecords) };
}

function generateSaleItems(pSales, pPrices)
{
	console.log('  Generating sale items...');
	let tmpRecords = [];
	let tmpItemID = SALEITEM_ID_START;

	// Build a lookup: IDBook -> array of price records (sorted by StartDate)
	let tmpPricesByBook = {};
	for (let i = 0; i < pPrices.length; i++)
	{
		let tmpBook = pPrices[i].IDBook;
		if (!tmpPricesByBook[tmpBook])
		{
			tmpPricesByBook[tmpBook] = [];
		}
		tmpPricesByBook[tmpBook].push(pPrices[i]);
	}

	// We also need SQL to update the sale totals
	let tmpSaleTotals = {};

	for (let s = 0; s < pSales.length; s++)
	{
		let tmpSale = pSales[s];
		let tmpSaleDateShort = tmpSale.SaleDate.substring(0, 10);
		let tmpItemCount = weightedPick([1, 2, 3, 4], [30, 40, 20, 10]);
		let tmpSaleTotal = 0;

		for (let i = 0; i < tmpItemCount; i++)
		{
			let tmpBookID = randomInt(1, EXISTING_BOOK_COUNT);
			let tmpBookPrices = tmpPricesByBook[tmpBookID];
			if (!tmpBookPrices || tmpBookPrices.length === 0)
			{
				continue;
			}

			// Find active price for sale date
			let tmpActivePrice = null;
			for (let p = 0; p < tmpBookPrices.length; p++)
			{
				if (tmpBookPrices[p].StartDate <= tmpSaleDateShort && tmpBookPrices[p].EndDate >= tmpSaleDateShort)
				{
					tmpActivePrice = tmpBookPrices[p];
					break;
				}
			}
			if (!tmpActivePrice)
			{
				tmpActivePrice = tmpBookPrices[tmpBookPrices.length - 1];
			}

			let tmpQty = weightedPick([1, 2, 3], [75, 20, 5]);
			let tmpUnitPrice = tmpActivePrice.Price;
			let tmpLineTotal = Math.round(tmpQty * tmpUnitPrice * 100) / 100;
			tmpSaleTotal += tmpLineTotal;

			tmpRecords.push({
				IDBookStoreSaleItem: tmpItemID,
				GUIDBookStoreSaleItem: guid(),
				CreateDate: tmpSale.SaleDate,
				CreatingIDUser: tmpSale.IDUser,
				UpdateDate: tmpSale.SaleDate,
				UpdatingIDUser: tmpSale.IDUser,
				Deleted: 0,
				DeleteDate: '',
				DeletingIDUser: 0,
				Quantity: tmpQty,
				UnitPrice: tmpUnitPrice,
				LineTotal: tmpLineTotal,
				IDBookStoreSale: tmpSale.IDBookStoreSale,
				IDBook: tmpBookID,
				IDBookPrice: tmpActivePrice.IDBookPrice,
				IDCustomer: 1
			});
			tmpItemID++;
		}

		// Update sale total
		tmpSaleTotals[tmpSale.IDBookStoreSale] = Math.round(tmpSaleTotal * 100) / 100;
	}

	let tmpColumns = ['IDBookStoreSaleItem','GUIDBookStoreSaleItem','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','Quantity','UnitPrice','LineTotal',
		'IDBookStoreSale','IDBook','IDBookPrice','IDCustomer'];

	// Generate UPDATE statements for sale totals
	let tmpUpdateSQL = '\n-- Update BookStoreSale totals\n';
	let tmpSaleIDs = Object.keys(tmpSaleTotals);
	// Batch updates in groups of 500 using CASE/WHEN
	for (let i = 0; i < tmpSaleIDs.length; i += 500)
	{
		let tmpChunk = tmpSaleIDs.slice(i, i + 500);
		let tmpCaseLines = tmpChunk.map((pID) => `WHEN ${pID} THEN ${tmpSaleTotals[pID]}`);
		let tmpIDList = tmpChunk.join(',');
		tmpUpdateSQL += `UPDATE BookStoreSale SET TotalAmount = CASE IDBookStoreSale\n\t${tmpCaseLines.join('\n\t')}\n\tEND\nWHERE IDBookStoreSale IN (${tmpIDList});\n`;
	}

	return { records: tmpRecords, sql: `-- BookStoreSaleItems (${tmpRecords.length} records)\n` + batchInsert('BookStoreSaleItem', tmpColumns, tmpRecords) + tmpUpdateSQL };
}

function generateReviews(pUsers)
{
	console.log('  Generating reviews...');
	let tmpRecords = [];

	for (let i = 0; i < REVIEW_COUNT; i++)
	{
		let tmpID = REVIEW_ID_START + i;
		let tmpUser = pick(pUsers);
		let tmpBookID = randomInt(1, EXISTING_BOOK_COUNT);
		let tmpRating = weightedPick([1, 2, 3, 4, 5], [5, 10, 20, 35, 30]);
		let tmpDate = formatDate(randomDate('2021-01-01', '2024-12-31'));

		// Assemble review text from fragments
		let tmpText = pick(REVIEW_OPENERS) + ' ' + pick(REVIEW_MIDDLES) + ' ' + pick(REVIEW_CLOSERS);
		// Occasionally add a second middle section for longer reviews
		if (_random() < 0.4)
		{
			tmpText = pick(REVIEW_OPENERS) + ' ' + pick(REVIEW_MIDDLES) + ' ' + pick(REVIEW_MIDDLES) + ' ' + pick(REVIEW_CLOSERS);
		}

		tmpRecords.push({
			IDReview: tmpID,
			GUIDReview: guid(),
			CreateDate: tmpDate,
			CreatingIDUser: tmpUser.IDUser,
			UpdateDate: tmpDate,
			UpdatingIDUser: tmpUser.IDUser,
			Deleted: 0,
			DeleteDate: '',
			DeletingIDUser: 0,
			Text: tmpText,
			Rating: tmpRating,
			IDBook: tmpBookID,
			IDUser: tmpUser.IDUser,
			IDCustomer: 1
		});
	}

	let tmpColumns = ['IDReview','GUIDReview','CreateDate','CreatingIDUser','UpdateDate','UpdatingIDUser',
		'Deleted','DeleteDate','DeletingIDUser','Text','Rating','IDBook','IDUser','IDCustomer'];

	return { records: tmpRecords, sql: `-- Reviews (${tmpRecords.length} records)\n` + batchInsert('Review', tmpColumns, tmpRecords) };
}

// ============================================================
// Main
// ============================================================
function main()
{
	console.log(`Generating bookstore data with seed ${SEED}...`);
	let tmpStartTime = Date.now();

	let tmpSQL = [];
	tmpSQL.push(`-- ============================================================`);
	tmpSQL.push(`-- Generated Bookstore Seed Data`);
	tmpSQL.push(`-- Seed: ${SEED}`);
	tmpSQL.push(`-- Generated: ${new Date().toISOString()}`);
	tmpSQL.push(`-- ============================================================`);
	tmpSQL.push('');

	// Phase 1: Users
	let tmpUsers = generateUsers();
	tmpSQL.push(tmpUsers.sql);
	tmpSQL.push('');

	// Phase 2: BookStores
	let tmpStores = generateBookStores();
	tmpSQL.push(tmpStores.sql);
	tmpSQL.push('');

	// Phase 3: Employees
	let tmpEmployees = generateEmployees(tmpUsers.records, tmpStores.records);
	tmpSQL.push(tmpEmployees.sql);
	tmpSQL.push('');

	// Phase 4: BookPrices
	let tmpPrices = generateBookPrices();
	tmpSQL.push(tmpPrices.sql);
	tmpSQL.push('');

	// Phase 5: Inventory
	let tmpInventory = generateInventory(tmpStores.records, tmpPrices.records, tmpEmployees.records);
	tmpSQL.push(tmpInventory.sql);
	tmpSQL.push('');

	// Phase 6: Sales
	let tmpSales = generateSales(tmpStores.records, tmpUsers.records);
	tmpSQL.push(tmpSales.sql);
	tmpSQL.push('');

	// Phase 7: Sale Items
	let tmpSaleItems = generateSaleItems(tmpSales.records, tmpPrices.records);
	tmpSQL.push(tmpSaleItems.sql);
	tmpSQL.push('');

	// Phase 8: Reviews
	let tmpReviews = generateReviews(tmpUsers.records);
	tmpSQL.push(tmpReviews.sql);

	// Write output
	let tmpOutput = tmpSQL.join('\n');
	libFS.writeFileSync(OUTPUT_FILE, tmpOutput, 'utf8');

	let tmpElapsed = ((Date.now() - tmpStartTime) / 1000).toFixed(1);
	let tmpSizeMB = (Buffer.byteLength(tmpOutput, 'utf8') / (1024 * 1024)).toFixed(1);

	console.log('');
	console.log('Generation complete:');
	console.log(`  Users:              ${tmpUsers.records.length}`);
	console.log(`  BookStores:         ${tmpStores.records.length}`);
	console.log(`  BookStoreEmployees: ${tmpEmployees.records.length}`);
	console.log(`  BookPrices:         ${tmpPrices.records.length}`);
	console.log(`  BookStoreInventory: ${tmpInventory.records.length}`);
	console.log(`  BookStoreSales:     ${tmpSales.records.length}`);
	console.log(`  BookStoreSaleItems: ${tmpSaleItems.records.length}`);
	console.log(`  Reviews:            ${tmpReviews.records.length}`);
	console.log('');
	console.log(`  Output: ${OUTPUT_FILE}`);
	console.log(`  Size: ${tmpSizeMB} MB`);
	console.log(`  Time: ${tmpElapsed}s`);
}

main();
