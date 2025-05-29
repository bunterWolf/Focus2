import activeWin, { Result as ActiveWinResult } from 'active-win';
import { HeartbeatData } from '../activity/core/Types';

interface AppWindowState {
  app: string;
  title: string;
}

/**
 * Watcher module that tracks the currently active application window.
 */
export default class ActiveWindowWatcher {
  private lastActiveWindow: AppWindowState | null = null;

  constructor() {
    // Initialization logic (if any) besides setting default null
    // this.lastActiveWindow is already initialized above
  }

  /**
   * Initialize the watcher (async for consistency with interface).
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    // Nothing specific needed for this watcher
    console.log('ActiveWindowWatcher initialized.');
    return Promise.resolve();
  }

  /**
   * Get the current active window information.
   * Caches the result in `lastActiveWindow`.
   * @returns {Promise<AppWindowState | null>} Active window information or null.
   */
  private async getActiveWindow(): Promise<AppWindowState | null> {
    try {
      // Type the result from activeWin
      const windowInfo: ActiveWinResult | undefined = await activeWin();

      // Check if activeWin returned a result
      if (!windowInfo || !windowInfo.owner || !windowInfo.title) {
        // Consider what to return/cache on failure. Null seems reasonable.
        // If we return the last known good state, it might be misleading.
        this.lastActiveWindow = null;
        return null;
      }

      // Store the relevant info
      this.lastActiveWindow = {
        app: windowInfo.owner.name,
        title: windowInfo.title,
      };

      return this.lastActiveWindow;
    } catch (error) {
      console.error('Error getting active window:', error);
      // On error, maybe return the last known state or null?
      // Returning null seems safer to avoid stale data propagation.
      this.lastActiveWindow = null; // Clear cache on error
      return null;
    }
  }

  /**
   * Retrieves information about the currently active window.
   * 
   * @returns {Promise<Partial<HeartbeatData>>} A Promise that resolves to a partial HeartbeatData object with window information
   */
  async getHeartbeatData(): Promise<Partial<HeartbeatData>> {
    const state = await this.getActiveWindow();
    
    return {
      appWindow: state ? {
        app: state.app,
        title: state.title
      } : undefined
    };
  }

  /**
   * Clean up resources used by the watcher.
   */
  cleanup(): void {
    console.log('Cleaning up ActiveWindowWatcher...');
    // Reset the cached window state
    this.lastActiveWindow = null;
  }
} 