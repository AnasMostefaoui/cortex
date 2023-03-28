// OpenAIChatPlugin.js
const ModelPlugin = require('./modelPlugin');
const handlebars = require("handlebars");
const { encode } = require("gpt-3-encoder");

class OpenAIChatPlugin extends ModelPlugin {
    constructor(config, pathway) {
        super(config, pathway);
    }

    // Set up parameters specific to the OpenAI Chat API
    getRequestParameters(text, parameters, prompt) {
        const { modelPromptText, modelPromptMessages, tokenLength } = this.getCompiledPrompt(text, parameters, prompt);
        const { stream } = parameters;
    
        // Define the model's max token length
        const modelMaxTokenLength = this.getModelMaxTokenLength() * this.getPromptTokenRatio();
    
        let requestMessages = modelPromptMessages || [{ "role": "user", "content": modelPromptText }];
    
        // Check if the token length exceeds the model's max token length
        if (tokenLength > modelMaxTokenLength) {
            // Remove older messages until the token length is within the model's limit
            requestMessages = this.removeMessagesUntilTarget(requestMessages, modelMaxTokenLength);
        }
    
        const requestParameters = {
        messages: requestMessages,
        temperature: this.temperature ?? 0.7,
        stream
        };
    
        return requestParameters;
    }

    // Execute the request to the OpenAI Chat API
    async execute(text, parameters, prompt) {
        const url = this.requestUrl(text);
        const requestParameters = this.getRequestParameters(text, parameters, prompt);

        const data = { ...(this.model.params || {}), ...requestParameters };
        const params = {};
        const headers = this.model.headers || {};
        return this.executeRequest(url, data, params, headers, prompt);
    }
}

module.exports = OpenAIChatPlugin;
