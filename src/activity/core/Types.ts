/**
 * @file Types.ts
 * 
 * Definiert die grundlegenden Typen für die Aktivitätsverfolgung.
 * Diese Typen werden in der gesamten Anwendung wiederverwendet.
 */

// ---- TYPE DEFINITIONS ----

// Export this type so it can be shared
export interface AppWindowData {
  app: string;
  title: string;
}

// Ein Herzschlag, der einen Moment der Benutzeraktivität repräsentiert
export interface Heartbeat {
  timestamp: number; // Unix-Zeitstempel in Millisekunden
  data: HeartbeatData; // Aktivitätsdaten für diesen Moment
}

// Daten, die einen Herzschlag beschreiben
export interface HeartbeatData {
  userActivity: 'active' | 'inactive' | 'may_be_inactive';
  appWindow?: {
    app: string;
    title: string;
  };
  // Zusätzliche Felder können hier hinzugefügt werden (Teams-Meetings, etc.)
}

// Beschreibt ein Ereignis in der Zeitleiste (z.B. 15-Minuten-Block mit einer Aktivität)
export interface TimelineEvent {
  timestamp: number; // Startzeitpunkt
  duration: number; // Dauer in Millisekunden
  type: string; // Art des Ereignisses: 'appWindow', 'teamsMeeting', 'inactive', etc.
  data: any; // Spezifische Daten je nach Ereignistyp
}

// Zusammenfassung der aggregierten Daten für die Darstellung
export interface AggregationSummary {
  activeTrackingDuration: number; // Gesamtdauer der aktiven Verfolgung
  totalActiveDuration: number; // Gesamtdauer der aktiven Zeit
  totalInactiveDuration: number; // Gesamtdauer der inaktiven Zeit
  totalMeetingDuration: number; // Gesamtdauer der Meetings
  appUsage: { [appName: string]: number }; // App-Nutzungszeiten
}

// Aggregierte Daten für einen Tag
export interface AggregatedData {
  summary: AggregationSummary;
  timelineOverview: TimelineEvent[];
}

// Daten für einen gesamten Tag
export interface DayData {
  heartbeats: Heartbeat[]; // Alle Herzschläge des Tages
  aggregated?: AggregatedData; // Aggregierte Daten (optional, kann fehlen)
}

// Gesamte Datenstruktur der Aktivitätsspeicherung
export interface StoreData {
  version: number;
  lastCleanupTime: number;
  startTime: number;
  aggregationInterval: 5 | 10 | 15;
  days: { [dateKey: string]: DayData };
}

export interface StoreOptions {
  useMockData: boolean;
  storagePath: string | null;
}