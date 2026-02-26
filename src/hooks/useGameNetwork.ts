import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { User, ChatMessage, PlayerColor } from '../types';

export function useGameNetwork(
    gameId: string | undefined,
    mode: string,
    user: User | null,
    onGameStart: () => void,
    onGameEnd: (result: 'white' | 'black' | 'draw') => void
) {
    const { showToast } = useToast();

    const [remoteMove, setRemoteMove] = useState<any>(null);
    const isProcessingRemoteMove = useRef(false);
    const [localChatMessages, setLocalChatMessages] = useState<ChatMessage[]>([]);
    const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
    const [wagerAmount, setWagerAmount] = useState(0);
    const [poolAmount, setPoolAmount] = useState(0);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (mode === 'online' && gameId && user) {
            const fetchGameData = async () => {
                try {
                    const { data: gameData, error } = await supabase
                        .from('games')
                        .select('*')
                        .eq('id', gameId)
                        .single();

                    if (error || !gameData) {
                        console.error('Error fetching game:', error);
                        showToast('Erreur', 'error', 'Impossible de charger la partie');
                        return;
                    }

                    if (user.id === gameData.white_player_id) setPlayerColor('white');
                    else if (user.id === gameData.black_player_id) setPlayerColor('black');
                    else setPlayerColor('white');

                    if (gameData.wager_amount) {
                        setWagerAmount(gameData.wager_amount);
                        setPoolAmount(gameData.wager_amount * 2);
                    }

                    if (gameData.status === 'started') onGameStart();
                    else if (gameData.status === 'finished') onGameEnd(gameData.result);

                } catch (err) {
                    console.error('Failed to init online game:', err);
                }
            };

            fetchGameData();

            const channel = supabase.channel(`game:${gameId}`);
            channelRef.current = channel;

            channel
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
                    const newData = payload.new as any;
                    if (newData.status === 'started') {
                        onGameStart();
                        showToast('Partie commencée !', 'success', 'À vous de jouer');
                    }
                    if (newData.status === 'finished') {
                        onGameEnd(newData.result);
                    }
                })
                .on('broadcast', { event: 'move' }, (payload) => {
                    if (payload.payload.userId !== user.id) {
                        isProcessingRemoteMove.current = true;
                        setRemoteMove(payload.payload.move);
                    }
                })
                .on('broadcast', { event: 'chat' }, (payload) => {
                    if (payload.payload.senderId !== user.id) {
                        setLocalChatMessages(prev => [...prev, payload.payload]);
                    }
                })
                .on('broadcast', { event: 'resign' }, (payload) => {
                    if (payload.payload.userId !== user.id) {
                        showToast('Abandon', 'info', 'L\'adversaire a abandonné.');
                        onGameEnd('white'); // Assuming opponent resigned, we win
                    }
                })
                .on('broadcast', { event: 'draw_offer' }, (payload) => {
                    if (payload.payload.userId !== user.id) {
                        showToast('Proposition de nulle', 'info', 'L\'adversaire propose match nul.');
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                channelRef.current = null;
            };
        }
    }, [mode, gameId, user, onGameStart, onGameEnd, showToast]);

    const sendMove = (moveData: any, notation: string) => {
        if (mode === 'online' && !isProcessingRemoteMove.current && channelRef.current && user) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'move',
                payload: { move: { from: moveData?.from, to: moveData?.to, notation }, userId: user.id }
            });
        }
        isProcessingRemoteMove.current = false;
    };

    const sendChatMessage = (content: string) => {
        if (!user || !channelRef.current) return;
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            senderId: user.id,
            senderName: user.username,
            senderAvatar: user.avatarUrl,
            content,
            createdAt: new Date(),
        };
        setLocalChatMessages(prev => [...prev, msg]);
        channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    };

    const sendResign = () => {
        if (channelRef.current && user) {
            channelRef.current.send({ type: 'broadcast', event: 'resign', payload: { userId: user.id } });
        }
    };

    const sendDrawOffer = () => {
        if (channelRef.current && user) {
            channelRef.current.send({ type: 'broadcast', event: 'draw_offer', payload: { userId: user.id } });
        }
        showToast('Proposition de nulle envoyée', 'info', 'En attente de la réponse...');
    };

    return {
        remoteMove,
        localChatMessages,
        playerColor,
        wagerAmount,
        poolAmount,
        sendMove,
        sendChatMessage,
        sendResign,
        sendDrawOffer,
    };
}
