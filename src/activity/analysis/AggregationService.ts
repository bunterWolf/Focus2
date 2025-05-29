/**
 * AggregationService.ts
 * 
 * Diese Datei definiert den AggregationService, der für die Datenanalyse und -aggregation
 * in der Anwendung zuständig ist. Er ist Teil der modularisierten Architektur und 
 * implementiert die Logik für die Umwandlung von Rohdaten in aussagekräftige Informationen.
 * 
 * Hauptfunktionen:
 * - Generierung von Zeitleisten aus Heartbeat-Daten
 * - Berechnung von Zusammenfassungen (Aktivitätszeiten, App-Nutzung)
 * - Caching von aggregierten Daten zur Leistungsoptimierung
 * - Verwaltung des Aggregationsintervalls (5, 10, 15 Minuten)
 * 
 * Diese Komponente arbeitet eng mit dem TimelineGenerator zusammen, der die 
 * eigentlichen Aggregationsalgorithmen implementiert, während der AggregationService
 * die Orchestrierung und das Caching übernimmt.
 */

import TimelineGenerator, { AggregationIntervalMinutes } from './TimelineGenerator';
import { ActivityStorage } from '../storage/ActivityStorage';
import { DayData, AggregatedData } from '../core/Types';

/**
 * Verwaltet die Aggregation von Aktivitätsdaten.
 * Verantwortlich für Erzeugung von Zeitleisten und Zusammenfassungen.
 */
export class AggregationService {
  private timelineGenerator: TimelineGenerator;
  private activityStorage: ActivityStorage;
  private aggregationCache: Map<string, AggregatedData> = new Map();
  
  /**
   * Erstellt eine Instanz des AggregationService.
   * @param activityStorage ActivityStorage-Instanz für Datenzugriff.
   */
  constructor(activityStorage: ActivityStorage) {
    this.activityStorage = activityStorage;
    this.timelineGenerator = new TimelineGenerator();
  }
  
  /**
   * Löscht den Aggregations-Cache.
   */
  clearCache(): void {
    this.aggregationCache.clear();
    console.log("[AggregationService] Aggregation cache cleared.");
  }
  
  /**
   * Gibt das aktuelle Aggregationsintervall zurück.
   * @returns Das Aggregationsintervall in Minuten (5, 10 oder 15).
   */
  getAggregationInterval(): AggregationIntervalMinutes {
    return this.timelineGenerator.aggregationInterval;
  }
  
  /**
   * Setzt das Aggregationsintervall.
   * @param interval Das neue Intervall in Minuten (5, 10 oder 15).
   */
  setAggregationInterval(interval: AggregationIntervalMinutes): void {
    if (![5, 10, 15].includes(interval)) {
      console.error('[AggregationService] Invalid interval passed:', interval);
      return;
    }
    
    console.log(`[AggregationService] Setting aggregation interval to ${interval} minutes.`);
    this.timelineGenerator.setAggregationInterval(interval);
    this.clearCache();
  }
  
  /**
   * Aggregiert die Daten für einen Tag.
   * Speichert die aggregierten Daten im Cache.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns true, wenn die Aggregation Daten produziert hat, sonst false.
   */
  aggregateDay(dateKey: string): boolean {
    console.log(`[AggregationService] Aggregating data for ${dateKey}...`);
    
    // Lade Daten für den Tag
    const dayData = this.activityStorage.getDayData(dateKey);
    if (!dayData || dayData.heartbeats.length === 0) {
      console.log(`[AggregationService] No heartbeats found for ${dateKey}, clearing cache entry.`);
      this.aggregationCache.delete(dateKey);
      return false;
    }
    
    // Aggregiere die Daten
    try {
      // Generiere Timeline-Events
      const timelineEvents = this.timelineGenerator.generateTimelineEvents(dayData.heartbeats);
      
      // Berechne Zusammenfassung
      const summary = this.timelineGenerator.calculateSummary(timelineEvents);
      
      // Erstelle das aggregierte Datenpaket
      const aggregatedData: AggregatedData = {
        summary,
        timelineOverview: timelineEvents
      };
      
      // Speichere im Cache
      this.aggregationCache.set(dateKey, aggregatedData);
      console.log(`[AggregationService] Aggregation for ${dateKey} successful. Timeline events: ${timelineEvents.length}`);
      return true;
    } catch (error) {
      console.error(`[AggregationService] Error aggregating data for ${dateKey}:`, error);
      return false;
    }
  }
  
  /**
   * Ruft die aggregierten Daten für einen Tag ab.
   * Versucht zuerst den Cache zu verwenden, aggregiert bei Bedarf neu.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns Die aggregierten Daten oder undefined, wenn keine Daten existieren.
   */
  getAggregatedData(dateKey: string): AggregatedData | undefined {
    // Prüfe, ob die Daten im Cache sind
    if (this.aggregationCache.has(dateKey)) {
      return this.aggregationCache.get(dateKey);
    }
    
    // Wenn nicht, aggregiere die Daten neu
    if (this.aggregateDay(dateKey)) {
      return this.aggregationCache.get(dateKey);
    }
    
    return undefined;
  }
  
  /**
   * Ruft die Daten für einen Tag mit aggregierten Daten ab.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns Ein DayData-Objekt mit Heartbeats und aggregierten Daten, oder null.
   */
  getDayDataWithAggregation(dateKey?: string | null): DayData | null {
    // Wenn kein Datums-Key angegeben ist, verwende den aktuellen Tag
    const effectiveDateKey = dateKey || this.getCurrentDateKey();
    
    console.log(`[AggregationService] getDayDataWithAggregation called for ${effectiveDateKey}`);
    
    // Lade Basisdaten
    const dayData = this.activityStorage.getDayData(effectiveDateKey);
    if (!dayData) {
      return null;
    }
    
    console.log(`[AggregationService] Found ${dayData.heartbeats.length} heartbeats for ${effectiveDateKey}`);
    
    // Füge aggregierte Daten hinzu, wenn vorhanden
    console.log(`[AggregationService] getAggregatedData called for ${effectiveDateKey}`);
    const aggregated = this.getAggregatedData(effectiveDateKey);
    if (aggregated) {
      console.log(`[AggregationService] Cache hit for ${effectiveDateKey}`);
      console.log(`[AggregationService] Timeline events in cache: ${aggregated.timelineOverview.length}`);
      console.log(`[AggregationService] Adding aggregated data with ${aggregated.timelineOverview.length} timeline events`);
      dayData.aggregated = aggregated;
    } else {
      console.log(`[AggregationService] No aggregated data available for ${effectiveDateKey}`);
      // Erstelle eine leere Aggregation für Tage ohne Daten, um UI-Fehler zu vermeiden
      dayData.aggregated = {
        summary: {
          activeTrackingDuration: 0,
          totalActiveDuration: 0,
          totalInactiveDuration: 0,
          totalMeetingDuration: 0,
          appUsage: {}
        },
        timelineOverview: []
      };
    }
    
    return dayData;
  }
  
  /**
   * Hilfsmethode zum Abrufen des aktuellen Datums-Keys.
   * @returns Der aktuelle Datums-Key.
   */
  private getCurrentDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
} 