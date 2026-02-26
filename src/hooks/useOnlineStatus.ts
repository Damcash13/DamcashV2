import { useEffect, useState, useCallback } from 'react';
import { useRealTime } from '../contexts/RealTimeContext';

type UserStatus = 'online' | 'away' | 'offline';

export function useOnlineStatus(userIdToTrack?: string) {
    const { sendMessage, subscribe, isConnected } = useRealTime();
    const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());

    useEffect(() => {
        if (!isConnected) return;

        // Listen for status updates
        const unsub = subscribe('user_status', (msg) => {
            setUserStatuses(prev => {
                const next = new Map(prev);
                next.set(msg.userId, msg.status);
                return next;
            });
        });

        const unsubPresence = subscribe('presence_update', (msg) => {
            setUserStatuses(prev => {
                const next = new Map(prev);
                if (msg.onlineUsers) {
                    msg.onlineUsers.forEach((userId: string) => {
                        next.set(userId, 'online');
                    });
                }
                return next;
            });
        });

        return () => {
            unsub();
            unsubPresence();
        };
    }, [subscribe, isConnected]);

    const setOwnStatus = useCallback((userId: string, status: UserStatus) => {
        sendMessage('status_update' as any, { userId, status });
    }, [sendMessage]);

    const getStatus = useCallback((userId: string): UserStatus => {
        return userStatuses.get(userId) || 'offline';
    }, [userStatuses]);

    return {
        getStatus,
        setOwnStatus,
        userStatuses,
        isConnected,
        status: userIdToTrack ? getStatus(userIdToTrack) : undefined
    };
}
