import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface SeriesState {
    id: string;
    opponentId: string;
    opponentName: string;
    totalGames: number;
    currentGameNumber: number;
    scores: {
        me: number;
        opponent: number;
    };
    stake: number; // Amount per game
    isActive: boolean;
    history: { gameId: string, winner: 'me' | 'opponent' | 'draw' }[];
}

interface SeriesContextType {
    currentSeries: SeriesState | null;
    startSeries: (opponentId: string, opponentName: string, totalGames: number, stake: number) => void;
    reportGameResult: (gameId: string, myResult: 'win' | 'loss' | 'draw') => void;
    quitSeries: (isForfeit: boolean) => Promise<void>; // isForfeit = true if leader quits
    clearSeries: () => void;
}

const SeriesContext = createContext<SeriesContextType | undefined>(undefined);

export function SeriesProvider({ children }: { children: ReactNode }) {
    const [currentSeries, setCurrentSeries] = useState<SeriesState | null>(null);
    const { user, updateWallet } = useAuth();
    const { showToast } = useToast();

    const startSeries = (opponentId: string, opponentName: string, totalGames: number, stake: number) => {
        setCurrentSeries({
            id: `series_${Date.now()}`,
            opponentId,
            opponentName,
            totalGames,
            currentGameNumber: 1,
            scores: { me: 0, opponent: 0 },
            stake,
            isActive: true,
            history: []
        });
        showToast(`Début de la série de ${totalGames} jeux`, 'info', `Enjeu: ${stake} par partie`);
    };

    const reportGameResult = (gameId: string, myResult: 'win' | 'loss' | 'draw') => {
        if (!currentSeries || !currentSeries.isActive) return;

        const newScores = { ...currentSeries.scores };
        if (myResult === 'win') newScores.me++;
        if (myResult === 'loss') newScores.opponent++;
        // Draws don't change score in this simple version, or maybe 0.5? Let's stick to full point for now or 0.
        // User said: "18-0", implies simple count.

        const newHistoryItem: { gameId: string, winner: 'me' | 'opponent' | 'draw' } = {
            gameId,
            winner: myResult === 'win' ? 'me' : myResult === 'loss' ? 'opponent' : 'draw'
        };
        const newHistory = [...currentSeries.history, newHistoryItem];

        // Check if last game
        if (currentSeries.currentGameNumber >= currentSeries.totalGames) {
            // Series Finished
            finishSeries(newScores);
        } else {
            // Next Game
            setCurrentSeries({
                ...currentSeries,
                scores: newScores,
                currentGameNumber: currentSeries.currentGameNumber + 1,
                history: newHistory
            });
        }
    };

    const finishSeries = async (finalScores: { me: number, opponent: number }) => {
        if (!currentSeries || !user) return;

        const netWins = finalScores.me - finalScores.opponent;
        const totalPayout = netWins * currentSeries.stake;

        if (totalPayout > 0) {
            // I won
            await updateWallet(totalPayout, 0); // Logic might differ if wallet uses separate fields
            showToast('Série Gagnée !', 'success', `Vous remportez ${totalPayout} coins`);
        } else if (totalPayout < 0) {
            // I lost
            await updateWallet(totalPayout, 0); // Negative amount deducts
            showToast('Série Perdue', 'error', `Vous perdez ${Math.abs(totalPayout)} coins`);
        } else {
            showToast('Série Égalité', 'info', 'Aucun coin échangé');
        }

        setCurrentSeries(prev => prev ? { ...prev, isActive: false, scores: finalScores } : null);
    };

    const quitSeries = async (isForfeit: boolean) => {
        if (!currentSeries || !currentSeries.isActive) return;

        // Logic:
        // If I am leading and I quit -> I forfeit ("ne sera pas payé").
        // If I am losing and I quit -> I pay what I owe.

        const netWins = currentSeries.scores.me - currentSeries.scores.opponent;

        if (netWins > 0) {
            // I am leading
            if (isForfeit) {
                showToast('Abandon (Leader)', 'error', 'Vous ne recevez aucun gain.');
                // No wallet update, just close
            }
        } else if (netWins < 0) {
            // I am losing
            const amountToPay = netWins * currentSeries.stake; // Negative value
            await updateWallet(amountToPay, 0);
            showToast('Abandon (Traîne)', 'error', `Vous avez payé ${Math.abs(amountToPay)} coins.`);
        }

        setCurrentSeries(null);
    };

    const clearSeries = () => setCurrentSeries(null);

    return (
        <SeriesContext.Provider value={{ currentSeries, startSeries, reportGameResult, quitSeries, clearSeries }}>
            {children}
        </SeriesContext.Provider>
    );
}

export function useSeries() {
    const context = useContext(SeriesContext);
    if (!context) {
        throw new Error('useSeries must be used within a SeriesProvider');
    }
    return context;
}
