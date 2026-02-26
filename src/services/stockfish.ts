import { wasmThreadsSupported } from '../utils/wasm';

declare global {
    interface Window {
        Stockfish: any;
    }
}

class StockfishService {
    private engine: any = null;
    private isReady: boolean = false;
    private onMove: ((move: string) => void) | null = null;
    private onEvaluation: ((score: number) => void) | null = null;
    private messageListeners: ((line: string) => void)[] = [];

    constructor() {
        this.initEngine();
    }

    private async initEngine() {
        // Feature detection for multi-threading
        const threadsSupported = wasmThreadsSupported();
        console.log(`[Stockfish] WASM Threads Supported: ${threadsSupported}`);

        // We assume the user will provide stockfish.js in public/stockfish/
        // To avoid blocking the UI, we'll load the script dynamically if not present
        if (!window.Stockfish) {
            await this.loadEngineScript();
        }

        if (window.Stockfish) {
            try {
                // requested initialization pattern: Stockfish().then((sf) => { ... })
                this.engine = await window.Stockfish();
                this.setupListeners();
                this.engine.postMessage('uci');
                console.log('[Stockfish] Engine initialized successfully');
            } catch (e) {
                console.error('[Stockfish] Failed to initialize engine instance:', e);
            }
        } else {
            console.warn('[Stockfish] window.Stockfish not found. Ensure public/stockfish/stockfish.js is present.');
        }
    }

    private loadEngineScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/stockfish/stockfish.js';
            script.onload = () => resolve();
            script.onerror = () => {
                console.error('[Stockfish] Could not load engine script at /stockfish/stockfish.js');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    private setupListeners() {
        if (!this.engine) return;

        this.engine.addMessageListener((line: string) => {
            // console.log(`[Stockfish] ${line}`);

            if (line === 'uciok') {
                this.isReady = true;
            }

            if (line.startsWith('bestmove')) {
                const move = line.split(' ')[1];
                if (this.onMove) {
                    this.onMove(move);
                }
            }

            // Evaluation parsing (e.g., "info depth 10 score cp 25 ...")
            if (line.includes('score cp')) {
                const parts = line.split(' ');
                const cpIndex = parts.indexOf('cp');
                if (cpIndex !== -1) {
                    const score = parseInt(parts[cpIndex + 1], 10);
                    if (this.onEvaluation) {
                        this.onEvaluation(score / 100); // Convert to pawn units
                    }
                }
            }

            this.messageListeners.forEach(listener => listener(line));
        });
    }

    public getBestMove(fen: string, difficulty: number, callback: (move: string) => void) {
        if (!this.engine || !this.isReady) {
            console.warn("[Stockfish] Engine not ready or failed to init");
            // If the script fails, we might still want to call back to avoid hanging the UI
            return;
        }

        this.onMove = callback;

        // Skill Level: 0-20
        const skillLevel = Math.min(20, Math.max(0, difficulty));

        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
        this.engine.postMessage('go movetime 1000');
    }

    public setEvaluationListener(callback: (score: number) => void) {
        this.onEvaluation = callback;
    }

    public addMessageListener(listener: (line: string) => void) {
        this.messageListeners.push(listener);
    }

    public postMessage(message: string) {
        if (this.engine) {
            this.engine.postMessage(message);
        }
    }

    public terminate() {
        if (this.engine && this.engine.terminate) {
            this.engine.terminate();
        }
    }
}

export const chessEngine = new StockfishService();
