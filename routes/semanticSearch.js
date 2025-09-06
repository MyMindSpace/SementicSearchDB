const express = require('express');
const router = express.Router();
const semanticSearchService = require('../services/semanticSearchService');
const { validate, schemas } = require('../middleware/validation');

/**
 * @route   POST /api/semantic-search/entries
 * @desc    Create a new semantic search entry
 * @access  Public
 */
router.post('/entries', validate(schemas.createSemanticSearch), async (req, res, next) => {
  try {
    const result = await semanticSearchService.createEntry(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Semantic search entry created successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/semantic-search/entries/:id
 * @desc    Get semantic search entry by ID
 * @access  Public
 */
router.get('/entries/:id', validate(schemas.paramsId, 'params'), async (req, res, next) => {
  try {
    const result = await semanticSearchService.getEntryById(req.params.id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/semantic-search/entries/:id
 * @desc    Update semantic search entry (complete replacement)
 * @access  Public
 */
router.put('/entries/:id', 
  validate(schemas.paramsId, 'params'),
  validate(schemas.updateSemanticSearch),
  async (req, res, next) => {
    try {
      const result = await semanticSearchService.updateEntry(req.params.id, req.body);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Semantic search entry replaced successfully',
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/semantic-search/entries/:id
 * @desc    Partially update semantic search entry
 * @access  Public
 */
router.patch('/entries/:id', 
  validate(schemas.paramsId, 'params'),
  validate(schemas.partialUpdateSemanticSearch),
  async (req, res, next) => {
    try {
      // For now, return not implemented since we only have complete replacement
      return res.status(501).json({
        success: false,
        error: 'Partial updates (PATCH) not implemented. Use PUT for complete replacement.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/semantic-search/entries/:id
 * @desc    Delete semantic search entry
 * @access  Public
 */
router.delete('/entries/:id', validate(schemas.paramsId, 'params'), async (req, res, next) => {
  try {
    const result = await semanticSearchService.deleteEntry(req.params.id);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/semantic-search/search
 * @desc    Search entries by vector similarity
 * @access  Public
 */
router.post('/search', validate(schemas.searchQuery), async (req, res, next) => {
  try {
    const result = await semanticSearchService.searchSimilar(req.body);
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/semantic-search/users/:userId/entries
 * @desc    Get all entries for a specific user
 * @access  Public
 */
router.get('/users/:userId/entries', validate(schemas.paramsUserId, 'params'), async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      content_type: req.query.content_type,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'desc'
    };

    const result = await semanticSearchService.getUserEntries(req.params.userId, options);
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/semantic-search/content-types/:type/entries
 * @desc    Get entries by content type
 * @access  Public
 */
router.get('/content-types/:type/entries', async (req, res, next) => {
  try {
    const { type } = req.params;
    
    // No longer restricting to specific content types since schema allows any string
    // Just validate that type is provided and not empty
    if (!type || type.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Content type parameter is required and cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    const options = {
      limit: parseInt(req.query.limit) || 50,
      user_id: req.query.user_id
    };

    const result = await semanticSearchService.getEntriesByType(type, options);
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/semantic-search/stats
 * @desc    Get service statistics
 * @access  Public
 */
router.get('/stats', async (req, res, next) => {
  try {
    const result = await semanticSearchService.getStats();
    
    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/semantic-search/health
 * @desc    Health check for semantic search service
 * @access  Public
 */
router.get('/health', async (req, res, next) => {
  try {
    const astraClient = require('../config/astradb');
    const healthStatus = await astraClient.healthCheck();
    
    const status = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(status).json({
      success: healthStatus.status === 'healthy',
      service: 'SementicSearchDB',
      database: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'SementicSearchDB',
      error: 'Health check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
