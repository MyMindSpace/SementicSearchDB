# SementicSearchDB Service

A specialized vector database service for semantic search operations in the MyMindSpace ecosystem. This service manages multi-dimensional vector embeddings with comprehensive metadata for advanced search capabilities.

## Features

- **Multi-dimensional Vector Support**: Primary embeddings (768D) plus specialized feature vectors
- **Semantic Content Types**: journal_entry, event, person, location, topic
- **Advanced Search**: Vector similarity search with boosting and filtering
- **Comprehensive Metadata**: Linked entities, tags, and search optimization
- **Scalable Architecture**: Built on AstraDB with production-ready deployment

## Schema Overview

### Semantic Search Collection (`semantic_search`)

```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "content_type": "journal_entry | event | person | location | topic",
  "title": "string",
  "content": "text",
  "primary_embedding": [768], // Main semantic embedding
  "feature_vector": [90],     // Engineered features
  "temporal_features": [25],  // Time-based features
  "emotional_features": [20], // Emotion analysis
  "semantic_features": [30],  // Semantic analysis
  "user_features": [15],      // User-specific features
  "tags": ["semantic", "tags"],
  "linked_entities": {
    "people": ["names"],
    "locations": ["places"], 
    "events": ["event_ids"],
    "topics": ["topic_names"]
  },
  "search_metadata": {
    "boost_factor": 1.0,
    "recency_weight": 0.5,
    "user_preference_alignment": 0.5
  },
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## API Endpoints

### Entries Management

- `POST /api/semantic-search/entries` - Create new entry
- `GET /api/semantic-search/entries/:id` - Get entry by ID
- `PUT /api/semantic-search/entries/:id` - Update entry
- `DELETE /api/semantic-search/entries/:id` - Delete entry

### Search Operations

- `POST /api/semantic-search/search` - Vector similarity search
- `GET /api/semantic-search/users/:userId/entries` - Get user entries
- `GET /api/semantic-search/content-types/:type/entries` - Get by content type

### Service Management

- `GET /api/semantic-search/stats` - Service statistics
- `GET /api/semantic-search/health` - Health check

## Quick Start

### Prerequisites

- Node.js 18+
- AstraDB account and database
- Environment variables configured

### Installation

```bash
# Clone and install dependencies
cd SementicSearchDB
npm install

# Configure environment
cp .env.example .env
# Edit .env with your AstraDB credentials

# Start development server
npm run dev

# Run tests
npm test
```

### Environment Configuration

```env
# AstraDB Configuration
ASTRA_DB_APPLICATION_TOKEN=your_astra_token
ASTRA_DB_API_ENDPOINT=your_astra_endpoint

# Server Configuration  
PORT=3000
NODE_ENV=development
```

## Usage Examples

### Creating a Semantic Entry

```javascript
const entryData = {
  user_id: "user-uuid",
  content_type: "journal_entry",
  title: "My Daily Reflection",
  content: "Today I learned about semantic search...",
  primary_embedding: [...], // 768 dimensions
  feature_vector: [...],    // 90 dimensions
  temporal_features: [...], // 25 dimensions
  emotional_features: [...], // 20 dimensions
  semantic_features: [...], // 30 dimensions
  user_features: [...],     // 15 dimensions
  tags: ["learning", "reflection"],
  linked_entities: {
    topics: ["semantic-search", "ai"]
  }
};

const response = await fetch('/api/semantic-search/entries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(entryData)
});
```

### Semantic Search

```javascript
const searchQuery = {
  embedding: [...], // 768 dimensions
  user_id: "user-uuid",
  content_type: ["journal_entry", "topic"],
  limit: 10,
  similarity_threshold: 0.8,
  boost_recent: true,
  boost_preferences: true
};

const results = await fetch('/api/semantic-search/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(searchQuery)
});
```

## Vector Dimensions

- **Primary Embedding (768D)**: Main semantic representation
- **Feature Vector (90D)**: Engineered content features
- **Temporal Features (25D)**: Time-based patterns
- **Emotional Features (20D)**: Emotional analysis vectors
- **Semantic Features (30D)**: Semantic relationship vectors
- **User Features (15D)**: User-specific behavioral patterns

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t semanticsearch-db .

# Run container
docker run -p 3000:3000 --env-file .env semanticsearch-db
```

### Google Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy semanticsearch-db \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Google App Engine

```bash
# Deploy to App Engine
gcloud app deploy app.yaml
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Content Types

- **journal_entry**: Personal journal entries and reflections
- **event**: Significant events and experiences
- **person**: People and relationships
- **location**: Places and geographical contexts
- **topic**: Abstract topics and concepts

## Search Features

### Similarity Search
- Cosine similarity on primary embeddings
- Configurable similarity thresholds
- Multi-vector search capabilities

### Boosting Algorithms
- **Recency Boost**: Recent content prioritization
- **Preference Boost**: User preference alignment
- **Custom Boost Factors**: Manual boost multipliers

### Filtering Options
- Content type filtering
- User-specific filtering
- Tag-based filtering
- Linked entity filtering

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Performance Considerations

- Optimal vector dimensions for your use case
- Batch operations for bulk inserts
- Appropriate similarity thresholds
- Efficient filtering strategies
- Index optimization on frequently queried fields

## Security

- Input validation with Joi schemas
- Rate limiting recommended
- Authentication middleware ready
- Secure environment variable handling

## Integration

This service integrates with:
- MyMindSpace ecosystem services
- Vector embedding generation pipelines
- Content analysis services
- User preference systems

## Support

For issues and questions:
- Check the logs for detailed error messages
- Verify AstraDB connectivity
- Validate vector dimensions
- Review API documentation

## License

MIT License - see LICENSE file for details.
