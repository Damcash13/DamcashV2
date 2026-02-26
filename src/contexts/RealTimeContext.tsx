import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ToastContext'
import type {
  WebSocketMessage,
  WebSocketEventType,
  Game,
  GameInvitation,
  Notification,
  ChatMessage,
  User
} from '../types'
import { useAuth } from './AuthContext'

interface RealTimeContextType {
  // Connection status
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // Active data
  activeGame: Game | null
  pendingInvitations: GameInvitation[]
  notifications: Notification[]
  onlineUsers: User[]
  gameChatMessages: ChatMessage[]
  tournaments: any[]

  // Actions
  sendMessage: (type: WebSocketEventType, payload: any) => void
  joinGame: (gameId: string) => void
  leaveGame: () => void
  makeMove: (move: any) => void
  sendChatMessage: (content: string) => void
  sendInvitation: (recipientId: string, gameType: string, timeControl: any) => void
  acceptInvitation: (invitationId: string) => void
  declineInvitation: (invitationId: string) => void
  markNotificationRead: (notificationId: string) => void
  clearNotifications: () => void

  // Game controls
  resignGame: () => void
  offerDraw: () => void
  acceptDraw: () => void
  declineDraw: () => void

  // Event subscriptions
  subscribe: (event: WebSocketEventType | string, callback: (payload: any) => void) => () => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<GameInvitation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-1',
      recipientId: 'demo-user-1',
      type: 'system',
      title: 'Bienvenue sur Damcash v2!',
      message: 'Commencez une partie pour tester la plateforme.',
      read: false,
      createdAt: new Date(),
    }
  ])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [gameChatMessages, setGameChatMessages] = useState<ChatMessage[]>([])
  const [tournaments, setTournaments] = useState<any[]>([])

  const subscribersRef = useRef<Map<WebSocketEventType, Set<(payload: any) => void>>>(new Map())

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return

    setConnectionStatus('connecting')

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true)
      setConnectionStatus('connected')
      wsRef.current = ws // Now wsRef stores real WebSocket

      // Request initial state or presence
      sendMessage('presence_update', { userId: user.id, status: 'online' });
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false)
      setConnectionStatus('disconnected')
      // TODO: Implement reconnection logic here
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error')
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        // Dispatch based on type
        switch (type) {
          case 'game_move':
            notifySubscribers('game_move', payload)
            break
          case 'game_chat':
            setGameChatMessages(prev => [...prev, payload])
            notifySubscribers('game_chat', payload)
            break
          case 'game_invitation':
          case 'invitation_received':
          case 'wager_challenge':
          case 'friend_request':
            setPendingInvitations(prev => [...prev, payload])
            notifySubscribers(type as WebSocketEventType, payload)
            break
          case 'notification':
            setNotifications(prev => [payload, ...prev])
            notifySubscribers('notification', payload)
            break
          case 'user_status':
            // Update online users list based on status  
            if (payload && payload.status === 'online') {
              // Add to online users if not already there
              setOnlineUsers(prev => {
                if (prev.some(u => u.id === payload.userId)) {
                  return prev
                }
                // Fetch user details or use minimal info
                const newUser = { id: payload.userId, username: payload.username || 'User', status: 'online' }
                return [...prev, newUser as any]
              })
            } else if (payload.status === 'offline') {
              // Remove from online users
              setOnlineUsers(prev => prev.filter(u => u.id !== payload.userId))
            }
            notifySubscribers('user_status', payload)
            break
          case 'invitation_accepted':
            // If we are the sender, we should navigate to the game
            if (payload.acceptorId !== user?.id) {
              showToast('Défi accepté !', 'success', `${payload.acceptor} a accepté votre défi.`)
              if (payload.gameId) {
                navigate(`/game/${payload.gameId}`)
              }
            }
            notifySubscribers('invitation_accepted', payload)
            break
          case 'invitation_declined':
            if (payload.declinerId !== user?.id) {
              showToast('Défi refusé', 'error', `${payload.decliner || 'L\'adversaire'} a décliné l'invitation.`)
            }
            notifySubscribers('invitation_declined', payload)
            break
          case 'tournament_list_update':
            setTournaments(payload.data)
            notifySubscribers('tournament_list_update', payload)
            break
          case 'tournament_created':
            showToast('Tournoi créé !', 'success', 'Votre tournoi a été créé avec succès.')
            notifySubscribers('tournament_created', payload)
            break
          default:
            notifySubscribers(type as WebSocketEventType, payload)
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null
    }
  }, [user])

  const notifySubscribers = useCallback((event: WebSocketEventType, payload: any) => {
    subscribersRef.current.get(event)?.forEach(cb => cb(payload))
  }, [])

  const sendMessage = useCallback((type: WebSocketEventType, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [])

  const subscribe = useCallback((event: WebSocketEventType | string, callback: (payload: any) => void) => {
    const eventType = event as WebSocketEventType
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set())
    }
    subscribersRef.current.get(eventType)!.add(callback)

    return () => {
      subscribersRef.current.get(eventType)?.delete(callback)
    }
  }, [])

  const joinGame = useCallback((gameId: string) => {
    sendMessage('game_join', { gameId })
    setActiveGame({ id: gameId } as any)
    setGameChatMessages([])
  }, [sendMessage])

  const leaveGame = useCallback(() => {
    setActiveGame(null)
    setGameChatMessages([])
  }, [])

  const makeMove = useCallback((move: any) => {
    sendMessage('game_move', { move, gameId: activeGame?.id })
  }, [sendMessage, activeGame])

  const sendChatMessage = useCallback((content: string) => {
    if (!user || !activeGame) return

    sendMessage('game_chat', {
      gameId: activeGame.id,
      senderId: user.id,
      senderName: user.username,
      senderAvatar: user.avatarUrl,
      content,
    })
  }, [sendMessage, user, activeGame])

  const sendInvitation = useCallback((recipientId: string, gameType: string, timeControl: any) => {
    sendMessage('game_invitation', {
      fromUserId: user?.id,
      toUserId: recipientId,
      gameType,
      timeControl,
      variant: 'standard'
    })
  }, [sendMessage, user])

  const acceptInvitation = useCallback((invitationId: string) => {
    const inv = pendingInvitations.find(i => i.id === invitationId)
    if (!inv) return

    setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    sendMessage('invitation_accept', {
      invitationId,
      acceptorId: user?.id,
      senderId: inv.senderId || (inv as any).fromId // Compatibility with different naming
    })
  }, [sendMessage, user, pendingInvitations])

  const declineInvitation = useCallback((invitationId: string) => {
    const inv = pendingInvitations.find(i => i.id === invitationId)
    if (!inv) return

    setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    sendMessage('invitation_decline', {
      invitationId,
      declinerId: user?.id,
      senderId: inv.senderId || (inv as any).fromId
    })
  }, [sendMessage, user, pendingInvitations])

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const resignGame = useCallback(() => {
    sendMessage('game_resign', { gameId: activeGame?.id })
  }, [sendMessage, activeGame])

  const offerDraw = useCallback(() => {
    sendMessage('game_draw_offer', { gameId: activeGame?.id })
  }, [sendMessage, activeGame])

  const acceptDraw = useCallback(() => {
    sendMessage('game_draw_accept', { gameId: activeGame?.id })
  }, [sendMessage, activeGame])

  const declineDraw = useCallback(() => {
    sendMessage('game_draw_decline', { gameId: activeGame?.id })
  }, [sendMessage, activeGame])

  return (
    <RealTimeContext.Provider value={{
      isConnected,
      connectionStatus,
      activeGame,
      pendingInvitations,
      notifications,
      onlineUsers,
      gameChatMessages,
      tournaments,
      sendMessage,
      joinGame,
      leaveGame,
      makeMove,
      sendChatMessage,
      sendInvitation,
      acceptInvitation,
      declineInvitation,
      markNotificationRead,
      clearNotifications,
      resignGame,
      offerDraw,
      acceptDraw,
      declineDraw,
      subscribe,
    }}>
      {children}
    </RealTimeContext.Provider>
  )
}

export function useRealTime() {
  const context = useContext(RealTimeContext)
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider')
  }
  return context
}
