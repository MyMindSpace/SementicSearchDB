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
  const now = new Date().toISOString();
  return {
    user_id: 'test-user-uuid',
    entry_id: 'test-entry-uuid',
    content_type: 'journal_entry',
    message_type: 'user_message',
    title: 'Test Entry',
    content: 'This is a test semantic entry for testing purposes.',
    session_id: 'test-session-uuid',
    conversation_context: 'Test conversation context',
    primary_embedding: generateMockEmbedding(768),
    created_at: now,
    updated_at: now,
    lightweight_embedding: generateMockEmbedding(384),
    text_length: 50,
    processing_time_ms: 125.5,
    model_version: 'test-model-v1',
    tags: ['test', 'semantic'],
    emotion_context: {
      dominant_emotion: 'joy',
      intensity: 0.8,
      emotions: {
        joy: 0.8,
        sadness: 0.1,
        anger: 0.0,
        fear: 0.1,
        surprise: 0.0,
        disgust: 0.0,
        anticipation: 0.0,
        trust: 0.0
      }
    },
    linked_entities: {
      people: ['Test Person'],
      locations: ['Test Location'],
      events: ['test-event-id'],
      topics: ['testing']
    },
    temporal_context: {
      hour_of_day: 14,
      day_of_week: 1,
      is_weekend: false
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
