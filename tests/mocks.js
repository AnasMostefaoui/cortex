import { Prompt } from '../server/prompt.js';

export const mockConfig = {
    get: (key) => {
      const configs = {
        defaultModelName: 'testModel',
        models: {
          testModel: {
            url: 'https://api.example.com/testModel',
            type: 'OPENAI-COMPLETION',
          },
        },
      };
      return configs[key];
    },
    getEnv: () => ({}),
  };
  
  export const mockPathwayString = {
    model: 'testModel',
    prompt: new Prompt('User: {{text}}\nAssistant: Please help {{name}} who is {{age}} years old.'),
  };

  export const mockPathwayFunction = {
    model: 'testModel',
    prompt: () => {
        return new Prompt('User: {{text}}\nAssistant: Please help {{name}} who is {{age}} years old.')
    },
  };

  export const mockPathwayMessages = {
    model: 'testModel',
    prompt: new Prompt({
        messages: [
          { role: 'user', content: 'Translate this: {{{text}}}' },
          { role: 'assistant', content: 'Translating: {{{text}}}' },
        ],
      }),
  };

  export const mockPathwayResolverString = {
    model: {
      url: 'https://api.example.com/testModel',
      type: 'OPENAI-COMPLETION',
    },
    modelName: 'testModel',
    pathway: mockPathwayString,
    config: mockConfig,
    prompt: new Prompt('User: {{text}}\nAssistant: Please help {{name}} who is {{age}} years old.'),
  };

  export const mockPathwayResolverFunction = {
    model: {
      url: 'https://api.example.com/testModel',
      type: 'OPENAI-COMPLETION',
    },
    modelName: 'testModel',
    pathway: mockPathwayFunction,
    config: mockConfig,
    prompt: () => {
        return new Prompt('User: {{text}}\nAssistant: Please help {{name}} who is {{age}} years old.')
    }
  };

  export const mockPathwayResolverMessages = {
    model: {
      url: 'https://api.example.com/testModel',
      type: 'OPENAI-COMPLETION',
    },
    modelName: 'testModel',
    pathway: mockPathwayMessages,
    config: mockConfig,
    prompt: new Prompt({
        messages: [
          { role: 'user', content: 'Translate this: {{{text}}}' },
          { role: 'assistant', content: 'Translating: {{{text}}}' },
        ],
      }),
  };

