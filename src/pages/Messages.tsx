import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, Send, MoreVertical, Phone, Video,
  UserPlus, Trash2, Bell, BellOff, ChevronLeft, Circle, Check, CheckCheck
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import Username from '../components/Username'
import { useRealTime } from '../contexts/RealTimeContext'


interface Message {
  id: string
  senderId: string
  content: string
  timestamp: Date
  read: boolean
}

interface Conversation {
  id: string
  participant: {
    id: string
    username: string
    avatarUrl?: string
    isOnline: boolean
    lastSeen?: Date
  }
  lastMessage?: Message
  unreadCount: number
  isMuted: boolean
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    participant: { id: '2', username: 'CheckerQueen', isOnline: true },
    lastMessage: { id: 'm1', senderId: '2', content: 'GG ! Belle partie 👏', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false },
    unreadCount: 2,
    isMuted: false,
  },
  {
    id: '2',
    participant: { id: '3', username: 'StrategyKing', isOnline: true },
    lastMessage: { id: 'm2', senderId: 'me', content: 'On refait une partie ?', timestamp: new Date(Date.now() - 30 * 60 * 1000), read: true },
    unreadCount: 0,
    isMuted: false,
  },
  {
    id: '3',
    participant: { id: '4', username: 'DamesMaster', isOnline: false, lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    lastMessage: { id: 'm3', senderId: '4', content: 'Merci pour les conseils !', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: true },
    unreadCount: 0,
    isMuted: true,
  },
  {
    id: '4',
    participant: { id: '5', username: 'TacticalPro', isOnline: false, lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    lastMessage: { id: 'm4', senderId: '5', content: 'Tu participes au tournoi de demain ?', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), read: true },
    unreadCount: 0,
    isMuted: false,
  },
]

const mockMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1-1', senderId: '2', content: 'Salut ! Ça te dit une partie ?', timestamp: new Date(Date.now() - 60 * 60 * 1000), read: true },
    { id: 'm1-2', senderId: 'me', content: 'Salut ! Oui, je suis dispo', timestamp: new Date(Date.now() - 55 * 60 * 1000), read: true },
    { id: 'm1-3', senderId: '2', content: 'Parfait, je crée la partie', timestamp: new Date(Date.now() - 50 * 60 * 1000), read: true },
    { id: 'm1-4', senderId: 'me', content: "C'était une super partie !", timestamp: new Date(Date.now() - 10 * 60 * 1000), read: true },
    { id: 'm1-5', senderId: '2', content: 'GG ! Belle partie 👏', timestamp: new Date(Date.now() - 5 * 60 * 1000), read: false },
    { id: 'm1-6', senderId: '2', content: 'Tu joues vraiment bien', timestamp: new Date(Date.now() - 4 * 60 * 1000), read: false },
  ],
  '2': [
    { id: 'm2-1', senderId: '3', content: 'Hey, tu as vu le tournoi ?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), read: true },
    { id: 'm2-2', senderId: 'me', content: 'Oui, je me suis inscrit !', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), read: true },
    { id: 'm2-3', senderId: 'me', content: 'On refait une partie ?', timestamp: new Date(Date.now() - 30 * 60 * 1000), read: true },
  ],
}

export default function Messages() {
  const { themeColors } = useTheme()
  const { user } = useAuth()
  const { sendMessage: wsSendMessage, subscribe } = useRealTime()

  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileList, setShowMobileList] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages[selectedConversation.id] || [])
      // Mark as read
      setConversations(prev => prev.map(c =>
        c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
      ))
    }
  }, [selectedConversation])

  // Real-time message subscription
  useEffect(() => {
    const unsub = subscribe('direct_message', (payload) => {
      const incomingMsg: Message = {
        id: payload.id,
        senderId: payload.senderId,
        content: payload.content,
        timestamp: new Date(payload.timestamp),
        read: payload.read,
      }

      // Add to messages if from selected conversation
      if (selectedConversation && (payload.senderId === selectedConversation.participant.id || payload.senderId === user?.id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === incomingMsg.id)) return prev
          return [...prev, incomingMsg]
        })
      }

      // Update conversations list
      setConversations(prev => {
        const otherId = payload.senderId === user?.id ? payload.recipientId : payload.senderId
        return prev.map(c => {
          if (c.participant.id === otherId) {
            return {
              ...c,
              lastMessage: incomingMsg,
              unreadCount: (payload.senderId !== user?.id && (!selectedConversation || selectedConversation.id !== c.id)) ? c.unreadCount + 1 : c.unreadCount
            }
          }
          return c
        })
      })
    })

    return unsub
  }, [subscribe, selectedConversation, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !user) return

    wsSendMessage('direct_message', {
      senderId: user.id,
      recipientId: selectedConversation.participant.id,
      content: messageInput.trim()
    })

    setMessageInput('')
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60 * 1000) return 'À l\'instant'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min`
    if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const filteredConversations = conversations.filter(c =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  return (
    <div className={`h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] ${themeColors.background} flex`}>
      {/* Conversations List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${showMobileList || !selectedConversation ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-white/10 ${themeColors.card}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-6 h-6 ${themeColors.accent}`} />
              <h1 className={`text-xl font-bold ${themeColors.text}`}>Messages</h1>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {totalUnread}
                </span>
              )}
            </div>
            <button className={`p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}>
              <UserPlus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeColors.textMuted}`} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${themeColors.input} ${themeColors.text} focus:outline-none focus:ring-2 ${themeColors.ring}`}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                onClick={() => {
                  setSelectedConversation(conversation)
                  setShowMobileList(false)
                }}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-white/5 ${selectedConversation?.id === conversation.id ? themeColors.hover : ''
                  }`}
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center font-semibold ${themeColors.text}`}>
                    {conversation.participant.username[0].toUpperCase()}
                  </div>
                  {conversation.participant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Username
                      userId={conversation.participant.id}
                      username={conversation.participant.username}
                      className={`font-medium ${themeColors.text} truncate`}
                    />
                    {conversation.lastMessage && (
                      <span className={`text-xs ${conversation.unreadCount > 0 ? themeColors.accent : themeColors.textMuted}`}>
                        {formatTime(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? themeColors.text : themeColors.textMuted}`}>
                      {conversation.lastMessage?.senderId === 'me' && (
                        <span className="mr-1">
                          {conversation.lastMessage.read ? (
                            <CheckCheck className="w-4 h-4 inline text-blue-400" />
                          ) : (
                            <Check className="w-4 h-4 inline" />
                          )}
                        </span>
                      )}
                      {conversation.lastMessage?.content || 'Aucun message'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-full ${themeColors.buttonPrimary} text-white text-xs font-bold`}>
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className={`w-12 h-12 ${themeColors.textMuted} mx-auto mb-4`} />
              <p className={themeColors.textMuted}>Aucune conversation</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${!showMobileList || !selectedConversation ? 'flex' : 'hidden'} md:flex flex-col flex-1 ${themeColors.background}`}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className={`flex items-center justify-between p-4 border-b border-white/10 ${themeColors.card}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className={`md:hidden p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center font-semibold ${themeColors.text}`}>
                    {selectedConversation.participant.username[0].toUpperCase()}
                  </div>
                  {selectedConversation.participant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
                  )}
                </div>
                <div>
                  <Username
                    userId={selectedConversation.participant.id}
                    username={selectedConversation.participant.username}
                    className={`font-semibold ${themeColors.text}`}
                  />
                  <span className={`text-xs ${themeColors.textMuted}`}>
                    {selectedConversation.participant.isOnline
                      ? 'En ligne'
                      : selectedConversation.participant.lastSeen
                        ? `Vu ${formatTime(selectedConversation.participant.lastSeen)}`
                        : 'Hors ligne'
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={`p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}>
                  <Phone className="w-5 h-5" />
                </button>
                <button className={`p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}>
                  <Video className="w-5 h-5" />
                </button>
                <button className={`p-2 rounded-lg ${themeColors.buttonSecondary} ${themeColors.text}`}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => {
                const isMe = message.senderId === 'me'
                const showDate = index === 0 ||
                  new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString()

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className={`text-xs px-3 py-1 rounded-full ${themeColors.buttonSecondary} ${themeColors.textMuted}`}>
                          {new Date(message.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'order-1' : ''}`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${isMe
                          ? `${themeColors.buttonPrimary} text-white rounded-br-sm`
                          : `${themeColors.card} ${themeColors.text} rounded-bl-sm`
                          }`}>
                          <p className="break-words">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                          <span className={`text-xs ${themeColors.textMuted}`}>
                            {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            message.read ? (
                              <CheckCheck className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Check className={`w-4 h-4 ${themeColors.textMuted}`} />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-4 border-t border-white/10 ${themeColors.card}`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrire un message..."
                  className={`flex-1 px-4 py-3 rounded-xl ${themeColors.input} ${themeColors.text} focus:outline-none focus:ring-2 ${themeColors.ring}`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`px-5 py-3 rounded-xl ${themeColors.buttonPrimary} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className={`w-16 h-16 ${themeColors.textMuted} mx-auto mb-4`} />
              <h3 className={`text-xl font-semibold ${themeColors.text} mb-2`}>
                Vos messages
              </h3>
              <p className={`${themeColors.textMuted}`}>
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
