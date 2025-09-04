const request = require('supertest');
const app = require('../server');
const semanticSearchService = require('../services/semanticSearchService');

// Mock the service
jest.mock('../services/semanticSearchService');

describe('SementicSearchDB API', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Use random port for testing
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'SementicSearchDB');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Semantic Search Routes', () => {
    describe('POST /api/semantic-search/entries', () => {
      test('should create a new semantic search entry', async () => {
        const mockEntry = generateMockSemanticEntry();
        const mockResponse = {
          success: true,
          data: { id: 'test-id', ...mockEntry }
        };

        semanticSearchService.createEntry.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/semantic-search/entries')
          .send(mockEntry)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Semantic search entry created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(semanticSearchService.createEntry).toHaveBeenCalledWith(mockEntry);
      });

      test('should validate required fields', async () => {
        const invalidEntry = {
          user_id: 'test-user',
          content_type: 'invalid_type'
        };

        const response = await request(app)
          .post('/api/semantic-search/entries')
          .send(invalidEntry)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toBeDefined();
      });

      test('should validate embedding dimensions', async () => {
        const entryWithInvalidEmbedding = {
          ...generateMockSemanticEntry(),
          primary_embedding: [1, 2, 3] // Wrong dimensions
        };

        const response = await request(app)
          .post('/api/semantic-search/entries')
          .send(entryWithInvalidEmbedding)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.details.some(d => 
          d.message.includes('must have exactly 768 dimensions')
        )).toBe(true);
      });
    });

    describe('GET /api/semantic-search/entries/:id', () => {
      test('should get semantic search entry by ID', async () => {
        const mockEntry = { id: 'test-id', ...generateMockSemanticEntry() };
        const mockResponse = {
          success: true,
          data: mockEntry
        };

        semanticSearchService.getEntryById.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/semantic-search/entries/test-id')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockEntry);
        expect(semanticSearchService.getEntryById).toHaveBeenCalledWith('test-id');
      });

      test('should return 404 for non-existent entry', async () => {
        const mockResponse = {
          success: false,
          error: 'Semantic search entry not found'
        };

        semanticSearchService.getEntryById.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/semantic-search/entries/non-existent-id')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Semantic search entry not found');
      });
    });

    describe('PUT /api/semantic-search/entries/:id', () => {
      test('should update semantic search entry', async () => {
        const updateData = {
          title: 'Updated Title',
          tags: ['updated', 'tags']
        };
        const mockResponse = {
          success: true,
          data: { id: 'test-id', ...updateData }
        };

        semanticSearchService.updateEntry.mockResolvedValue(mockResponse);

        const response = await request(app)
          .put('/api/semantic-search/entries/test-id')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Semantic search entry updated successfully');
        expect(semanticSearchService.updateEntry).toHaveBeenCalledWith('test-id', updateData);
      });

      test('should validate update data', async () => {
        const invalidUpdate = {
          primary_embedding: [1, 2] // Wrong dimensions
        };

        const response = await request(app)
          .put('/api/semantic-search/entries/test-id')
          .send(invalidUpdate)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('DELETE /api/semantic-search/entries/:id', () => {
      test('should delete semantic search entry', async () => {
        const mockResponse = {
          success: true,
          message: 'Semantic search entry deleted successfully'
        };

        semanticSearchService.deleteEntry.mockResolvedValue(mockResponse);

        const response = await request(app)
          .delete('/api/semantic-search/entries/test-id')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Semantic search entry deleted successfully');
        expect(semanticSearchService.deleteEntry).toHaveBeenCalledWith('test-id');
      });
    });

    describe('POST /api/semantic-search/search', () => {
      test('should perform semantic search', async () => {
        const searchQuery = {
          embedding: generateMockEmbedding(768),
          user_id: 'test-user',
          content_type: ['journal_entry'],
          limit: 10,
          similarity_threshold: 0.8
        };

        const mockResults = {
          success: true,
          data: {
            results: [{ id: 'result-1', $similarity: 0.9 }],
            total: 1,
            similarity_threshold: 0.8
          }
        };

        semanticSearchService.searchSimilar.mockResolvedValue(mockResults);

        const response = await request(app)
          .post('/api/semantic-search/search')
          .send(searchQuery)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.results).toBeDefined();
        expect(semanticSearchService.searchSimilar).toHaveBeenCalledWith(searchQuery);
      });

      test('should validate search query', async () => {
        const invalidQuery = {
          embedding: [1, 2, 3], // Wrong dimensions
          limit: 'invalid'
        };

        const response = await request(app)
          .post('/api/semantic-search/search')
          .send(invalidQuery)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/semantic-search/users/:userId/entries', () => {
      test('should get user entries with pagination', async () => {
        const mockResponse = {
          success: true,
          data: {
            entries: [generateMockSemanticEntry()],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        };

        semanticSearchService.getUserEntries.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/semantic-search/users/test-user/entries?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.entries).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
      });
    });

    describe('GET /api/semantic-search/content-types/:type/entries', () => {
      test('should get entries by content type', async () => {
        const mockResponse = {
          success: true,
          data: {
            entries: [generateMockSemanticEntry()],
            content_type: 'journal_entry',
            total: 1
          }
        };

        semanticSearchService.getEntriesByType.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/semantic-search/content-types/journal_entry/entries')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.entries).toBeDefined();
        expect(response.body.data.content_type).toBe('journal_entry');
      });

      test('should validate content type', async () => {
        const response = await request(app)
          .get('/api/semantic-search/content-types/invalid_type/entries')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid content type');
      });
    });

    describe('GET /api/semantic-search/stats', () => {
      test('should get service statistics', async () => {
        const mockStats = {
          success: true,
          data: {
            total_entries: 100,
            recent_entries: 10,
            content_type_distribution: [
              { _id: 'journal_entry', count: 50 },
              { _id: 'topic', count: 30 }
            ]
          }
        };

        semanticSearchService.getStats.mockResolvedValue(mockStats);

        const response = await request(app)
          .get('/api/semantic-search/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.total_entries).toBeDefined();
        expect(response.body.data.content_type_distribution).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      semanticSearchService.createEntry.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/semantic-search/entries')
        .send(generateMockSemanticEntry())
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database connection failed');
    });

    test('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.error).toBe('Endpoint not found');
    });
  });

  describe('Validation Edge Cases', () => {
    test('should handle all vector dimension validations', async () => {
      const invalidEntry = {
        ...generateMockSemanticEntry(),
        feature_vector: generateMockEmbedding(50), // Wrong dimensions
        temporal_features: generateMockEmbedding(10), // Wrong dimensions
        emotional_features: generateMockEmbedding(10), // Wrong dimensions
        semantic_features: generateMockEmbedding(10), // Wrong dimensions
        user_features: generateMockEmbedding(5) // Wrong dimensions
      };

      const response = await request(app)
        .post('/api/semantic-search/entries')
        .send(invalidEntry)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    test('should validate content type enum values', async () => {
      const invalidTypes = ['invalid', 'wrong_type', 'not_allowed'];
      
      for (const invalidType of invalidTypes) {
        const entry = {
          ...generateMockSemanticEntry(),
          content_type: invalidType
        };

        const response = await request(app)
          .post('/api/semantic-search/entries')
          .send(entry)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.details.some(d => 
          d.message.includes('Content type must be one of')
        )).toBe(true);
      }
    });

    test('should validate search metadata ranges', async () => {
      const entry = {
        ...generateMockSemanticEntry(),
        search_metadata: {
          boost_factor: 15, // > 10
          recency_weight: 2, // > 1
          user_preference_alignment: -0.5 // < 0
        }
      };

      const response = await request(app)
        .post('/api/semantic-search/entries')
        .send(entry)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
