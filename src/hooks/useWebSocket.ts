import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws';

interface WebSocketMessage {
    type: string;
    [key: string]: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

export function useWebSocket(url: string = WS_URL) {
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const ws = useRef<WebSocket | null>(null);
    const listeners = useRef<Map<string, Set<MessageHandler>>>(new Map());
    const reconnectTimeout = useRef<number>();

    const connect = useCallback(() => {
        try {
            ws.current = new WebSocket(url);

            ws.current.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setReconnectAttempts(0);
            };

            ws.current.onclose = () => {
                console.log('❌ WebSocket disconnected');
                setIsConnected(false);

                // Auto-reconnect with exponential backoff
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                reconnectTimeout.current = window.setTimeout(() => {
                    console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts + 1})`);
                    setReconnectAttempts(prev => prev + 1);
                    connect();
                }, delay);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as WebSocketMessage;
                    const handlers = listeners.current.get(message.type);
                    handlers?.forEach(handler => handler(message));
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
        }
    }, [url, reconnectAttempts]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            ws.current?.close();
        };
    }, [connect]);

    const send = useCallback((message: WebSocketMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }, []);

    const on = useCallback((type: string, handler: MessageHandler) => {
        if (!listeners.current.has(type)) {
            listeners.current.set(type, new Set());
        }
        listeners.current.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            listeners.current.get(type)?.delete(handler);
        };
    }, []);

    return { isConnected, send, on };
}
