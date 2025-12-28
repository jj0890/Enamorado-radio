import { googleSheetsService } from './googleSheetsService';
import { storage } from './storage';

interface SyncConfig {
  spreadsheetId: string;
  range?: string;
  interval?: number; // minutes
}

class ResidentApplicationsSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private config: SyncConfig | null = null;

  /**
   * Start automatic sync from Google Sheets
   */
  async startAutoSync(config: SyncConfig): Promise<void> {
    this.config = config;
    
    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`🔄 Starting automatic sync from spreadsheet: ${config.spreadsheetId}`);
    console.log(`📅 Sync interval: ${config.interval || 15} minutes`);

    // Test connection first
    const connected = await googleSheetsService.testConnection(config.spreadsheetId);
    if (!connected) {
      throw new Error('Failed to connect to Google Sheets. Check your credentials and spreadsheet ID.');
    }

    // Initial sync
    await this.performSync();

    // Set up recurring sync
    const intervalMs = (config.interval || 15) * 60 * 1000; // Convert minutes to milliseconds
    this.syncInterval = setInterval(async () => {
      try {
        await this.performSync();
      } catch (error) {
        console.error('❌ Automatic sync failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Automatic sync stopped');
    }
  }

  /**
   * Manually perform a sync operation
   */
  async performSync(): Promise<{ created: number; skipped: number; total: number; errors: string[] }> {
    if (!this.config) {
      throw new Error('Sync configuration not set. Call startAutoSync first.');
    }

    console.log('🔄 Syncing resident applications from Google Sheets...');

    try {
      // Get form responses from Google Sheets
      const formResponses = await googleSheetsService.getFormResponses(
        this.config.spreadsheetId, 
        this.config.range || 'A:Z'
      );
      
      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const response of formResponses) {
        try {
          // Skip if essential fields are missing
          if (!response.name || !response.email) {
            skipped++;
            continue;
          }

          // Check if application already exists by email and timestamp
          const existingApplications = await storage.getResidentApplications({});
          const exists = existingApplications.some(app => 
            app.email === response.email && 
            app.googleFormResponseId === response.timestamp
          );
          
          if (exists) {
            skipped++;
            continue;
          }

          // Create new application
          const applicationData = {
            name: response.name,
            alias: response.alias || response.name,
            email: response.email,
            phone: response.phone,
            location: response.location,
            experience: response.experience,
            genre: response.genre,
            bio: response.bio,
            mixUrl: response.mixUrl,
            availability: response.availability,
            showConcept: response.showConcept,
            equipment: response.equipment,
            additionalInfo: response.additionalInfo,
            googleFormResponseId: response.timestamp,
          };

          await storage.createResidentApplication(applicationData);
          console.log(`✅ Created application for: ${response.name} (${response.email})`);
          created++;
        } catch (error) {
          console.error(`❌ Error processing form response for ${response.name}:`, error);
          errors.push(`Failed to process application for ${response.name || response.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const result = { 
        created, 
        skipped, 
        total: formResponses.length,
        errors
      };

      if (created > 0) {
        console.log(`✅ Sync completed: ${created} new applications created, ${skipped} skipped of ${formResponses.length} total`);
      } else {
        console.log(`ℹ️  Sync completed: No new applications found (${skipped} skipped of ${formResponses.length} total)`);
      }

      if (errors.length > 0) {
        console.error(`⚠️  Sync completed with ${errors.length} errors`);
      }

      return result;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): { active: boolean; config: SyncConfig | null; nextSync?: Date } {
    return {
      active: this.syncInterval !== null,
      config: this.config,
      nextSync: this.config && this.syncInterval ? 
        new Date(Date.now() + (this.config.interval || 15) * 60 * 1000) : 
        undefined
    };
  }

  /**
   * Sync only new responses since a specific timestamp
   */
  async syncSince(sinceTimestamp: Date): Promise<{ created: number; skipped: number; total: number; errors: string[] }> {
    if (!this.config) {
      throw new Error('Sync configuration not set. Call startAutoSync first.');
    }

    console.log(`🔄 Syncing applications since ${sinceTimestamp.toISOString()}...`);

    try {
      // Get new responses since timestamp
      const newResponses = await googleSheetsService.getNewResponses(
        this.config.spreadsheetId, 
        sinceTimestamp
      );

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const response of newResponses) {
        try {
          // Skip if essential fields are missing
          if (!response.name || !response.email) {
            skipped++;
            continue;
          }

          // Check if application already exists by email
          const existingApplications = await storage.getResidentApplications({});
          const exists = existingApplications.some(app => app.email === response.email);
          
          if (exists) {
            skipped++;
            continue;
          }

          // Create new application
          const applicationData = {
            name: response.name,
            alias: response.alias || response.name,
            email: response.email,
            phone: response.phone,
            location: response.location,
            experience: response.experience,
            genre: response.genre,
            bio: response.bio,
            mixUrl: response.mixUrl,
            availability: response.availability,
            showConcept: response.showConcept,
            equipment: response.equipment,
            additionalInfo: response.additionalInfo,
            googleFormResponseId: response.timestamp,
          };

          await storage.createResidentApplication(applicationData);
          console.log(`✅ Created application for: ${response.name} (${response.email})`);
          created++;
        } catch (error) {
          console.error(`❌ Error processing form response for ${response.name}:`, error);
          errors.push(`Failed to process application for ${response.name || response.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const result = { 
        created, 
        skipped, 
        total: newResponses.length,
        errors
      };

      console.log(`✅ Since sync completed: ${created} created, ${skipped} skipped of ${newResponses.length} total`);
      return result;
    } catch (error) {
      console.error('❌ Since sync failed:', error);
      throw error;
    }
  }
}

export const residentApplicationsSync = new ResidentApplicationsSync();