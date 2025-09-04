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
  content_type: semanticSearchSchemas.contentType,
  title: Joi.string().max(500).required(),
  content: Joi.string().max(10000).required(),
  primary_embedding: semanticSearchSchemas.primaryEmbedding,
  tags: Joi.array().items(Joi.string().max(100)).max(20).default([]),
  linked_entities: semanticSearchSchemas.linkedEntities,
  feature_vector: semanticSearchSchemas.featureVector,
  temporal_features: semanticSearchSchemas.temporalFeatures,
  emotional_features: semanticSearchSchemas.emotionalFeatures,
  semantic_features: semanticSearchSchemas.semanticFeatures,
  user_features: semanticSearchSchemas.userFeatures,
  search_metadata: semanticSearchSchemas.searchMetadata
});

// Update semantic search entry validation
const updateSemanticSearchSchema = Joi.object({
  title: Joi.string().max(500).optional(),
  content: Joi.string().max(10000).optional(),
  primary_embedding: semanticSearchSchemas.primaryEmbedding.optional(),
  tags: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  linked_entities: semanticSearchSchemas.linkedEntities.optional(),
  feature_vector: semanticSearchSchemas.featureVector.optional(),
  temporal_features: semanticSearchSchemas.temporalFeatures.optional(),
  emotional_features: semanticSearchSchemas.emotionalFeatures.optional(),
  semantic_features: semanticSearchSchemas.semanticFeatures.optional(),
  user_features: semanticSearchSchemas.userFeatures.optional(),
  search_metadata: semanticSearchSchemas.searchMetadata.optional()
}).min(1);

// Search query validation
const searchQuerySchema = Joi.object({
  embedding: semanticSearchSchemas.primaryEmbedding,
  user_id: Joi.string().uuid().optional(),
  content_type: Joi.array().items(
    Joi.string().valid('journal_entry', 'event', 'person', 'location', 'topic')
  ).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  similarity_threshold: Joi.number().min(0).max(1).default(0.7),
  boost_recent: Joi.boolean().default(false),
  boost_preferences: Joi.boolean().default(false)
});

// ID validation
const idSchema = Joi.string().uuid().required();

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
    searchQuery: searchQuerySchema,
    id: idSchema
  }
};
