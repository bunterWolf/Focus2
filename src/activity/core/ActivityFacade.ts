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

import { ActivityStorage } from '../storage/ActivityStorage';
import { DateManager, DayChangeHandler } from '../utils/DateManager';
import { AggregationService } from '../analysis/AggregationService';
import { ActivityTracker } from '../capture/ActivityTracker';
import { SettingsManager } from '../../core/settings/SettingsManager';
import { HeartbeatData, DayData } from './Types';
import { AggregationIntervalMinutes } from '../analysis/TimelineGenerator';

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

  // Callback-Funktionen
  private onDataUpdate: ((dateKey: string) => void) | null = null;
  private onTrackingStatusChange: ((isTracking: boolean) => void) | null = null;

  constructor(options: { useMockData?: boolean; storagePath?: string | null } = {}) {
    this.useMockData = options.useMockData || false;
    
    // Initialisiere SettingsManager
    this.settingsManager = new SettingsManager();
    
    // Initialisiere DateManager
    this.dateManager = new DateManager();
    
    // Initialisiere ActivityStorage
    this.activityStorage = new ActivityStorage({
      useMockData: this.useMockData,
      storagePath: options.storagePath || this.settingsManager.getActivityStoreFilePath()
    }, this.dateManager, this.settingsManager);
    
    // Initialisiere AggregationService
    this.aggregationService = new AggregationService(
      this.activityStorage
    );
    
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
    return this.aggregationService.getDayDataWithAggregation(dateKey);
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
  
  /**
   * Test-Methode zum manuellen Erzeugen und Hinzufügen von Heartbeats.
   * Diese Methode ist nur für Debugging-Zwecke gedacht und sollte in Produktion nicht verwendet werden.
   */
  generateTestHeartbeats(): void {
    console.log(`[ActivityFacade] Generating test heartbeats...`);
    
    // Aktuellen Tag ermitteln
    const now = Date.now();
    const currentDateKey = this.dateManager.getDateKey(now);
    console.log(`[ActivityFacade] Generating test heartbeats for today (${currentDateKey})`);
    
    // Startherzschlag etwa vor 1 Stunde (gerundet auf die letzte halbe Stunde)
    const startTime = Math.floor((now - 60 * 60 * 1000) / (30 * 60 * 1000)) * (30 * 60 * 1000);
    
    // Erstelle Herzschläge im 15-Sekunden-Takt für eine Stunde
    for (let i = 0; i < 240; i++) {
      const timestamp = startTime + (i * 15 * 1000);
      
      // Füge Abwechslung ein: Einige inaktive Perioden
      const isInactive = i % 40 >= 30; // Alle 10 Minuten 2.5 Minuten inaktiv
      
      // Erstelle einen Heartbeat mit Fensterdaten
      const heartbeatData: HeartbeatData = {
        userActivity: isInactive ? 'inactive' : 'active',
        appWindow: !isInactive ? {
          app: ['VSCode', 'Chrome', 'Terminal', 'Slack', 'Outlook'][i % 5],
          title: `Working on ${['App', 'Document', 'Project', 'Email', 'Meeting'][i % 5]} - ${Math.floor(i/20)}`
        } : undefined
      };
      
      // Direktes Hinzufügen zum Storage
      this.activityStorage.addHeartbeat(timestamp, heartbeatData, currentDateKey);
      
      // Alle 60 Herzschläge (15 Minuten) loggen
      if (i % 60 === 0) {
        console.log(`[ActivityFacade] Added ${i} test heartbeats, current time: ${new Date(timestamp).toISOString()}`);
      }
    }
    
    console.log(`[ActivityFacade] Finished adding test heartbeats. Running aggregation...`);
    
    // Aggregation ausführen und Cache aktualisieren
    const success = this.aggregationService.aggregateDay(currentDateKey);
    console.log(`[ActivityFacade] Test aggregation result: ${success ? 'successful' : 'failed'}`);
    
    // Daten speichern
    this.saveToDisk();
    console.log(`[ActivityFacade] Test data saved to disk.`);
    
    // Notifiziere alle Renderer-Prozesse über die neue Daten
    // Diese Benachrichtigung erfolgt normalerweise automatisch durch den ActivityTracker
    if (this.onDataUpdate) {
      console.log(`[ActivityFacade] Manually notifying about data update for date ${currentDateKey}`);
      this.onDataUpdate(currentDateKey);
    } else {
      console.log(`[ActivityFacade] Warning: No onDataUpdate callback set, UI might not update automatically`);
    }
  }
} 