# SementicSearchDB Service

A specialized vector database service for semantic search operations in the MyMindSpace ecosystem. This service manages multi-dimensional vector embeddings with comprehensive metadata for advanced search capabilities.

## Features

- **Multi-dimensional Vector Support**: Primary embeddings (768D) plus specialized feature vectors
- **Semantic Content Types**: journal_entry, event, person, location, topic
- **Advanced Search**: Vector similarity search with boosting and filtering
- **Comprehensive Metadata**: Linked entities, tags, and search optimization
- **Auto-Collection Management**: Automatic collection creation with proper vector indexing
- **Complete vs Partial Updates**: REST-compliant PUT (replacement) and PATCH (partial) operations
- **Scalable Architecture**: Built on AstraDB with production-ready deployment

## Schema Overview

### Semantic Search Collection (`semantic_search`)

```json
{
  "id": "uuid",
  "user_id": "uuid (required)",
  "entry_id": "uuid (required)", 
  "content_type": "string (required, max 10000 chars)",
  "message_type": "string (optional)",
  "title": "string (required, max 1000 chars)",
  "content": "string (required)",
  "session_id": "uuid (required)",
  "conversation_context": "string (optional, max 1000 chars)",
  "primary_embedding": "[768] (required, 768-dimensional vector)",
  "lightweight_embedding": "[384] (optional, 384-dimensional vector)",
  "created_at": "string (required, ISO timestamp)",
  "updated_at": "string (required, ISO timestamp)",
  "text_length": "integer (optional, >= 0)",
  "processing_time_ms": "number (optional, >= 0)",
  "model_version": "string (optional)",
  "tags": "array[string] (required, max 20 tags, each max 100 chars)",
  "emotion_context": {
    "dominant_emotion": "string (optional)",
    "intensity": "number (optional, 0-1)",
    "emotions": {
      "joy": "number (optional, 0-1)",
      "sadness": "number (optional, 0-1)",
      "anger": "number (optional, 0-1)",
      "fear": "number (optional, 0-1)",
      "surprise": "number (optional, 0-1)",
      "disgust": "number (optional, 0-1)",
      "anticipation": "number (optional, 0-1)",
      "trust": "number (optional, 0-1)"
    }
  },
  "linked_entities": {
    "people": "array[string] (required)",
    "locations": "array[string] (required)",
    "events": "array[string] (required)",
    "topics": "array[string] (required)"
  },
  "temporal_context": {
    "hour_of_day": "integer (optional, 0-23)",
    "day_of_week": "integer (optional, 0-6)",
    "is_weekend": "boolean (optional)"
  },
  "search_metadata": {
    "boost_factor": "number (required when present, >= 0)",
    "recency_weight": "number (required when present, >= 0)",
    "user_preference_alignment": "number (required when present, >= 0)"
  }
}
```

## API Endpoints

### Entries Management

- `POST /api/semantic-search/entries` - Create new entry
- `GET /api/semantic-search/entries/:id` - Get entry by ID
- `PUT /api/semantic-search/entries/:id` - **Complete replacement** of entry (requires all fields)
- `PATCH /api/semantic-search/entries/:id` - ⚠️ **Not implemented** (returns 501)
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
  entry_id: "entry-uuid",
  content_type: "journal_entry",
  message_type: "user_message",
  title: "My Daily Reflection",
  content: "Today I learned about semantic search...",
  session_id: "session-uuid",
  conversation_context: "User discussing learning experiences",
  primary_embedding: [...], // 768 dimensions (required)
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  lightweight_embedding: [...], // 384 dimensions (optional)
  text_length: 45,
  processing_time_ms: 125.5,
  model_version: "semantic-v1",
  tags: ["learning", "reflection"],
  emotion_context: {
    dominant_emotion: "joy",
    intensity: 0.8,
    emotions: {
      joy: 0.8,
      sadness: 0.0,
      anger: 0.0,
      fear: 0.0,
      surprise: 0.2,
      disgust: 0.0,
      anticipation: 0.0,
      trust: 0.0
    }
  },
  linked_entities: {
    people: [],
    locations: [],
    events: [],
    topics: ["semantic-search", "ai"]
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
  content_type: ["journal_entry", "topic"], // No longer restricted to predefined types
  tags: ["learning", "reflection"],
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

### Complete Entry Replacement (PUT)

PUT requests perform **complete replacement** of the entire entry. All fields must be provided:

```javascript
const completeEntry = {
  user_id: "user-uuid",
  content_type: "journal_entry",
  title: "Updated Reflection",
  content: "Completely new content...",
  primary_embedding: [...], // 768 dimensions - REQUIRED
  feature_vector: [...],    // 90 dimensions - REQUIRED
  temporal_features: [...], // 25 dimensions - REQUIRED
  emotional_features: [...], // 20 dimensions - REQUIRED
  semantic_features: [...], // 30 dimensions - REQUIRED
  user_features: [...],     // 15 dimensions - REQUIRED
  tags: ["new", "tags"],
  linked_entities: { /* complete new structure */ },
  search_metadata: { /* complete new metadata */ }
};

// This will REPLACE the entire entry, preserving only _id and created_at
const response = await fetch('/api/semantic-search/entries/entry-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(completeEntry)
});
```

### Partial Entry Update (PATCH)

PATCH requests allow updating only specific fields:

```javascript
const partialUpdate = {
  title: "Updated title only",
  tags: ["updated", "tags"]
  // Only changed fields need to be included
};

const response = await fetch('/api/semantic-search/entries/entry-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(partialUpdate)
});
```

## Vector Dimensions

- **Primary Embedding (768D)**: Main semantic representation (required)
- **Lightweight Embedding (384D)**: Compact representation for faster operations (optional)

**Note**: The previous feature vectors (feature_vector, temporal_features, etc.) have been removed from the schema. The service now focuses on the primary and lightweight embeddings with rich metadata support.

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

The `content_type` field now accepts any string value, providing flexibility for different use cases:

- **journal_entry**: Personal journal entries and reflections
- **event**: Significant events and experiences  
- **person**: People and relationships
- **location**: Places and geographical contexts
- **topic**: Abstract topics and concepts
- **chat_message**: Conversational messages
- **custom_type**: Any custom content type as needed

**Note**: Content types are no longer restricted to predefined values, allowing for extensible content categorization.

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
