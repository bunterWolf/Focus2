/**
 * ActivityFacade.ts
 * 
 * Diese Datei definiert die zentrale Facade-Klasse der Anwendung, die als primärer
 * Zugangspunkt für alle aktivitätsbezogenen Operationen dient. Sie wurde im Rahmen
 * einer umfassenden Refaktorierung eingeführt, um den monolithischen ActivityStore
 * durch ein modulareres Design zu ersetzen.
 * 
 * Die Facade kapselt:
 * - DateManager: Für zeitbezogene Operationen und Tageswechsel
 * - ActivityStorage: Für die Persistierung von Aktivitätsdaten
 * - AggregationService: Für die Analyse und Aggregation von Aktivitätsdaten
 * - ActivityTracker: Für das Tracking von Benutzeraktivitäten
 * - SettingsManager: Für die Verwaltung von Anwendungseinstellungen
 * 
 * Durch dieses Design wird das Single Responsibility Principle umgesetzt, während
 * die Facade eine einfache, konsistente Schnittstelle für externe Komponenten bietet.
 */

import { BrowserWindow } from 'electron';
import { ActivityStorage } from '../storage/ActivityStorage';
import { DateManager, DayChangeHandler } from '../utils/DateManager';
import { AggregationService } from '../analysis/AggregationService';
import { ActivityTracker } from '../capture/ActivityTracker';
import { SettingsManager } from '../../core/settings/SettingsManager';
import { HeartbeatData, DayData } from './Types';
import { AggregationIntervalMinutes } from '../analysis/TimelineGenerator';
import TimelineGenerator from '../analysis/TimelineGenerator';
import HeartbeatManager from '../capture/HeartbeatManager';

interface ActivityFacadeOptions {
  useMockData?: boolean;
  storagePath?: string | null;
  mainWindow?: BrowserWindow;
}

/**
 * Zentrale Fassade für alle aktivitätsbezogenen Operationen.
 * Vereinfacht die API für andere Teile der Anwendung und delegiert
 * Anfragen an die entsprechenden spezialisierten Komponenten.
 */
export class ActivityFacade {
  private dateManager: DateManager;
  private activityStorage: ActivityStorage;
  private aggregationService: AggregationService;
  private activityTracker: ActivityTracker;
  private settingsManager: SettingsManager;
  private useMockData: boolean;
  private timelineGenerator: TimelineGenerator;
  private heartbeatManager: HeartbeatManager | null = null;

  // Callback-Funktionen
  private onDataUpdate: ((dateKey: string) => void) | null = null;
  private onTrackingStatusChange: ((isTracking: boolean) => void) | null = null;

  constructor(options: ActivityFacadeOptions = {}) {
    this.useMockData = options.useMockData || false;
    
    // Initialize managers
    this.dateManager = new DateManager();
    this.settingsManager = new SettingsManager();

    // Initialize storage
    this.activityStorage = new ActivityStorage(
      { useMockData: this.useMockData },
      this.dateManager,
      this.settingsManager
    );

    // Initialize timeline generator and aggregation service
    this.timelineGenerator = new TimelineGenerator();
    this.aggregationService = new AggregationService(
      this.activityStorage,
      this.timelineGenerator
    );

    // Initialize heartbeat manager if window is provided
    if (options.mainWindow) {
      this.initializeHeartbeatManager(options.mainWindow);
    }
    
    // Initialisiere ActivityTracker
    this.activityTracker = new ActivityTracker(
      this.dateManager,
      this.activityStorage,
      this.aggregationService
    );
    
    // Führe initiale Bereinigung durch, wenn keine Mockdaten verwendet werden
    if (!this.useMockData) {
      this.cleanupOldData();
    }
  }

  private initializeHeartbeatManager(mainWindow: BrowserWindow): void {
    this.heartbeatManager = new HeartbeatManager({
      activityFacade: this,
      mainWindow
    });
    
    this.heartbeatManager.init().catch(error => {
      console.error('Failed to initialize HeartbeatManager:', error);
    });
  }

  /**
   * Setzt die Callback-Funktionen für Benachrichtigungen.
   * 
   * @param onDataUpdate Callback für Datenaktualisierungen
   * @param onTrackingStatusChange Callback für Änderungen des Tracking-Status
   */
  setCallbacks(
    onDataUpdate: (dateKey: string) => void,
    onTrackingStatusChange: (isTracking: boolean) => void
  ): void {
    this.onDataUpdate = onDataUpdate;
    this.onTrackingStatusChange = onTrackingStatusChange;
    
    // Setze die Callbacks beim ActivityTracker
    this.activityTracker.setCallbacks(
      (dateKey: string) => {
        if (this.onDataUpdate) this.onDataUpdate(dateKey);
      },
      (isTracking: boolean) => {
        if (this.onTrackingStatusChange) this.onTrackingStatusChange(isTracking);
      }
    );
  }

  // ----- Methoden vom DateManager -----
  
  startDayChangeMonitoring(dayChangeHandler?: DayChangeHandler): void {
    this.dateManager.startDayChangeMonitoring(dayChangeHandler);
  }
  
  stopDayChangeMonitoring(): void {
    this.dateManager.stopDayChangeMonitoring();
  }
  
  getDateKey(timestamp: number): string {
    return this.dateManager.getDateKey(timestamp);
  }
  
  // ----- Methoden vom ActivityTracker -----
  
  startTracking(): void {
    this.activityTracker.startTracking();
  }
  
  pauseTracking(): void {
    this.activityTracker.pauseTracking();
  }
  
  addHeartbeat(heartbeatData: HeartbeatData): void {
    this.activityTracker.addHeartbeat(heartbeatData);
  }
  
  // ----- Methoden vom ActivityStorage -----
  
  saveToDisk(): void {
    this.activityStorage.saveToDisk();
  }
  
  getDayData(dateKey?: string | null): DayData | null {
    const effectiveDateKey = dateKey || this.dateManager.getDateKey(Date.now());
    return this.aggregationService.getDayDataWithAggregation(effectiveDateKey);
  }
  
  getAvailableDates(): string[] {
    return this.activityStorage.getAvailableDates();
  }
  
  cleanupOldData(): void {
    this.activityStorage.cleanupOldData();
  }
  
  updateStoragePath(newDirPath: string | null): boolean {
    return this.activityStorage.updateStoragePath(newDirPath);
  }
  
  useExistingStoreFile(newDirPath: string): boolean {
    return this.activityStorage.useExistingStoreFile(newDirPath);
  }
  
  // ----- Methoden vom AggregationService -----
  
  getAggregationInterval(): AggregationIntervalMinutes {
    return this.aggregationService.getAggregationInterval();
  }
  
  setAggregationInterval(interval: AggregationIntervalMinutes): void {
    this.aggregationService.setAggregationInterval(interval);
    // Der ActivityStorage und ActivityTracker müssen über die 
    // Änderung informiert werden, aber die direkte Methode existiert
    // möglicherweise noch nicht - die Logik sollte in den jeweiligen
    // Komponenten implementiert werden
  }
  
  // ----- Hilfsmethoden -----
  
  getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }
  
  cleanup(): void {
    this.activityTracker.cleanup();
    this.dateManager.cleanup();
    
    if (!this.useMockData) {
      this.saveToDisk();
    }
  }
} 