// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock AstraDB client for testing
jest.mock('../config/astradb', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  getCollection: jest.fn(),
  healthCheck: jest.fn()
}));

// Global test utilities
global.generateMockEmbedding = (dimensions) => {
  return Array.from({ length: dimensions }, () => Math.random());
};

global.generateMockSemanticEntry = () => {
  return {
    user_id: 'test-user-uuid',
    content_type: 'journal_entry',
    title: 'Test Entry',
    content: 'This is a test semantic entry for testing purposes.',
    primary_embedding: generateMockEmbedding(768),
    feature_vector: generateMockEmbedding(90),
    temporal_features: generateMockEmbedding(25),
    emotional_features: generateMockEmbedding(20),
    semantic_features: generateMockEmbedding(30),
    user_features: generateMockEmbedding(15),
    tags: ['test', 'semantic'],
    linked_entities: {
      people: ['Test Person'],
      locations: ['Test Location'],
      events: [],
      topics: ['testing']
    },
    search_metadata: {
      boost_factor: 1.0,
      recency_weight: 0.5,
      user_preference_alignment: 0.7
    }
  };
};

// Setup and teardown
beforeAll(async () => {
  console.log('Setting up tests...');
});

afterAll(async () => {
  console.log('Cleaning up tests...');
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
