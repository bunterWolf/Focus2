/**
 * ActivityTracker.ts
 * 
 * Diese Datei definiert den ActivityTracker, der für die Überwachung und Steuerung
 * des Aktivitätstrackings verantwortlich ist. Er ist ein zentraler Bestandteil der
 * modularisierten Architektur, die im Rahmen des Refactorings eingeführt wurde.
 * 
 * Hauptfunktionen:
 * - Starten und Pausieren des Aktivitätstrackings
 * - Verarbeitung und Speicherung eingehender Heartbeats
 * - Auslösen regelmäßiger Datenaktualisierungs- und Aggregationsintervalle
 * - Benachrichtigung anderer Komponenten über Statusänderungen
 * 
 * Der ActivityTracker arbeitet eng mit:
 * - DateManager: Für die Erkennung von Tageswechseln
 * - ActivityStorage: Für die Speicherung von Heartbeats
 * - AggregationService: Für die regelmäßige Datenanalyse
 * - IntervalScheduler: Für die zeitgesteuerte Ausführung von Aktionen
 * 
 * Diese Komponente implementiert das Observer-Pattern durch Callbacks, um andere
 * Teile der Anwendung über Änderungen des Tracking-Status zu informieren.
 */

import { DateManager } from '../utils/DateManager';
import { ActivityStorage } from '../storage/ActivityStorage';
import { AggregationService } from '../analysis/AggregationService';
import { HeartbeatData } from '../core/Types';
import { AggregationIntervalMinutes } from '../analysis/TimelineGenerator';
import { IntervalScheduler } from '../utils/IntervalScheduler';

// Export callback types
export type DataUpdateCallback = (dateKey: string) => void;
export type TrackingStatusCallback = (isTracking: boolean) => void;

/**
 * Verantwortlich für das Tracking von Aktivitäten und das Verwalten des Tracking-Status.
 * Koordiniert das Hinzufügen von Heartbeats und die Benachrichtigung anderer Komponenten.
 */
export class ActivityTracker {
  private dateManager: DateManager;
  private activityStorage: ActivityStorage;
  private aggregationService: AggregationService;
  private isTracking: boolean = false;
  private currentDayKey: string;
  private useMockData: boolean = false;
  private scheduler: IntervalScheduler;
  
  // Callback-Funktionen
  private onDataUpdate: DataUpdateCallback | null = null;
  private onTrackingStatusChange: TrackingStatusCallback | null = null;

  /**
   * Erstellt eine neue Instanz des ActivityTrackers.
   * @param dateManager DateManager-Instanz für Datums-Operationen.
   * @param activityStorage ActivityStorage-Instanz für Datenspeicherung.
   * @param aggregationService AggregationService-Instanz für Datenaggregation.
   * @param useMockData Boolean, ob Mock-Daten verwendet werden sollen.
   */
  constructor(
    dateManager: DateManager, 
    activityStorage: ActivityStorage,
    aggregationService: AggregationService,
    useMockData: boolean = false
  ) {
    this.dateManager = dateManager;
    this.activityStorage = activityStorage;
    this.aggregationService = aggregationService;
    this.useMockData = useMockData;
    this.currentDayKey = this.dateManager.getDateKey(Date.now());

    // Erstelle den IntervalScheduler
    const intervalCallback = this.handleIntervalEnd.bind(this);
    const interval = this.aggregationService.getAggregationInterval();
    this.scheduler = new IntervalScheduler(interval, intervalCallback);
  }

  /**
   * Setzt die Callback-Funktionen für Benachrichtigungen.
   * @param dataUpdateCallback Callback für Datenaktualisierungen
   * @param trackingStatusCallback Callback für Tracking-Statusänderungen
   */
  setCallbacks(
    dataUpdateCallback: DataUpdateCallback | null = null,
    trackingStatusCallback: TrackingStatusCallback | null = null
  ): void {
    this.onDataUpdate = dataUpdateCallback;
    this.onTrackingStatusChange = trackingStatusCallback;
  }

  /**
   * Startet das Aktivitäts-Tracking.
   */
  startTracking(): void {
    if (this.isTracking) {
      console.log('🔄 [Tracker] Already active');
      return;
    }
    
    console.log('▶️ [Tracker] Starting tracking service');
    this.isTracking = true;
    this.currentDayKey = this.dateManager.getDateKey(Date.now());
    
    if (!this.useMockData) {
      this.scheduler.start();
    }
    
    if (this.onTrackingStatusChange) {
      this.onTrackingStatusChange(this.isTracking);
    }
  }

  /**
   * Pausiert das Aktivitäts-Tracking.
   */
  pauseTracking(): void {
    if (!this.isTracking) {
      console.log('⏸️ [Tracker] Not active, cannot pause');
      return;
    }
    
    console.log('⏸️ [Tracker] Pausing tracking service');
    this.isTracking = false;
    this.scheduler.pause();
    
    if (!this.useMockData) {
      this.activityStorage.saveToDisk();
    }
    
    if (this.onTrackingStatusChange) {
      this.onTrackingStatusChange(this.isTracking);
    }
  }

  /**
   * Fügt einen neuen Heartbeat hinzu.
   * @param heartbeatData Daten für den neuen Heartbeat
   */
  addHeartbeat(heartbeatData: HeartbeatData): void {
    // Guard clause: Not tracking
    if (!this.isTracking) {
      return;
    }

    const timestamp = Date.now();
    const newDateKey = this.dateManager.getDateKey(timestamp);

    // Handle Day Change
    if (newDateKey !== this.currentDayKey) {
      this.handleDayChange(newDateKey);
    }

    // Update Heartbeats in Storage
    this.activityStorage.addHeartbeat(timestamp, heartbeatData, this.currentDayKey);
  }

  /**
   * Handler für das Ende eines Intervalls.
   */
  private handleIntervalEnd(): void {
    if (this.isTracking && !this.useMockData) {
      console.log('📊 [Tracker] Processing interval data');
      this.aggregationService.aggregateDay(this.currentDayKey);
      this.notifyDataUpdate(this.currentDayKey); 
      this.activityStorage.saveToDisk();
    }
  }

  /**
   * Löst die Aggregation für den aktuellen Tag aus.
   * @returns true wenn die Aggregation Änderungen enthielt, sonst false
   */
  private triggerTodaysAggregation(): boolean {
    this.currentDayKey = this.dateManager.getDateKey(Date.now());
    console.log(`[Tracker] Triggering aggregation for today (${this.currentDayKey})...`);
    return this.aggregationService.aggregateDay(this.currentDayKey);
  }

  /**
   * Behandelt einen Tageswechsel.
   * @param newDateKey Der neue Datums-Key
   */
  private handleDayChange(newDateKey: string): void {
    console.log(`📅 [Tracker] Day changed: ${this.currentDayKey} → ${newDateKey}`);
    if (!this.useMockData) {
      this.activityStorage.saveToDisk();
    }
    this.currentDayKey = newDateKey;
  }

  /**
   * Benachrichtigt über Datenaktualisierungen.
   * @param dateKey Der aktualisierte Datums-Key
   */
  private notifyDataUpdate(dateKey: string): void {
    if (this.onDataUpdate) {
      this.onDataUpdate(dateKey);
    }
  }

  /**
   * Gibt den aktuellen Tracking-Status zurück.
   * @returns true, wenn das Tracking aktiv ist, sonst false
   */
  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  /**
   * Aktualisiert das Aggregationsintervall.
   * @param interval Neues Intervall
   */
  setAggregationInterval(interval: AggregationIntervalMinutes): void {
    this.scheduler.setInterval(interval);
  }

  /**
   * Führt Bereinigungsarbeiten durch.
   */
  cleanup(): void {
    console.log("🧹 [Tracker] Cleaning up resources");
    this.scheduler.cleanup();
    console.log("✨ [Tracker] Cleanup complete");
  }
} 