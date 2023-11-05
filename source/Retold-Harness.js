const _Settings = require('./configuration-bookstore-serve-api.js');

const libFable = require('fable');

// Initialize fable
_Fable = new libFable(_Settings);

// Add the data service type and initialize it
_Fable.serviceManager.addServiceType('RetoldDataService', require('retold-data-service'));
// Initialize it with relative paths for the model from this code folder, regardless of where we run this from
let libRetoldDataService = _Fable.serviceManager.instantiateServiceProvider('RetoldDataService',
    {
        "FullMeadowSchemaPath": `${__dirname}/model/`,
		"DALMeadowSchemaPath": `${__dirname}/model/meadow/`
    });


libRetoldDataService.onAfterInitializeAsync =
    (fAfterInitializeComplete) =>
    {
        // Create a post operation behavior for the book Read singular record endpoint only
        _Fable.MeadowEndpoints.Book.controller.BehaviorInjection.setBehavior('Read-PostOperation',
            (pRequest, pRequestState, fRequestComplete) =>
            {
                // Get the join records
                _Fable.DAL.BookAuthorJoin.doReads(_Fable.DAL.BookAuthorJoin.query.addFilter('IDBook', pRequestState.Record.IDBook),
                    (pJoinReadError, pJoinReadQuery, pJoinRecords)=>
                    {
                        let tmpAuthorList = [];
                        for (let j = 0; j < pJoinRecords.length; j++)
                        {
                            tmpAuthorList.push(pJoinRecords[j].IDAuthor);
                        }
                        if (tmpAuthorList.length < 1)
                        {
                            _Fable.log.trace(`Found no authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).  What even is a book without authors?`)
                            pRequestState.Record.Authors = [];
                            return fRequestComplete();
                        }
                        else
                        {
                            _Fable.DAL.Author.doReads(_Fable.DAL.Author.query.addFilter('IDAuthor', tmpAuthorList, 'IN'),
                                (pReadsError, pReadsQuery, pAuthors)=>
                                {
                                    pRequestState.Record.Authors = pAuthors;
                                    _Fable.log.info(`Found ${pAuthors.length} authors for IDBook ${pRequestState.Record.IDBook} (${pRequestState.Record.Title}).`)
                                    return fRequestComplete();
                                });
                        }
                    });
            });

        return fAfterInitializeComplete();
    };

libRetoldDataService.initializeAsync(
    (pError) =>
    {
        if (pError)
        {
            _Fable.log.error(`Error initializing `)
        }
    });