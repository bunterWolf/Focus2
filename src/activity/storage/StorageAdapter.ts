import * as path from 'path';
import * as fs from 'fs';
import { StoreData } from '../core/Types';

/**
 * @file StorageAdapter.ts
 * 
 * Verantwortlich für die Datei-I/O-Operationen der Aktivitätsdaten.
 * Stellt eine abstrakte Schnittstelle zur Dateisysteminteraktion bereit.
 */
export class StorageAdapter {
    private filePath: string;

    /**
     * Erstellt eine neue Instanz des StorageAdapters.
     * @param filePath Der Pfad zur Speicherdatei.
     */
    constructor(filePath: string) {
        this.filePath = filePath;
    }

    /**
     * Lädt Daten aus der Speicherdatei.
     * @returns Die geladenen Daten oder null bei Fehler.
     */
    loadData(): StoreData | null {
        // Stelle sicher, dass der Dateiname vorhanden ist
        if (!this.filePath) {
            console.error("Fehler beim Laden: Kein Dateipfad angegeben");
            return null;
        }

        try {
            // Erstelle das Verzeichnis, falls es nicht existiert
            const dirPath = path.dirname(this.filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Prüfe, ob die Datei existiert
            if (!fs.existsSync(this.filePath)) {
                console.log(`Keine Datei gefunden unter ${this.filePath}, erstelle neue Datei`);
                return null;
            }

            // Datei lesen
            const data = fs.readFileSync(this.filePath, 'utf-8');
            const parsedData = JSON.parse(data) as StoreData;

            // Stabile Datenstruktur gewährleisten für ältere Versionen
            if (!parsedData || typeof parsedData !== 'object') {
                console.error("Fehler beim Lesen: Ungültiges Datenformat");
                return null;
            }

            // Grundlegende Validierung durchführen
            if (!this.validateStoreData(parsedData)) {
                console.error("Fehler beim Lesen: Ungültige Datenstruktur");
                return null;
            }

            return parsedData;
        } catch (error) {
            console.error("Fehler beim Lesen der Aktivitätsdaten:", error);
            return null;
        }
    }

    /**
     * Speichert Daten in die Speicherdatei.
     * @param data Die zu speichernden Daten.
     * @returns true bei Erfolg, false bei Fehler.
     */
    saveData(data: StoreData): boolean {
        if (!this.filePath) {
            console.error("Fehler beim Speichern: Kein Dateipfad angegeben");
            return false;
        }

        try {
            // Stelle sicher, dass das Verzeichnis existiert
            const dirPath = path.dirname(this.filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // Speichere die Datei mit Formatierung für bessere Lesbarkeit
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(this.filePath, jsonData, 'utf-8');
            
            return true;
        } catch (error) {
            console.error("Fehler beim Speichern der Aktivitätsdaten:", error);
            return false;
        }
    }

    /**
     * Aktualisiert den Pfad zur Speicherdatei.
     * @param newFilePath Der neue Dateipfad.
     */
    updateFilePath(newFilePath: string): void {
        this.filePath = newFilePath;
    }

    /**
     * Grundlegende Validierung der Datenstruktur.
     * @param data Die zu validierenden Daten.
     * @returns true, wenn die Daten gültig sind, sonst false.
     */
    private validateStoreData(data: any): boolean {
        // Stelle sicher, dass die wichtigsten Felder vorhanden sind
        if (!data.version || !data.days || typeof data.days !== 'object') {
            return false;
        }

        return true;
    }
}