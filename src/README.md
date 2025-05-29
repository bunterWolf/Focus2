# ChronFlow Projektstruktur

Diese Dokumentation beschreibt die neue Verzeichnisstruktur des ChronFlow-Projekts.

## Überblick

Die Anwendung ist in logische Module aufgeteilt, die jeweils spezifische Aufgaben erfüllen:

```
src/
├── activity/             # Aktivitätserfassung und -verarbeitung
│   ├── core/             # Kernkomponenten
│   ├── capture/          # Erfassung von Aktivitätsdaten
│   ├── storage/          # Datenpersistenz
│   ├── analysis/         # Datenanalyse und -verarbeitung
│   ├── utils/            # Aktivitätsspezifische Hilfsfunktionen
│   └── ipc/              # Aktivitätsbezogene IPC-Kommunikation
│
├── core/                 # Kernanwendungskomponenten
│   └── settings/         # Anwendungseinstellungen
│
└── tests/                # Testdateien
```

## Hauptkomponenten

### Activity

Der `activity`-Bereich umfasst alle Komponenten, die mit der Erfassung, Speicherung und Analyse von Aktivitätsdaten zu tun haben:

#### Core

- `ActivityFacade.ts` - Hauptfassade, die eine vereinfachte API für den Rest der Anwendung bereitstellt
- `Types.ts` - Zentrale Typendefinitionen für Aktivitätsdaten

#### Capture

- `ActivityTracker.ts` - Koordiniert die Aktivitätsverfolgung
- `HeartbeatManager.ts` - Verwaltet die Heartbeats von verschiedenen Quellen
- `watchers/` - Konkrete Implementierungen zur Datenerfassung
  - `ActiveWindowWatcher.ts` - Überwacht aktive Fenster
  - `InactivityWatcher.ts` - Erkennt Benutzerinaktivität
  - `TeamsMeetingsWatcher.js` - Integration mit Microsoft Teams

#### Storage

- `ActivityStorage.ts` - Hauptspeicherlogik
- `ActivityState.ts` - In-Memory-Zustand
- `StorageAdapter.ts` - Datei-I/O-Operationen

#### Analysis

- `AggregationService.ts` - Hauptaggregationsservice
- `TimelineGenerator.ts` - Generiert Timeline-Events aus Heartbeats

#### Utils

- `DateManager.ts` - Verwaltet datumsbezogene Operationen
- `IntervalScheduler.ts` - Zeitgesteuerte Aktionen

#### IPC

- `ActivityFacadeIpc.ts` - IPC-Handler für die ActivityFacade

### Core

Der `core`-Bereich enthält anwendungsweite Komponenten:

#### Settings

- `SettingsManager.ts` - Verwaltet Anwendungseinstellungen

### Tests

Der `tests`-Bereich enthält alle Testdateien:

- `ActivityStore.test.ts` - Tests für die Speicherlogik
- `TimelineGenerator.test.ts` - Tests für die Timeline-Generierung 