const Joi = require('joi');

// Define validation schemas for semantic search
const semanticSearchSchemas = {
  // Primary embedding validation (768 dimensions)
  primaryEmbedding: Joi.array()
    .items(Joi.number().required())
    .length(768)
    .required()
    .messages({
      'array.length': 'Primary embedding must have exactly 768 dimensions',
      'array.base': 'Primary embedding must be an array of numbers'
    }),

  // Feature vector validation (90 dimensions)
  featureVector: Joi.array()
    .items(Joi.number().required())
    .length(90)
    .required()
    .messages({
      'array.length': 'Feature vector must have exactly 90 dimensions',
      'array.base': 'Feature vector must be an array of numbers'
    }),

  // Temporal features validation (25 dimensions)
  temporalFeatures: Joi.array()
    .items(Joi.number().required())
    .length(25)
    .required()
    .messages({
      'array.length': 'Temporal features must have exactly 25 dimensions',
      'array.base': 'Temporal features must be an array of numbers'
    }),

  // Emotional features validation (20 dimensions)
  emotionalFeatures: Joi.array()
    .items(Joi.number().required())
    .length(20)
    .required()
    .messages({
      'array.length': 'Emotional features must have exactly 20 dimensions',
      'array.base': 'Emotional features must be an array of numbers'
    }),

  // Semantic features validation (30 dimensions)
  semanticFeatures: Joi.array()
    .items(Joi.number().required())
    .length(30)
    .required()
    .messages({
      'array.length': 'Semantic features must have exactly 30 dimensions',
      'array.base': 'Semantic features must be an array of numbers'
    }),

  // User features validation (15 dimensions)
  userFeatures: Joi.array()
    .items(Joi.number().required())
    .length(15)
    .required()
    .messages({
      'array.length': 'User features must have exactly 15 dimensions',
      'array.base': 'User features must be an array of numbers'
    }),

  // Content type validation
  contentType: Joi.string()
    .valid('journal_entry', 'event', 'person', 'location', 'topic')
    .required()
    .messages({
      'any.only': 'Content type must be one of: journal_entry, event, person, location, topic'
    }),

  // Linked entities validation
  linkedEntities: Joi.object({
    people: Joi.array().items(Joi.string()).default([]),
    locations: Joi.array().items(Joi.string()).default([]),
    events: Joi.array().items(Joi.string()).default([]),
    topics: Joi.array().items(Joi.string()).default([])
  }).default({}),

  // Search metadata validation
  searchMetadata: Joi.object({
    boost_factor: Joi.number().min(0).max(10).default(1.0),
    recency_weight: Joi.number().min(0).max(1).default(0.5),
    user_preference_alignment: Joi.number().min(0).max(1).default(0.5)
  }).default({})
};

// Create semantic search entry validation
const createSemanticSearchSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  entry_id: Joi.string().uuid().required(),
  content_type: Joi.string().max(10000).required(),
  message_type: Joi.string().optional(),
  title: Joi.string().max(1000).required(),
  content: Joi.string().required(),
  session_id: Joi.string().uuid().required(),
  conversation_context: Joi.string().max(1000).optional(),
  primary_embedding: Joi.array().items(Joi.number().required()).length(768).required(),
  created_at: Joi.string().required(),
  updated_at: Joi.string().required(),
  lightweight_embedding: Joi.array().items(Joi.number().required()).length(384).optional(),
  text_length: Joi.number().integer().min(0).optional(),
  processing_time_ms: Joi.number().min(0).optional(),
  model_version: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).required(),
  emotion_context: Joi.object({
    dominant_emotion: Joi.string().optional(),
    intensity: Joi.number().min(0).max(1).optional(),
    emotions: Joi.object({
      joy: Joi.number().min(0).max(1).optional(),
      sadness: Joi.number().min(0).max(1).optional(),
      anger: Joi.number().min(0).max(1).optional(),
      fear: Joi.number().min(0).max(1).optional(),
      surprise: Joi.number().min(0).max(1).optional(),
      disgust: Joi.number().min(0).max(1).optional(),
      anticipation: Joi.number().min(0).max(1).optional(),
      trust: Joi.number().min(0).max(1).optional()
    }).optional()
  }).optional(),
  linked_entities: Joi.object({
    people: Joi.array().items(Joi.string()).required(),
    locations: Joi.array().items(Joi.string()).required(),
    events: Joi.array().items(Joi.string()).required(),
    topics: Joi.array().items(Joi.string()).required()
  }).required(),
  temporal_context: Joi.object({
    hour_of_day: Joi.number().integer().min(0).max(23).optional(),
    day_of_week: Joi.number().integer().min(0).max(6).optional(),
    is_weekend: Joi.boolean().optional()
  }).optional(),
  search_metadata: Joi.object({
    boost_factor: Joi.number().min(0).required(),
    recency_weight: Joi.number().min(0).required(),
    user_preference_alignment: Joi.number().min(0).required()
  }).optional()
});

// Update semantic search entry validation - now requires ALL fields like create (complete replacement)
const updateSemanticSearchSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  entry_id: Joi.string().uuid().required(),
  content_type: Joi.string().max(10000).required(),
  message_type: Joi.string().optional(),
  title: Joi.string().max(1000).required(),
  content: Joi.string().required(),
  session_id: Joi.string().uuid().required(),
  conversation_context: Joi.string().max(1000).optional(),
  primary_embedding: Joi.array().items(Joi.number().required()).length(768).required(),
  created_at: Joi.string().required(),
  updated_at: Joi.string().required(),
  lightweight_embedding: Joi.array().items(Joi.number().required()).length(384).optional(),
  text_length: Joi.number().integer().min(0).optional(),
  processing_time_ms: Joi.number().min(0).optional(),
  model_version: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).required(),
  emotion_context: Joi.object({
    dominant_emotion: Joi.string().optional(),
    intensity: Joi.number().min(0).max(1).optional(),
    emotions: Joi.object({
      joy: Joi.number().min(0).max(1).optional(),
      sadness: Joi.number().min(0).max(1).optional(),
      anger: Joi.number().min(0).max(1).optional(),
      fear: Joi.number().min(0).max(1).optional(),
      surprise: Joi.number().min(0).max(1).optional(),
      disgust: Joi.number().min(0).max(1).optional(),
      anticipation: Joi.number().min(0).max(1).optional(),
      trust: Joi.number().min(0).max(1).optional()
    }).optional()
  }).optional(),
  linked_entities: Joi.object({
    people: Joi.array().items(Joi.string()).required(),
    locations: Joi.array().items(Joi.string()).required(),
    events: Joi.array().items(Joi.string()).required(),
    topics: Joi.array().items(Joi.string()).required()
  }).required(),
  temporal_context: Joi.object({
    hour_of_day: Joi.number().integer().min(0).max(23).optional(),
    day_of_week: Joi.number().integer().min(0).max(6).optional(),
    is_weekend: Joi.boolean().optional()
  }).optional(),
  search_metadata: Joi.object({
    boost_factor: Joi.number().min(0).required(),
    recency_weight: Joi.number().min(0).required(),
    user_preference_alignment: Joi.number().min(0).required()
  }).optional()
});

// Partial update semantic search entry validation (for PATCH operations)
const partialUpdateSemanticSearchSchema = Joi.object({
  user_id: Joi.string().uuid().optional(),
  entry_id: Joi.string().uuid().optional(),
  content_type: Joi.string().max(10000).optional(),
  message_type: Joi.string().optional(),
  title: Joi.string().max(1000).optional(),
  content: Joi.string().optional(),
  session_id: Joi.string().uuid().optional(),
  conversation_context: Joi.string().max(1000).optional(),
  primary_embedding: Joi.array().items(Joi.number().required()).length(768).optional(),
  lightweight_embedding: Joi.array().items(Joi.number().required()).length(384).optional(),
  text_length: Joi.number().integer().min(0).optional(),
  processing_time_ms: Joi.number().min(0).optional(),
  model_version: Joi.string().optional(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  emotion_context: Joi.object({
    dominant_emotion: Joi.string().optional(),
    intensity: Joi.number().min(0).max(1).optional(),
    emotions: Joi.object({
      joy: Joi.number().min(0).max(1).optional(),
      sadness: Joi.number().min(0).max(1).optional(),
      anger: Joi.number().min(0).max(1).optional(),
      fear: Joi.number().min(0).max(1).optional(),
      surprise: Joi.number().min(0).max(1).optional(),
      disgust: Joi.number().min(0).max(1).optional(),
      anticipation: Joi.number().min(0).max(1).optional(),
      trust: Joi.number().min(0).max(1).optional()
    }).optional()
  }).optional(),
  linked_entities: Joi.object({
    people: Joi.array().items(Joi.string()).optional(),
    locations: Joi.array().items(Joi.string()).optional(),
    events: Joi.array().items(Joi.string()).optional(),
    topics: Joi.array().items(Joi.string()).optional()
  }).optional(),
  temporal_context: Joi.object({
    hour_of_day: Joi.number().integer().min(0).max(23).optional(),
    day_of_week: Joi.number().integer().min(0).max(6).optional(),
    is_weekend: Joi.boolean().optional()
  }).optional(),
  search_metadata: Joi.object({
    boost_factor: Joi.number().min(0).optional(),
    recency_weight: Joi.number().min(0).optional(),
    user_preference_alignment: Joi.number().min(0).optional()
  }).optional()
});

// Search query validation
const searchQuerySchema = Joi.object({
  embedding: semanticSearchSchemas.primaryEmbedding,
  user_id: Joi.string().uuid().optional(),
  content_type: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  similarity_threshold: Joi.number().min(0).max(1).default(0.7),
  boost_recent: Joi.boolean().default(false),
  boost_preferences: Joi.boolean().default(false)
});

// ID validation
const idSchema = Joi.string().uuid().required();

// Params validation for routes with ID
const paramsIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Params validation for routes with userId
const paramsUserIdSchema = Joi.object({
  userId: Joi.string().uuid().required()
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details,
        timestamp: new Date().toISOString()
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  validate,
  schemas: {
    createSemanticSearch: createSemanticSearchSchema,
    updateSemanticSearch: updateSemanticSearchSchema,
    partialUpdateSemanticSearch: partialUpdateSemanticSearchSchema,
    searchQuery: searchQuerySchema,
    id: idSchema,
    paramsId: paramsIdSchema,
    paramsUserId: paramsUserIdSchema
  }
};
