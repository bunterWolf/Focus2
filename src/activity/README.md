# Activity Tracking Modul

## Übersicht

Dieses Modul ist das Ergebnis einer umfassenden Refaktorierung des ursprünglichen monolithischen `ActivityStore`. Die neue Architektur folgt den SOLID-Prinzipien und ist in spezialisierte Komponenten unterteilt, die jeweils eine einzelne Verantwortlichkeit haben.

## Architekturprinzipien

- **Single Responsibility Principle**: Jede Klasse hat eine klar definierte Aufgabe
- **Dependency Injection**: Komponenten erhalten ihre Abhängigkeiten über den Konstruktor
- **Facade Pattern**: `ActivityFacade` bietet eine vereinfachte Schnittstelle für andere Teile der Anwendung
- **Observer Pattern**: Benachrichtigungen über Statusänderungen erfolgen über Callbacks
- **Repository Pattern**: Daten werden über spezialisierte Storage-Komponenten verwaltet

## Komponentenübersicht

### Core

- **ActivityFacade**: Zentrale Schnittstelle für alle aktivitätsbezogenen Operationen
- **Types**: Gemeinsame Typendefinitionen für das gesamte Modul

### Capture

- **ActivityTracker**: Verwaltet den Tracking-Status und die Verarbeitung von Heartbeats
- **HeartbeatManager**: Koordiniert die verschiedenen Watcher, die Heartbeats erzeugen

### Storage

- **ActivityStorage**: Persistenz und Verwaltung von Aktivitätsdaten
- **ActivityState**: In-Memory-Representation der Aktivitätsdaten
- **StorageAdapter**: Abstrahiert Datei-I/O-Operationen

### Analysis

- **AggregationService**: Orchestriert die Datenanalyse und -aggregation
- **TimelineGenerator**: Implementiert Algorithmen zur Erzeugung von Zeitleisten und Zusammenfassungen

### Utils

- **DateManager**: Verwaltet datumsbezogene Operationen und Tageswechsel
- **IntervalScheduler**: Verwaltet zeitgesteuerte Intervalle für regelmäßige Aktionen

### IPC

- **ActivityFacadeIpc**: Stellt IPC-Handler für die Kommunikation mit dem Renderer-Prozess bereit

## Datenfluss

1. **Erfassung**: HeartbeatManager erzeugt Heartbeats über verschiedene Watcher
2. **Verarbeitung**: ActivityTracker verarbeitet Heartbeats und leitet sie an ActivityStorage weiter
3. **Speicherung**: ActivityStorage speichert Heartbeats im ActivityState und persistiert sie auf Anfrage
4. **Aggregation**: AggregationService analysiert die Rohdaten und erzeugt aggregierte Daten
5. **Zugriff**: ActivityFacade bietet eine einheitliche Schnittstelle für den Zugriff auf alle Daten

## Konfiguration

Die Konfiguration erfolgt über den SettingsManager, der die folgenden Einstellungen verwaltet:

- Speicherort der Aktivitätsdaten
- Aggregationsintervall (5, 10 oder 15 Minuten)
- Auto-Launch-Einstellung
- Beta-Update-Einstellung 