const astraClient = require('../config/astradb');
const { v4: uuidv4 } = require('uuid');

class SemanticSearchService {
  constructor() {
    this.collection = null;
  }

  async initialize() {
    if (!this.collection) {
      this.collection = await astraClient.getCollection();
      await this.ensureCollection();
    }
    return this.collection;
  }

  /**
   * Ensure the semantic_search collection exists, create if it doesn't
   */
  async ensureCollection() {
    try {
      // Try to get collection info by attempting a simple find operation
      await this.collection.findOne({}, { projection: { _id: 1 } });
      console.log('✅ Collection semantic_search exists');
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('Collection') || 
          error.message.includes('does not exist')) {
        console.log('📝 Creating semantic_search collection...');
        try {
          // Get the database instance to create collection
          const db = await astraClient.getDatabase();
          
          // Create collection with vector configuration
          const newCollection = await db.createCollection('semantic_search', {
            vector: {
              dimension: parseInt(process.env.DEFAULT_VECTOR_DIMENSIONS) || 1536,
              metric: 'cosine'
            }
          });
          
          console.log('✅ Collection semantic_search created successfully');
          
          // Update the collection reference
          this.collection = newCollection;
        } catch (createError) {
          console.error('❌ Failed to create collection:', createError.message);
          // If collection already exists, just get it
          if (createError.message.includes('already exists')) {
            console.log('📝 Collection already exists, getting reference...');
            const db = await astraClient.getDatabase();
            this.collection = await db.collection('semantic_search');
            console.log('✅ Collection reference updated');
          } else {
            throw new Error(`Failed to create collection: ${createError.message}`);
          }
        }
      } else {
        console.error('❌ Error checking collection:', error.message);
        throw error;
      }
    }
  }

  /**
   * Create a new semantic search entry
   */
  async createEntry(entryData) {
    try {
      await this.initialize();

      const entry = {
        _id: uuidv4(),
        ...entryData
        // Note: created_at and updated_at are now required in the request body
      };

      // Insert using vector search capability
      const result = await this.collection.insertOne(entry);
      
      return {
        success: true,
        data: {
          id: entry._id,
          ...entry
        }
      };
    } catch (error) {
      console.error('Error creating semantic search entry:', error);
      throw new Error(`Failed to create semantic search entry: ${error.message}`);
    }
  }

  /**
   * Get semantic search entry by ID
   */
  async getEntryById(id) {
    try {
      await this.initialize();

      const result = await this.collection.findOne({ _id: id });
      
      if (!result) {
        return {
          success: false,
          error: 'Semantic search entry not found'
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting semantic search entry:', error);
      throw new Error(`Failed to get semantic search entry: ${error.message}`);
    }
  }

  /**
   * Update semantic search entry - REPLACES the entire entry
   */
  async updateEntry(id, newEntryData) {
    try {
      await this.initialize();

      // First check if the entry exists
      const existingEntry = await this.collection.findOne({ _id: id });
      
      if (!existingEntry) {
        return {
          success: false,
          error: 'Semantic search entry not found'
        };
      }

      // Create completely new entry data, preserving only id and created_at
      const replacementEntry = {
        _id: id,  // Keep the same ID
        ...newEntryData,  // All new data from the request (including updated_at)
        created_at: existingEntry.created_at  // Preserve original creation time
      };

      // Replace the entire document
      const result = await this.collection.replaceOne(
        { _id: id },
        replacementEntry
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Semantic search entry not found'
        };
      }

      // Fetch and return the replaced document
      const updatedEntry = await this.collection.findOne({ _id: id });

      return {
        success: true,
        data: updatedEntry
      };
    } catch (error) {
      console.error('Error updating semantic search entry:', error);
      throw new Error(`Failed to update semantic search entry: ${error.message}`);
    }
  }

  /**
   * Delete semantic search entry
   */
  async deleteEntry(id) {
    try {
      await this.initialize();

      const result = await this.collection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: 'Semantic search entry not found'
        };
      }

      return {
        success: true,
        message: 'Semantic search entry deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting semantic search entry:', error);
      throw new Error(`Failed to delete semantic search entry: ${error.message}`);
    }
  }

  /**
   * Search entries by vector similarity
   */
  async searchSimilar(queryData) {
    try {
      await this.initialize();

      const {
        embedding,
        user_id,
        content_type,
        tags,
        limit = 10,
        similarity_threshold = 0.7,
        boost_recent = false,
        boost_preferences = false
      } = queryData;

      // Build filter criteria
      let filter = {};
      
      if (user_id) {
        filter.user_id = user_id;
      }
      
      if (content_type && content_type.length > 0) {
        filter.content_type = { $in: content_type };
      }
      
      if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
      }

      // Perform vector search
      const results = await this.collection.find(filter, {
        vector: embedding,
        limit: limit,
        includeSimilarity: true
      }).toArray();

      // Filter by similarity threshold
      const filteredResults = results.filter(result => 
        result.$similarity >= similarity_threshold
      );

      // Apply boosting if requested
      let processedResults = filteredResults;

      if (boost_recent || boost_preferences) {
        processedResults = this.applyBoosting(filteredResults, {
          boost_recent,
          boost_preferences
        });
      }

      return {
        success: true,
        data: {
          results: processedResults,
          total: processedResults.length,
          similarity_threshold,
          boost_applied: boost_recent || boost_preferences
        }
      };
    } catch (error) {
      console.error('Error searching semantic entries:', error);
      throw new Error(`Failed to search semantic entries: ${error.message}`);
    }
  }

  /**
   * Apply boosting factors to search results
   */
  applyBoosting(results, options) {
    const { boost_recent, boost_preferences } = options;
    const now = new Date();

    return results.map(result => {
      let adjustedSimilarity = result.$similarity;
      const metadata = result.search_metadata || {};

      // Apply recency boost
      if (boost_recent) {
        const createdAt = new Date(result.created_at);
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.exp(-daysSinceCreated * 0.1) * (metadata.recency_weight || 0.5);
        adjustedSimilarity += recencyBoost * 0.1;
      }

      // Apply preference alignment boost
      if (boost_preferences) {
        const preferenceBoost = (metadata.user_preference_alignment || 0.5) * 0.1;
        adjustedSimilarity += preferenceBoost;
      }

      // Apply general boost factor
      if (metadata.boost_factor && metadata.boost_factor !== 1.0) {
        adjustedSimilarity *= metadata.boost_factor;
      }

      return {
        ...result,
        $similarity: Math.min(adjustedSimilarity, 1.0), // Cap at 1.0
        $original_similarity: result.$similarity
      };
    }).sort((a, b) => b.$similarity - a.$similarity);
  }

  /**
   * Get entries by user ID with pagination
   */
  async getUserEntries(userId, options = {}) {
    try {
      await this.initialize();

      const {
        page = 1,
        limit = 10,
        content_type,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      
      let filter = { user_id: userId };
      
      if (content_type) {
        filter.content_type = content_type;
      }

      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'desc' ? -1 : 1;

      const results = await this.collection
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await this.collection.countDocuments(filter);

      return {
        success: true,
        data: {
          entries: results,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error getting user entries:', error);
      throw new Error(`Failed to get user entries: ${error.message}`);
    }
  }

  /**
   * Get entries by content type
   */
  async getEntriesByType(contentType, options = {}) {
    try {
      await this.initialize();

      const { limit = 50, user_id } = options;
      
      let filter = { content_type: contentType };
      
      if (user_id) {
        filter.user_id = user_id;
      }

      const results = await this.collection
        .find(filter)
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();

      return {
        success: true,
        data: {
          entries: results,
          content_type: contentType,
          total: results.length
        }
      };
    } catch (error) {
      console.error('Error getting entries by type:', error);
      throw new Error(`Failed to get entries by type: ${error.message}`);
    }
  }

  /**
   * Get service statistics
   */
  async getStats() {
    try {
      await this.initialize();

      const totalEntries = await this.collection.estimatedDocumentCount();
      
      // Get distribution by content type
      const typeDistribution = await this.collection.aggregate([
        {
          $group: {
            _id: '$content_type',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentEntries = await this.collection.countDocuments({
        created_at: { $gte: sevenDaysAgo.toISOString() }
      });

      return {
        success: true,
        data: {
          total_entries: totalEntries,
          recent_entries: recentEntries,
          content_type_distribution: typeDistribution,
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting service stats:', error);
      throw new Error(`Failed to get service stats: ${error.message}`);
    }
  }
}

module.exports = new SemanticSearchService();
