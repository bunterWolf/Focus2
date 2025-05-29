/**
 * Klasse zur Verwaltung zeitgesteuerter Intervalle.
 * Startet, pausiert und verwaltet einen Timer, der in regelmäßigen Intervallen eine Callback-Funktion aufruft.
 */
export class IntervalScheduler {
    private intervalMillis: number;
    private callback: () => void;
    private timerId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    /**
     * Erstellt eine neue Instanz des IntervalSchedulers.
     * @param intervalMinutes Das Intervall in Minuten
     * @param callback Die Funktion, die am Ende jedes Intervalls aufgerufen wird
     */
    constructor(intervalMinutes: number, callback: () => void) {
        this.intervalMillis = intervalMinutes * 60 * 1000;
        this.callback = callback;
    }

    /**
     * Startet den Scheduler.
     */
    start(): void {
        if (this.isRunning) {
            console.log('[Scheduler] Scheduler already running.');
            return;
        }

        console.log(`[Scheduler] Starting scheduler with interval of ${this.intervalMillis / 60000} minutes.`);
        this.isRunning = true;
        this.scheduleNext();
    }

    /**
     * Pausiert den Scheduler.
     */
    pause(): void {
        if (!this.isRunning) {
            console.log('[Scheduler] Scheduler not running, cannot pause.');
            return;
        }

        console.log('[Scheduler] Pausing scheduler.');
        this.isRunning = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Ändert das Intervall.
     * @param intervalMinutes Das neue Intervall in Minuten
     */
    setInterval(intervalMinutes: number): void {
        const wasRunning = this.isRunning;
        
        // Pausiere den Scheduler, falls er läuft
        if (wasRunning) {
            this.pause();
        }
        
        // Aktualisiere das Intervall
        this.intervalMillis = intervalMinutes * 60 * 1000;
        console.log(`[Scheduler] Interval updated to ${intervalMinutes} minutes.`);
        
        // Starte den Scheduler neu, falls er vorher lief
        if (wasRunning) {
            this.start();
        }
    }

    /**
     * Plant den nächsten Aufruf der Callback-Funktion.
     */
    private scheduleNext(): void {
        if (!this.isRunning) return;
        
        this.timerId = setTimeout(() => {
            if (this.isRunning) {
                try {
                    this.callback();
                } catch (error) {
                    console.error('[Scheduler] Error in callback:', error);
                }
                // Schedule next interval
                this.scheduleNext();
            }
        }, this.intervalMillis);
    }

    /**
     * Führt Bereinigungsarbeiten durch.
     */
    cleanup(): void {
        console.log('[Scheduler] Cleaning up scheduler...');
        this.pause();
    }
} 