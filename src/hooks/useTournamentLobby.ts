import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
    user: string;
    message: string;
    timestamp: Date;
}

interface TournamentParticipant {
    id: string;
    username: string;
    elo: number;
    score: number;
    performance: number;
    gamesPlayed: number;
    rank: number;
    isPlaying?: boolean;
}

interface LiveGame {
    id: string;
    player1: string;
    player1Elo: number;
    player2: string;
    player2Elo: number;
    rank1: number;
    rank2: number;
}

export function useTournamentLobby(tournamentId: string) {
    const { send, on, isConnected } = useWebSocket();
    const { user } = useAuth();

    const [participantCount, setParticipantCount] = useState(0);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [liveGames, setLiveGames] = useState<LiveGame[]>([]);

    useEffect(() => {
        if (!isConnected) return;

        // Join tournament lobby
        send({
            type: 'tournament_join',
            payload: {
                tournamentId,
                userId: user?.id
            }
        });

        // Listen for participant updates
        const unsubParticipants = on('tournament_participant_count', (msg) => {
            if (msg.tournamentId === tournamentId) {
                setParticipantCount(msg.count);
            }
        });

        // Listen for chat messages
        const unsubChat = on('chat_message', (msg) => {
            if (msg.tournamentId === tournamentId) {
                setChatMessages(prev => [...prev, {
                    user: msg.user,
                    message: msg.message,
                    timestamp: new Date(msg.timestamp)
                }]);
            }
        });

        // Listen for live game updates
        const unsubGames = on('live_game_update', (msg) => {
            if (msg.tournamentId === tournamentId) {
                setLiveGames(prev => {
                    const index = prev.findIndex(g => g.id === msg.game.id);
                    if (index >= 0) {
                        const updated = [...prev];
                        updated[index] = msg.game;
                        return updated;
                    }
                    return [...prev, msg.game];
                });
            }
        });

        // Leave on unmount
        return () => {
            send({
                type: 'tournament_leave',
                payload: { tournamentId }
            });
            unsubParticipants();
            unsubChat();
            unsubGames();
        };
    }, [tournamentId, send, on, isConnected, user]);

    const sendChatMessage = (message: string) => {
        send({
            type: 'chat_message',
            payload: {
                tournamentId,
                userId: user?.id,
                username: user?.username || 'Anonymous',
                message
            }
        });
    };

    return {
        participantCount,
        chatMessages,
        liveGames,
        sendChatMessage,
        isConnected
    };
}
