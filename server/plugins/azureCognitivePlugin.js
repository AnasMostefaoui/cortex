// Azure Cognitive Services plugin for the server
import { callPathway } from '../../lib/pathwayTools.js';
import ModelPlugin from './modelPlugin.js';
import { v4 as uuidv4 } from 'uuid';

const TOP = 1000;

class AzureCognitivePlugin extends ModelPlugin {
    constructor(config, pathway, modelName, model) {
        super(config, pathway, modelName, model);
    }

    // Set up parameters specific to the Azure Cognitive API
    async getRequestParameters(text, parameters, prompt, mode, indexName, savedContextId,  {headers, requestId, pathway, url}) {
        const combinedParameters = { ...this.promptParameters, ...parameters };
        const { modelPromptText } = this.getCompiledPrompt(text, combinedParameters, prompt);
        const { inputVector, filter, docId } = combinedParameters;
        const data = {};

        if (mode == 'delete') {
            const searchUrl = this.ensureMode(this.requestUrl(text), 'search');
            let searchQuery = `owner:${savedContextId}`;
            
            if (docId) {
                searchQuery += ` AND docId:'${docId}'`;
            }

            const docsToDelete = JSON.parse(await this.executeRequest(searchUrl,
                { search: searchQuery,  
                    "searchMode": "all",
                    "queryType": "full",
                    select: 'id', top: TOP 
                },
                {}, headers, prompt, requestId, pathway));
        
            const value = docsToDelete.value.map(({id}) => ({
                id,
                "@search.action": "delete"
            }));
        
            return {
                data: {
                    value
                }
            };
        }

        if (mode == 'index') {
            const calculateInputVector = async () => {
                return JSON.parse(await callPathway(this.config, 'embeddings', { text }))[0];
            }

            const doc = {
                id: uuidv4(),
                content: text,
                contentVector: inputVector || (await calculateInputVector()),
                owner: savedContextId,
                docId: docId || uuidv4()
            }
            // if(!privateData){
            //     delete doc.owner;
            // }
            data.value = [doc];
            return { data };
        }

        //default mode, 'search'
        if (inputVector) {
            data.vectors = [
                {
                    "value": typeof inputVector === 'string' ? JSON.parse(inputVector) : inputVector,
                    "fields": "contentVector",
                    "k": 20
                }
            ];
        } else {
            data.search = modelPromptText;
        }

        filter && (data.filter = filter);
        if (indexName == 'indexcortex') { //if private, filter by owner via contextId //privateData && 
            data.filter && (data.filter = data.filter + ' and ');
            data.filter = `owner eq '${savedContextId}'`;
        }

        return { data };
    }

    ensureMode(url, mode) {
        const pattern = new RegExp(`indexes\/.*\/docs\/${mode}`);
        if (pattern.test(url)) {
            // if the URL is already in the correct form, return it as is
            return url;
        } else {
            // otherwise, perform the replacement
            return url.replace(/(indexes\/.*\/docs\/)([^?]+)/, `$1${mode}`);
        }
    }

    ensureIndex(url, indexName) {
        const pattern = new RegExp(`indexes\/${indexName}\/docs\/search`);
        if (pattern.test(url)) {
            // if the URL is already in the correct form, return it as is
            return url;
        } else {
            // otherwise, perform the replacement
            return url.replace(/(indexes\/)([^\/]+)/, `$1${indexName}`);
        }
    }

    // Execute the request to the Azure Cognitive API
    async execute(text, parameters, prompt, pathwayResolver) {
        const { requestId, pathway, savedContextId } = pathwayResolver;
        const mode = this.promptParameters.mode || 'search';
        let url = this.ensureMode(this.requestUrl(text), mode == 'delete' ? 'index' : mode);
        const indexName = parameters.indexName || 'indexcortex';
        url = this.ensureIndex(url, indexName);
        const headers = this.model.headers;

        const { data, params } = await this.getRequestParameters(text, parameters, prompt, mode, indexName, savedContextId, {headers, requestId, pathway, url});

        if (mode === 'delete' && data.value.length == 0){
            return; // nothing to delete
        }

        // execute the request
        const result = await this.executeRequest(url, data || {}, params || {}, headers || {}, prompt, requestId, pathway);

        // if still has more to delete
        if (mode === 'delete' && data?.value?.length == TOP) { 
            return await this.execute(text, parameters, prompt, pathwayResolver);
        }
        
        return result;
    }

    parseResponse(data) {
        return JSON.stringify(data || {});
    }

}

export default AzureCognitivePlugin;