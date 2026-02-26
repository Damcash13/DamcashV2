import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface GameInvitation {
    id: string;
    from: string;
    fromId: string;
    gameType: 'checkers' | 'chess';
    timeControl: string;
    variant?: string;
    timestamp: Date;
}

interface WagerChallenge extends GameInvitation {
    amount: number;
}

interface FriendRequest {
    id: string;
    from: string;
    fromId: string;
    timestamp: Date;
}

export function useInvitations(config: { listen: boolean } = { listen: true }) {
    const { user } = useAuth();
    const isConnected = !!user; // Supabase handles its own connection natively

    const [gameInvitations, setGameInvitations] = useState<GameInvitation[]>([]);
    const [wagerChallenges, setWagerChallenges] = useState<WagerChallenge[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

    useEffect(() => {
        // Only subscribe if connected AND listening is enabled
        if (!isConnected || !config.listen) return;

        if (!user || !config.listen) return;

        console.log('🔗 Subscribing to user_inbox:', user.id);
        const channel = supabase.channel(`user_inbox:${user.id}`);

        channel
            .on('broadcast', { event: 'game_invitation' }, ({ payload }) => {
                setGameInvitations(prev => [...prev, {
                    id: payload.id || crypto.randomUUID(),
                    from: payload.from,
                    fromId: payload.fromId,
                    gameType: payload.gameType,
                    timeControl: payload.timeControl,
                    variant: payload.variant,
                    timestamp: new Date()
                }]);
            })
            .on('broadcast', { event: 'wager_challenge' }, ({ payload }) => {
                setWagerChallenges(prev => [...prev, {
                    id: payload.id || crypto.randomUUID(),
                    from: payload.from,
                    fromId: payload.fromId,
                    amount: payload.amount,
                    gameType: payload.gameType,
                    timeControl: payload.timeControl,
                    variant: payload.variant,
                    timestamp: new Date()
                }]);
            })
            .on('broadcast', { event: 'friend_request' }, ({ payload }) => {
                setFriendRequests(prev => [...prev, {
                    id: payload.id || crypto.randomUUID(),
                    from: payload.from,
                    fromId: payload.fromId,
                    timestamp: new Date()
                }]);
            })
            .on('broadcast', { event: 'invitation_accepted' }, ({ payload }) => {
                setGameInvitations(prev => prev.filter(inv => inv.id !== payload.invitationId));
                setWagerChallenges(prev => prev.filter(inv => inv.id !== payload.invitationId));
            })
            .on('broadcast', { event: 'invitation_declined' }, ({ payload }) => {
                setGameInvitations(prev => prev.filter(inv => inv.id !== payload.invitationId));
                setWagerChallenges(prev => prev.filter(inv => inv.id !== payload.invitationId));
            })
            .subscribe();

        // Fallback fetch pending friend requests on mount
        const fetchPendingRequests = async () => {
            // Mock for now, you would use Supabase DB if persisted
        };

        if (isConnected && config.listen) {
            fetchPendingRequests();
        }

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, config.listen]);

    const sendDirectBroadcast = (toUserId: string, event: string, payload: any) => {
        // Create an ephemeral channel to send the broadcast to the target user
        const channel = supabase.channel(`user_inbox:${toUserId}`);
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                channel.send({
                    type: 'broadcast',
                    event: event,
                    payload: payload
                }).then(() => supabase.removeChannel(channel)); // Clean up immediately after sending
            }
        });
    };

    const sendGameInvitation = (toUserId: string, gameType: 'checkers' | 'chess', timeControl: string, variant?: string) => {
        sendDirectBroadcast(toUserId, 'game_invitation', {
            id: crypto.randomUUID(),
            from: user?.username,
            fromId: user?.id,
            gameType,
            timeControl,
            variant
        });
    };

    const sendWagerChallenge = (toUserId: string, amount: number, gameType: 'checkers' | 'chess', timeControl: string, variant?: string) => {
        sendDirectBroadcast(toUserId, 'wager_challenge', {
            id: crypto.randomUUID(),
            from: user?.username,
            fromId: user?.id,
            amount,
            gameType,
            timeControl,
            variant
        });
    };

    const acceptInvitation = async (invitationId: string, senderId: string) => {
        const inv = gameInvitations.find(i => i.id === invitationId) || wagerChallenges.find(i => i.id === invitationId);
        if (!user || !inv) return;

        // 1. Create a game in Supabase DB
        const gameData = {
            game_type: inv.gameType,
            variant: inv.variant || 'standard',
            time_control: inv.timeControl || '5+3',
            status: 'started',
            is_rated: true, // Needs refactoring, but defaulting for now
            wager_amount: (inv as WagerChallenge).amount || 0,
            white_player_id: senderId,
            black_player_id: user.id,
        };

        try {
            const { data, error } = await supabase
                .from('games')
                .insert(gameData)
                .select()
                .single();

            if (error) throw error;

            // 2. Broadcast acceptance with gameId to original sender
            sendDirectBroadcast(senderId, 'invitation_accepted', {
                invitationId,
                acceptor: user.username,
                acceptorId: user.id,
                gameId: data.id
            });

            // Remove from local state
            setGameInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            setWagerChallenges(prev => prev.filter(inv => inv.id !== invitationId));

            // Allow caller to redirect
            return data.id;

        } catch (error) {
            console.error("Failed to create match on invite acceptance", error);
        }
    };

    const declineInvitation = (invitationId: string, senderId: string) => {
        sendDirectBroadcast(senderId, 'invitation_declined', {
            invitationId,
            decliner: user?.username,
            declinerId: user?.id,
        });

        // Remove from local state
        setGameInvitations(prev => prev.filter(i => i.id !== invitationId));
        setWagerChallenges(prev => prev.filter(i => i.id !== invitationId));
    };

    const sendFriendRequest = (toUserId: string) => {
        sendDirectBroadcast(toUserId, 'friend_request', {
            id: crypto.randomUUID(),
            from: user?.username,
            fromId: user?.id,
        });
    };

    return {
        gameInvitations,
        wagerChallenges,
        friendRequests,
        sendGameInvitation,
        sendWagerChallenge,
        acceptInvitation,
        declineInvitation,
        sendFriendRequest,
        isConnected
    };
}
