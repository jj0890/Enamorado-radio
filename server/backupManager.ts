import fs from 'fs/promises';
import path from 'path';

export interface BackupInfo {
  id: string;
  timestamp: string; // ISO string for consistent serialization
  size: number;
  reason: string;
  fileCount: number;
}

export class BackupManager {
  private dataDir = './data';
  private backupDir = './backups';
  private backupIndexFile = path.join(this.backupDir, 'backup-index.json');
  
  constructor() {
    this.ensureBackupDir();
  }

  private async ensureBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }
  }

  /**
   * Create a backup of all data files before destructive operations
   */
  async createBackup(reason: string = 'Manual backup'): Promise<BackupInfo> {
    await this.ensureBackupDir();
    
    const timestamp = new Date();
    const backupId = `backup-${timestamp.toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(this.backupDir, backupId);
    
    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });
      
      // Get all data files
      const dataFiles = await this.getDataFiles();
      let totalSize = 0;
      let fileCount = 0;
      
      // Copy each data file to backup directory
      for (const file of dataFiles) {
        try {
          const sourcePath = path.join(this.dataDir, file);
          const destPath = path.join(backupPath, file);
          
          const data = await fs.readFile(sourcePath);
          await fs.writeFile(destPath, data);
          
          totalSize += data.length;
          fileCount++;
        } catch (error) {
          console.warn(`Warning: Could not backup ${file}:`, error);
        }
      }
      
      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp: timestamp.toISOString(), // Convert to ISO string
        size: totalSize,
        reason,
        fileCount
      };
      
      // Update backup index
      await this.updateBackupIndex(backupInfo);
      
      console.log(`✅ Backup created: ${backupId} (${fileCount} files, ${(totalSize / 1024).toFixed(1)}KB)`);
      return backupInfo;
      
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  /**
   * Get list of all data files that should be backed up
   */
  private async getDataFiles(): Promise<string[]> {
    const standardFiles = [
      'episodes.json',
      'guides.json',
      'mixSubmissions.json',
      'scheduleItems.json',
      'songSubmissions.json',
      'admins.json',
      'currentPlayback.json',
      'nextId.json'
    ];
    
    // Check which files actually exist
    const existingFiles: string[] = [];
    for (const file of standardFiles) {
      try {
        await fs.access(path.join(this.dataDir, file));
        existingFiles.push(file);
      } catch (error) {
        // File doesn't exist, skip it
      }
    }
    
    return existingFiles;
  }

  /**
   * Update the backup index with new backup info
   */
  private async updateBackupIndex(backupInfo: BackupInfo) {
    try {
      let index: BackupInfo[] = [];
      
      // Load existing index
      try {
        const indexData = await fs.readFile(this.backupIndexFile, 'utf8');
        index = JSON.parse(indexData);
        console.log(`📋 Loaded existing backup index with ${index.length} backups`);
      } catch (error) {
        console.log('📋 No existing backup index found, starting fresh');
      }
      
      // Add new backup and keep only last 20 backups
      index.push(backupInfo);
      index = index.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
      
      // Save updated index
      console.log(`📋 Saving backup index to: ${this.backupIndexFile}`);
      await fs.writeFile(this.backupIndexFile, JSON.stringify(index, null, 2));
      console.log(`📋 Backup index saved with ${index.length} backups`);
      
      // Clean up old backup directories beyond the 20 we keep
      await this.cleanupOldBackups(index);
      
    } catch (error) {
      console.error('❌ Error updating backup index:', error);
      throw error; // Don't swallow the error - let it bubble up
    }
  }

  /**
   * Clean up backup directories that are not in the current index
   */
  private async cleanupOldBackups(currentIndex: BackupInfo[]) {
    try {
      const backupDirs = await fs.readdir(this.backupDir);
      const indexIds = new Set(currentIndex.map(b => b.id));
      
      for (const item of backupDirs) {
        // Only clean up directories that start with 'backup-' and are not in the index
        // Skip the backup-index.json file and any other files
        if (item.startsWith('backup-') && !item.endsWith('.json') && !indexIds.has(item)) {
          const dirPath = path.join(this.backupDir, item);
          try {
            // Verify it's actually a directory before attempting to delete
            const stats = await fs.stat(dirPath);
            if (stats.isDirectory()) {
              await fs.rm(dirPath, { recursive: true });
              console.log(`🗑️ Cleaned up old backup directory: ${item}`);
            }
          } catch (error) {
            console.warn(`Could not remove old backup ${item}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Get list of available backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    try {
      console.log(`📋 Reading backup index from: ${this.backupIndexFile}`);
      const indexData = await fs.readFile(this.backupIndexFile, 'utf8');
      const backups = JSON.parse(indexData);
      console.log(`📋 Found ${backups.length} backups in index`);
      return backups;
    } catch (error) {
      console.log('📋 No backup index found, returning empty array:', (error as Error).message);
      return [];
    }
  }

  /**
   * Validate backup ID to prevent path traversal attacks
   */
  private validateBackupId(backupId: string): boolean {
    // Strict pattern: backup-YYYY-MM-DDTHH-MM-SS-sssZ
    const backupPattern = /^backup-\d{4}-\d{2}-\d{2}T[\d-]+Z$/;
    return backupPattern.test(backupId);
  }

  /**
   * Restore from a specific backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    // Security: validate backup ID to prevent path traversal
    if (!this.validateBackupId(backupId)) {
      throw new Error('Invalid backup ID format');
    }
    
    const backupPath = path.join(this.backupDir, backupId);
    
    // Security: ensure resolved path is within backups directory
    const resolvedBackupPath = path.resolve(backupPath);
    const resolvedBackupDir = path.resolve(this.backupDir);
    if (!resolvedBackupPath.startsWith(resolvedBackupDir + path.sep)) {
      throw new Error('Invalid backup path');
    }
    
    try {
      // Verify backup exists
      await fs.access(backupPath);
      
      // Create a safety backup before restoring
      await this.createBackup(`Before restore of ${backupId}`);
      
      // Get files in backup
      const backupFiles = await fs.readdir(backupPath);
      
      // Restore each file
      for (const file of backupFiles) {
        const sourcePath = path.join(backupPath, file);
        const destPath = path.join(this.dataDir, file);
        
        const data = await fs.readFile(sourcePath);
        await fs.writeFile(destPath, data);
      }
      
      console.log(`✅ Restored backup: ${backupId} (${backupFiles.length} files)`);
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Restore failed: ${error}`);
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    // Security: validate backup ID to prevent path traversal
    if (!this.validateBackupId(backupId)) {
      throw new Error('Invalid backup ID format');
    }
    
    const backupPath = path.join(this.backupDir, backupId);
    
    // Security: ensure resolved path is within backups directory
    const resolvedBackupPath = path.resolve(backupPath);
    const resolvedBackupDir = path.resolve(this.backupDir);
    if (!resolvedBackupPath.startsWith(resolvedBackupDir + path.sep)) {
      throw new Error('Invalid backup path');
    }
    
    try {
      await fs.rm(backupPath, { recursive: true });
      
      // Update index to remove deleted backup
      const backups = await this.getBackups();
      const updatedBackups = backups.filter(b => b.id !== backupId);
      await fs.writeFile(this.backupIndexFile, JSON.stringify(updatedBackups, null, 2));
      
      console.log(`🗑️ Deleted backup: ${backupId}`);
      
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error(`Delete backup failed: ${error}`);
    }
  }
}

// Export singleton instance
export const backupManager = new BackupManager();