# Workmory Source Code Overview

Dieses Verzeichnis enthält den Quellcode der Workmory-Anwendung. Das Projekt verwendet Electron für die Hauptprozess/Renderer-Prozess-Architektur und React für die Benutzeroberfläche.

## Verzeichnisstruktur

### Hauptmodule

- `activity/` - Core-Funktionalität für Activity-Tracking
  - `core/` - Zentrale Datenstrukturen und Interfaces
    - `ActivityFacade.ts` - Zentrale Schnittstelle für alle aktivitätsbezogenen Operationen
    - `Types.ts` - Gemeinsame Typendefinitionen
  - `capture/` - Komponenten zur Erfassung von Benutzeraktivitäten
    - `ActivityTracker.ts` - Tracking-Logik und Heartbeat-Verarbeitung
    - `HeartbeatManager.ts` - Koordination der Watcher-Module
    - `watchers/` - Konkrete Implementierungen zur Datenerfassung
      - `ActiveWindowWatcher.ts` - Erfassung des aktiven Fensters
      - `InactivityWatcher.ts` - Erkennung von Benutzerinaktivität
      - `TeamsMeetingsWatcher.js` - Integration mit Microsoft Teams
  - `storage/` - Persistenz und Datenverwaltung
    - `ActivityState.ts` - In-Memory-Repräsentation der Aktivitätsdaten
    - `ActivityStorage.ts` - Speicherung und Verwaltung von Aktivitätsdaten
    - `StorageAdapter.ts` - Abstraktion der Datei-I/O-Operationen
  - `analysis/` - Datenanalyse und -aggregation
    - `AggregationService.ts` - Orchestrierung der Datenanalyse
    - `TimelineGenerator.ts` - Erzeugung von Zeitleisten und Zusammenfassungen
  - `utils/` - Hilfsfunktionen und -dienste
    - `DateManager.ts` - Verwaltung von Datumsoperationen
    - `IntervalScheduler.ts` - Zeitgesteuerte Intervalle
  - `ipc/` - IPC-Kommunikation mit dem Renderer-Prozess
    - `ActivityFacadeIpc.ts` - IPC-Handler für die ActivityFacade

- `core/` - Core-Anwendungskomponenten
  - `settings/` - Einstellungsverwaltung
    - `SettingsManager.ts` - Verwaltung der Anwendungseinstellungen

- `main/` - Electron-Hauptprozess
  - `main.ts` - Initialisierung der Anwendung und Fenster-Management

- `renderer/` - Electron-Renderer-Prozess
  - `index.js` - Einstiegspunkt für React
  - `index.html` - HTML-Template
  - `devtools.js` - Entwicklungswerkzeuge
  - `components/` - React-Komponenten für die Benutzeroberfläche
    - `App.js` - Hauptkomponente
    - `Header.js` - Kopfbereich mit Datum- und Intervallwahl
    - `DayOverview.js` - Zeitleisten-Ansicht
    - `Footer.js` - Fußbereich mit Zusammenfassung
    - `SettingsModal.js` - Einstellungsdialog

- `tests/` - Testdateien
  - `ActivityStore.test.ts` - Tests für ActivityStore
  - `TimelineGenerator.test.ts` - Tests für TimelineGenerator

### Sonstige Dateien

- `i18n.js` - Internationalisierung

## Technologie-Stack

- **Electron**: Cross-Platform Desktop-App-Framework
- **React**: UI-Bibliothek (ohne Router)
- **TypeScript**: Für typsichere Implementierung
- **Node.js fs/path**: Für Dateioperationen
- **Jest**: Für Tests 