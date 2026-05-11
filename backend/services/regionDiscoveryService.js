import { Document } from '../models/Document.js';

class RegionDiscoveryService {
  
  /**
   * Discovers which regions have documents for a specific document type
   * @param {string} docType - Type of document (e.g., 'diet', 'exercise')
   * @returns {Promise<string[]>} - Array of available regions
   */
  async getAvailableRegions(docType = 'diet_chart') {
    try {
      const allDocs = await Document.find({ doc_type: docType }).select('country');
      const regions = [...new Set(allDocs.map(doc => doc.country).filter(c => c !== null && c !== undefined))];
      return regions;
    } catch (error) {
      console.error('Error getting available regions:', error);
      return [];
    }
  }
  
  /**
   * Checks if a specific region has adequate document coverage
   * @param {string} userCountry - User's country/region
   * @param {string} docType - Type of document to check
   * @returns {Promise<Object>} - Coverage details
   */
  async checkRegionCoverage(userCountry, docType = 'diet_chart') {
    try {
      if (!userCountry) {
        return {
          hasDocuments: false,
          documentCount: 0,
          canGeneratePlan: false,
          coverage: 'none'
        };
      }

      console.log(`🔍 Checking coverage for country: "${userCountry}", docType: "${docType}"`);
      
      // Count region-specific docs
      const regionDocs = await Document.countDocuments({
        country: userCountry,
        doc_type: docType
      });
      
      // Also count Global docs as fallback
      const globalDocs = await Document.countDocuments({
        country: 'Global',
        doc_type: docType
      });
      
      const totalDocs = regionDocs + globalDocs;
      
      console.log(`📊 Found ${regionDocs} ${userCountry} docs + ${globalDocs} Global docs = ${totalDocs} total`);
      
      return {
        hasDocuments: totalDocs > 0,
        documentCount: totalDocs,
        regionSpecificCount: regionDocs,
        globalCount: globalDocs,
        canGeneratePlan: totalDocs >= 1, // Minimum 1 doc needed
        coverage: totalDocs >= 5 ? 'excellent' : totalDocs >= 2 ? 'good' : totalDocs >= 1 ? 'limited' : 'none',
        region: userCountry
      };
    } catch (error) {
      console.error('Error checking region coverage:', error);
      return {
        hasDocuments: false,
        documentCount: 0,
        canGeneratePlan: false,
        coverage: 'error'
      };
    }
  }
  
  /**
   * Gets fallback region if user's region is unavailable
   * @param {string} userCountry - User's country/region
   * @param {string} docType - Type of document to check
   * @returns {Promise<string|null>} - Fallback region or null
   */
  async getFallbackRegion(userCountry, docType = 'diet_chart') {
    try {
      // First check if user's region has documents
      const coverage = await this.checkRegionCoverage(userCountry, docType);
      if (coverage.hasDocuments) {
        return userCountry;
      }
      
      // Check for "Global" or "International" documents
      const globalOptions = ['Global', 'International', 'WHO', 'IDF'];
      
      for (const globalOption of globalOptions) {
        const globalDocs = await Document.countDocuments({
          country: globalOption,
          doc_type: docType
        });
        
        if (globalDocs > 0) {
          return globalOption;
        }
      }
      
      // If no global docs, find any available region
      const availableRegions = await this.getAvailableRegions(docType);
      if (availableRegions.length > 0) {
        return availableRegions[0]; // Return first available
      }
      
      return null; // No documents available at all
    } catch (error) {
      console.error('Error getting fallback region:', error);
      return null;
    }
  }
  
  /**
   * Gets all regions with their coverage statistics
   * @param {string} docType - Type of document to check
   * @returns {Promise<Array>} - Array of regions with stats
   */
  async getAllRegionStats(docType = 'diet_chart') {
    try {
      const regions = await this.getAvailableRegions(docType);
      
      const stats = await Promise.all(
        regions.map(async (region) => {
          const coverage = await this.checkRegionCoverage(region, docType);
          return {
            region,
            ...coverage
          };
        })
      );
      
      // Sort by document count (descending)
      return stats.sort((a, b) => b.documentCount - a.documentCount);
    } catch (error) {
      console.error('Error getting region stats:', error);
      return [];
    }
  }
}

export default new RegionDiscoveryService();
