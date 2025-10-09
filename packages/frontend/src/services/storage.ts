import type { FrontendSDK } from "../types";
import type { Finding } from "../types";

/**
 * JWT Analyzer Storage Service
 * Centralized storage management using Caido SDK storage
 */
export class JWTStorageService {
  private sdk: FrontendSDK;

  constructor(sdk: FrontendSDK) {
    this.sdk = sdk;
  }

  /**
   * Get current storage data
   */
  private getStorage(): any {
    try {
      return this.sdk.storage.get() || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Save storage data
   */
  private async saveStorage(data: any): Promise<void> {
    try {
      await this.sdk.storage.set(data);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Get JWT findings from storage
   */
  getFindings(): Finding[] {
    try {
      const storage = this.getStorage();
      return storage.jwtFindings || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save JWT findings to storage
   */
  async saveFindings(findings: Finding[]): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.jwtFindings = findings;
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Clear JWT findings from storage
   */
  async clearFindings(): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.jwtFindings = [];
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Get JWT editor keys from storage
   */
  getJWTKeys(): Array<{name: string, value: string}> {
    try {
      const storage = this.getStorage();
      return storage.jwtKeys || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save JWT editor keys to storage
   */
  async saveJWTKeys(keys: Array<{name: string, value: string}>): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.jwtKeys = keys;
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Get JWT weak secrets from storage
   */
  getWeakSecrets(): string[] {
    try {
      const storage = this.getStorage();
      return storage.jwtWeakSecrets || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save JWT weak secrets to storage
   */
  async saveWeakSecrets(secrets: string[]): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.jwtWeakSecrets = secrets;
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Get token details tabs from storage
   */
  getTokenDetailsTabs(): any[] {
    try {
      const storage = this.getStorage();
      return storage.jwtTokenTabs || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save token details tabs to storage
   */
  async saveTokenDetailsTabs(tabs: any[]): Promise<void> {
    try {
      const storage = this.getStorage();
      storage.jwtTokenTabs = tabs;
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Clear all JWT Analyzer data from storage
   */
  async clearAllData(): Promise<void> {
    try {
      const storage = this.getStorage();
      // Remove all JWT-related data
      delete storage.jwtFindings;
      delete storage.jwtKeys;
      delete storage.jwtWeakSecrets;
      delete storage.jwtTokenTabs;
      delete storage.editorState;
      await this.saveStorage(storage);
    } catch (error) {
      // Silently handle storage errors
    }
  }

  /**
   * Save editor state to storage
   */
  async saveEditorState(editorState: any): Promise<void> {
    try {
      const currentStorage = this.getStorage();
      currentStorage.editorState = editorState;
      await this.saveStorage(currentStorage);
    } catch (error) {
      console.error('Error saving editor state:', error);
    }
  }

  /**
   * Get editor state from storage
   */
  getEditorState(): any {
    try {
      const storage = this.getStorage();
      return storage.editorState || null;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create and export singleton instance
 */
let storageServiceInstance: JWTStorageService | null = null;

export function createJWTStorageService(sdk: FrontendSDK): JWTStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new JWTStorageService(sdk);
  }
  return storageServiceInstance;
}

export { storageServiceInstance as jwtStorageService };
