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

import { ActivityStorage } from '../storage/ActivityStorage';
import TimelineGenerator, { AggregationIntervalMinutes } from './TimelineGenerator';
import { Heartbeat, TimelineEvent } from '../core/Types';

interface AggregatedData {
  summary: {
    activeTrackingDuration: number;
    totalActiveDuration: number;
    totalInactiveDuration: number;
    totalMeetingDuration: number;
    appUsage: Record<string, number>;
  };
  timelineEvents: TimelineEvent[];
}

interface DayData {
  heartbeats: Heartbeat[];
  timelineEvents: TimelineEvent[];
}

/**
 * Verwaltet die Aggregation von Aktivitätsdaten.
 * Verantwortlich für Erzeugung von Zeitleisten und Zusammenfassungen.
 */
export class AggregationService {
  private activityStorage: ActivityStorage;
  private timelineGenerator: TimelineGenerator;
  private aggregationCache: Map<string, AggregatedData>;
  
  /**
   * Erstellt eine Instanz des AggregationService.
   * @param activityStorage ActivityStorage-Instanz für Datenzugriff.
   * @param timelineGenerator TimelineGenerator-Instanz für Zeitleistenerstellung.
   */
  constructor(activityStorage: ActivityStorage, timelineGenerator: TimelineGenerator) {
    this.activityStorage = activityStorage;
    this.timelineGenerator = timelineGenerator;
    this.aggregationCache = new Map();
  }
  
  /**
   * Löscht den Aggregations-Cache.
   */
  clearCache(): void {
    this.aggregationCache.clear();
    console.log("🧹 [Aggregation] Cache cleared");
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
      console.error('❌ [Aggregation] Invalid interval:', interval);
      return;
    }
    
    this.timelineGenerator.aggregationInterval = interval;
    this.clearCache(); // Clear cache when interval changes
    console.log(`⚙️ [Aggregation] Interval set to ${interval} minutes`);
  }
  
  /**
   * Aggregiert die Daten für einen Tag.
   * Speichert die aggregierten Daten im Cache.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns true, wenn die Aggregation Daten produziert hat, sonst false.
   */
  aggregateDay(dateKey: string): boolean {
    console.log(`📊 [Aggregation] Processing ${dateKey}`);
    
    const heartbeats = this.activityStorage.getDayData(dateKey)?.heartbeats || [];
    const timelineEvents = this.timelineGenerator.generateTimelineEvents(heartbeats);
    
    console.log(`✨ [Aggregation] Generated ${timelineEvents.length} timeline events`);
    
    // Berechne Zusammenfassung
    const summary = this.timelineGenerator.calculateSummary(timelineEvents);
    
    // Erstelle das aggregierte Datenpaket
    const aggregatedData: AggregatedData = {
      summary,
      timelineEvents
    };
    
    // Speichere im Cache
    this.aggregationCache.set(dateKey, aggregatedData);
    console.log(`💾 [Aggregation] Cached data for ${dateKey}`);
    return true;
  }
  
  /**
   * Ruft die aggregierten Daten für einen Tag ab.
   * Versucht zuerst den Cache zu verwenden, aggregiert bei Bedarf neu.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns Die aggregierten Daten oder undefined, wenn keine Daten existieren.
   */
  getAggregatedData(dateKey: string): AggregatedData | undefined {
    console.log(`📊 [Aggregation] Getting data for ${dateKey}`);
    
    // Check cache first
    const cachedData = this.aggregationCache.get(dateKey);
    if (cachedData) {
      console.log(`🔄 [Aggregation] Cache hit for ${dateKey}`);
      console.log(`📊 [Aggregation] Timeline events in cache: ${cachedData.timelineEvents.length}`);
      return cachedData;
    }

    // If not in cache, aggregate the data
    console.log(`🔄 [Aggregation] Cache miss for ${dateKey}, aggregating...`);
    const heartbeats = this.activityStorage.getDayData(dateKey)?.heartbeats || [];
    const timelineEvents = this.timelineGenerator.generateTimelineEvents(heartbeats);
    
    const aggregatedData: AggregatedData = {
      summary: {
        activeTrackingDuration: 0,
        totalActiveDuration: 0,
        totalInactiveDuration: 0,
        totalMeetingDuration: 0,
        appUsage: {}
      },
      timelineEvents
    };
    
    // Store in cache
    this.aggregationCache.set(dateKey, aggregatedData);
    console.log(`💾 [Aggregation] Cached data for ${dateKey}`);
    
    return aggregatedData;
  }
  
  /**
   * Ruft die Daten für einen Tag mit aggregierten Daten ab.
   * @param dateKey Der Datums-Key für den Tag.
   * @returns Ein DayData-Objekt mit Heartbeats und aggregierten Daten, oder null.
   */
  getDayDataWithAggregation(dateKey: string): DayData {
    console.log(`📊 [Aggregation] Processing data for ${dateKey}`);
    const heartbeats = this.activityStorage.getDayData(dateKey)?.heartbeats || [];
    console.log(`📊 [Aggregation] Found ${heartbeats.length} heartbeats`);
    
    const aggregatedData = this.getAggregatedData(dateKey);
    if (!aggregatedData) {
      return { heartbeats, timelineEvents: [] };
    }
    
    return {
      heartbeats,
      timelineEvents: aggregatedData.timelineEvents
    };
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