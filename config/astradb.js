const { DataAPIClient } = require('@datastax/astra-db-ts');

class AstraDBClient {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.collection;
      }

      // Validate required environment variables
      const requiredEnvVars = ['ASTRA_DB_APPLICATION_TOKEN', 'ASTRA_DB_API_ENDPOINT'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      // Initialize DataAPI client
      this.client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
      
      // Connect to database
      this.db = this.client.db(process.env.ASTRA_DB_API_ENDPOINT);
      
      // Get or create semantic_search collection
      this.collection = await this.db.collection('semantic_search');

      this.isConnected = true;
      console.log('Successfully connected to AstraDB - semantic_search collection');
      
      return this.collection;
    } catch (error) {
      console.error('Error connecting to AstraDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('Disconnected from AstraDB');
      }
    } catch (error) {
      console.error('Error disconnecting from AstraDB:', error);
      throw error;
    }
  }

  async getCollection() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.collection;
  }

  // Health check method
  async healthCheck() {
    try {
      const collection = await this.getCollection();
      
      // Simple query to test connection
      const result = await collection.findOne({}, { 
        projection: { _id: 1 } 
      });
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        database: 'semantic_search',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const astraClient = new AstraDBClient();

module.exports = astraClient;
