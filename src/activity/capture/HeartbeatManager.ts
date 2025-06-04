// Import necessary classes and types
import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { ActivityFacade } from '../core/ActivityFacade';
import { HeartbeatData } from '../core/Types';
import ActiveWindowWatcher from './watchers/ActiveWindowWatcher';
import InactivityWatcher from './watchers/InactivityWatcher';
// import TeamsMeetingsWatcher from './watchers/TeamsMeetingsWatcher'; // If re-enabled later

// Define a common interface for watchers (adjust methods/properties as needed)
interface Watcher {
  init(mainWindow?: BrowserWindow): Promise<void>; // Add optional mainWindow if needed by some watchers
  getHeartbeatData(): Promise<Partial<HeartbeatData>>; // Return partial data specific to the watcher
  cleanup(): void;
}

// Define options for the constructor
interface HeartbeatManagerOptions {
  activityFacade: ActivityFacade;
  mainWindow: BrowserWindow;
}

/**
 * Manages heartbeat generation and orchestrates all watchers.
 */
class HeartbeatManager extends EventEmitter {
  // ---- CLASS PROPERTY DECLARATIONS ----
  private activityFacade: ActivityFacade;
  private mainWindow: BrowserWindow;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  private shouldCheckHeartbeatTime: boolean = true; // Flag for timing logic

  // Watcher instances (typed)
  private activeWindowWatcher: ActiveWindowWatcher;
  private inactivityWatcher: InactivityWatcher;
  // private teamsMeetingsWatcher: TeamsMeetingsWatcher; // If re-enabled later

  // Array of all active watchers (typed)
  private watchers: Watcher[];

  /**
   * Initialize the HeartbeatManager
   * @param {HeartbeatManagerOptions} options - Configuration options
   */
  constructor(options: HeartbeatManagerOptions) {
    super(); // Initialize EventEmitter
    
    if (!options || !options.activityFacade || !options.mainWindow) {
      throw new Error('HeartbeatManager requires activityFacade and mainWindow in options');
    }
    
    this.activityFacade = options.activityFacade;
    this.mainWindow = options.mainWindow;

    // Initialize watcher instances
    this.activeWindowWatcher = new ActiveWindowWatcher();
    this.inactivityWatcher = new InactivityWatcher();
    // this.teamsMeetingsWatcher = new TeamsMeetingsWatcher(); // If re-enabled later

    // Store all watchers in the array (ensure they conform to Watcher interface)
    this.watchers = [
      this.activeWindowWatcher,
      this.inactivityWatcher,
      // this.teamsMeetingsWatcher, // If re-enabled later
    ];

    // Initial state setup
    this.heartbeatInterval = null;
    this.isRunning = false;
    this.isInitialized = false;
    this.shouldCheckHeartbeatTime = true;
  }

  /**
   * Initialize all watchers asynchronously.
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('HeartbeatManager watchers already initialized.');
      return;
    }

    console.log('Initializing HeartbeatManager watchers...');

    try {
      // Initialize each watcher. Use Promise.all for concurrency.
      // Note: inactivityWatcher.init now expects mainWindow based on previous code.
      // Ensure init signatures match the Watcher interface.
      await Promise.all([
          this.activeWindowWatcher.init(), // Assuming init takes no args
          this.inactivityWatcher.init(this.mainWindow), // Assuming init takes mainWindow
          // this.teamsMeetingsWatcher.init(), // If re-enabled later
      ]);

      this.isInitialized = true;
      console.log('HeartbeatManager watchers initialized successfully');
    } catch (error) {
      console.error('Error initializing HeartbeatManager watchers:', error);
      // Optional: Set isInitialized to false or handle partial initialization?
      this.isInitialized = false;
      throw error; // Rethrow to indicate initialization failure
    }
  }

  /**
   * Start the heartbeat generation process.
   */
  start(): void {
    if (this.isRunning) {
      console.log('🔄 [Heartbeat] Already running');
      return;
    }
    if (!this.isInitialized) {
      console.warn('⚠️ [Heartbeat] Cannot start: Watchers not initialized');
      return;
    }

    console.log('▶️ [Heartbeat] Starting service');
    this.isRunning = true;

    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeatTime();
    }, 1000);
    this.heartbeatInterval.unref();
  }

  /**
   * Stop the heartbeat generation process.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('⏸️ [Heartbeat] Stopping service');
    this.isRunning = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if it's time to generate a heartbeat (currently hardcoded to :15 and :45 seconds).
   */
  private checkHeartbeatTime(): void {
    if (!this.isRunning || !this.shouldCheckHeartbeatTime) {
      return;
    }

    const now = new Date();
    const seconds = now.getSeconds();

    // Trigger heartbeat generation at specific seconds
    if (seconds === 15 || seconds === 45) {
      // Temporarily disable checking to prevent double triggers within the same second
      this.shouldCheckHeartbeatTime = false;
      // Use Promise.resolve to handle async generateHeartbeat without blocking interval
      Promise.resolve(this.generateHeartbeat()).catch(err => {
           console.error("Error during async generateHeartbeat called from checkHeartbeatTime:", err);
      });

      // Re-enable check after 1 second
      setTimeout(() => {
        this.shouldCheckHeartbeatTime = true;
      }, 1000);
    }
  }

  /**
   * Collect data from all registered watchers for a heartbeat.
   * @returns {Promise<HeartbeatData>} Combined heartbeat data object.
   */
  private async collectHeartbeatData(): Promise<HeartbeatData> {
    if (!this.isInitialized) {
      console.warn('Attempted to collect heartbeat data before watchers were initialized.');
      // Return default data with required fields
      return { userActivity: 'inactive' };
    }

    try {
      // Collect data from each watcher in parallel
      // The result is an array of Partial<HeartbeatData>
      const results: Partial<HeartbeatData>[] = await Promise.all(
        this.watchers.map(watcher => watcher.getHeartbeatData())
      );

      // Merge all partial data objects into a single HeartbeatData object
      // Start with an empty object to avoid modifying the first result object
      const combinedData = Object.assign({}, ...results) as HeartbeatData;
      
      // Ensure required fields are present
      if (!combinedData.userActivity) {
        combinedData.userActivity = 'inactive';
      }
      
      return combinedData;
    } catch (error) {
      console.error('Error collecting heartbeat data from watchers:', error);
      // Return default data with required fields
      return { userActivity: 'inactive' };
    }
  }

  /**
   * Check if required permissions are granted
   * @returns {boolean} True if all permissions are okay
   */
  private async checkPermissions(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true; // Windows doesn't require special permissions
    }

    try {
      // We can't directly check permissions here, 
      // we'll emit an event that the main process can handle
      this.emit('permissions-required');
      return true; // Return true as we can't know immediately
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Generate a single heartbeat by collecting data and sending it to the ActivityFacade.
   */
  private async generateHeartbeat(): Promise<void> {
    if (!this.isRunning || !this.activityFacade) {
      if (!this.isRunning) console.warn("⚠️ [Heartbeat] Called while not running");
      if (!this.activityFacade) console.warn("⚠️ [Heartbeat] Called without activityFacade");
      return;
    }

    try {
      const heartbeatData = await this.collectHeartbeatData();

      if (Object.keys(heartbeatData).length === 0) {
        console.warn("⚠️ [Heartbeat] No data collected from watchers");
        return;
      }

      console.log('💓 [Heartbeat] Generated:', JSON.stringify(heartbeatData, null, 2));
      await this.activityFacade.addHeartbeat(heartbeatData);
      this.emit('heartbeat', heartbeatData); // Emit event for subscribers
    } catch (error) {
      console.error('❌ [Heartbeat] Error:', error);
    }
  }

  /**
   * Clean up resources: stop the interval and clean up each watcher.
   */
  cleanup(): void {
    console.log('🧹 [Heartbeat] Cleaning up resources');
    this.stop();

    console.log('🧹 [Heartbeat] Cleaning up watchers');
    this.watchers.forEach((watcher: Watcher) => {
      try {
        if (typeof watcher.cleanup === 'function') {
          watcher.cleanup();
        }
      } catch (error) {
        const watcherName = watcher.constructor?.name || 'UnknownWatcher';
        console.error(`❌ [Heartbeat] Error cleaning up ${watcherName}:`, error);
      }
    });

    this.isInitialized = false;
    console.log('✨ [Heartbeat] Cleanup complete');
  }
}

// Export the class using ES module syntax
export default HeartbeatManager; 