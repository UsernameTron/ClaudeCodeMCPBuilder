/**
 * Category Mapper Service
 *
 * Maps human-readable category names to ISPN's numeric category IDs.
 * Caches the mapping for 24 hours to reduce API calls.
 */

import { parseXMLResponse, isXMLResponse } from '../utils/ispn-parser.js';
import { logger } from '../utils/logger.js';

export interface ISPNCategory {
  serviceid: string;
  servicename: string;
  categoryid: string;
  categoryname: string;
}

export interface ISPNService {
  serviceid: string;
  servicename: string;
}

/**
 * Category Mapper - Manages ISPN category/service lookups
 */
export class CategoryMapper {
  private categories: ISPNCategory[] = [];
  private services: ISPNService[] = [];
  private lastFetchTime: number = 0;
  private cacheDuration: number = 24 * 60 * 60 * 1000; // 24 hours
  private apiUrl: string;
  private authCode: string;

  constructor(apiUrl: string, authCode: string) {
    this.apiUrl = apiUrl;
    this.authCode = authCode;
  }

  /**
   * Fetch categories from ISPN API
   */
  async fetchCategories(): Promise<void> {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.set('auth', this.authCode);
      url.searchParams.set('cmd', 'listsupportcat');

      logger.info('Fetching categories from ISPN API');

      const response = await fetch(url.toString());
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (isXMLResponse(text)) {
        const parsed = parseXMLResponse(text);

        // Handle both singular and plural forms
        this.categories = parsed.categories || parsed.category || [];

        // Ensure it's an array
        if (!Array.isArray(this.categories)) {
          this.categories = [this.categories];
        }

        this.lastFetchTime = Date.now();
        logger.info({ count: this.categories.length }, 'Categories fetched successfully');
      } else {
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch categories');
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Fetch services from ISPN API
   */
  async fetchServices(): Promise<void> {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.set('auth', this.authCode);
      url.searchParams.set('cmd', 'listsupportsvc');

      logger.info('Fetching services from ISPN API');

      const response = await fetch(url.toString());
      const text = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (isXMLResponse(text)) {
        const parsed = parseXMLResponse(text);

        // Handle both singular and plural forms
        this.services = parsed.services || parsed.service || [];

        // Ensure it's an array
        if (!Array.isArray(this.services)) {
          this.services = [this.services];
        }

        logger.info({ count: this.services.length }, 'Services fetched successfully');
      } else {
        throw new Error(`Unexpected response format: ${text}`);
      }
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch services');
      throw new Error(`Failed to fetch services: ${error.message}`);
    }
  }

  /**
   * Get all categories (with caching)
   */
  async getCategories(): Promise<ISPNCategory[]> {
    const now = Date.now();

    // Check if cache is stale
    if (this.categories.length === 0 || (now - this.lastFetchTime) > this.cacheDuration) {
      await this.fetchCategories();
    }

    return this.categories;
  }

  /**
   * Get all services (with caching)
   */
  async getServices(): Promise<ISPNService[]> {
    const now = Date.now();

    // Check if cache is stale
    if (this.services.length === 0 || (now - this.lastFetchTime) > this.cacheDuration) {
      await this.fetchServices();
    }

    return this.services;
  }

  /**
   * Find category ID by name (fuzzy match)
   */
  async findCategoryId(categoryName: string): Promise<string | null> {
    const categories = await this.getCategories();
    const normalized = categoryName.toLowerCase().trim();

    // Try exact match first
    let match = categories.find(
      c => c.categoryname.toLowerCase() === normalized
    );

    // Try partial match
    if (!match) {
      match = categories.find(
        c => c.categoryname.toLowerCase().includes(normalized) ||
             normalized.includes(c.categoryname.toLowerCase())
      );
    }

    return match ? match.categoryid : null;
  }

  /**
   * Find service ID by name (fuzzy match)
   */
  async findServiceId(serviceName: string): Promise<string | null> {
    const services = await this.getServices();
    const normalized = serviceName.toLowerCase().trim();

    // Try exact match first
    let match = services.find(
      s => s.servicename.toLowerCase() === normalized
    );

    // Try partial match
    if (!match) {
      match = services.find(
        s => s.servicename.toLowerCase().includes(normalized) ||
             normalized.includes(s.servicename.toLowerCase())
      );
    }

    return match ? match.serviceid : null;
  }

  /**
   * Clear cache (force refresh on next call)
   */
  clearCache(): void {
    this.categories = [];
    this.services = [];
    this.lastFetchTime = 0;
    logger.info('Category/service cache cleared');
  }
}

/**
 * Singleton instance (will be initialized with API credentials)
 */
let categoryMapperInstance: CategoryMapper | null = null;

/**
 * Get or create CategoryMapper instance
 */
export function getCategoryMapper(apiUrl?: string, authCode?: string): CategoryMapper {
  if (!categoryMapperInstance) {
    if (!apiUrl || !authCode) {
      throw new Error('CategoryMapper not initialized. Provide apiUrl and authCode.');
    }
    categoryMapperInstance = new CategoryMapper(apiUrl, authCode);
  }
  return categoryMapperInstance;
}
