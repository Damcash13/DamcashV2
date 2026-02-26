import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Users, ScrollText, Send, Eye, Coins, Plus, X, Trophy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useSeries } from '../../contexts/SeriesContext'
import { motion } from 'framer-motion'
import Username from '../Username'


interface GameSidebarProps {
    chatMessages: any[]
    spectators: any[] // TODO: Define type
    moveHistory: string[]
    onSendMessage: (msg: string) => void
    currentMoveIndex: number
    onNavigateMove: (index: number) => void
    activeTab?: 'chat' | 'moves' | 'spectators'
}

export default function GameSidebar({
    chatMessages,
    spectators,
    moveHistory,
    onSendMessage,
    currentMoveIndex,
    onNavigateMove,
    activeTab: controlledTab
}: GameSidebarProps) {
    const { themeColors } = useTheme()
    const { user, updateWallet } = useAuth() // Get user context
    const { currentSeries } = useSeries()
    const [localTab, setLocalTab] = useState<'chat' | 'moves' | 'spectators'>('chat')
    const activeTab = controlledTab || localTab
    const [chatInput, setChatInput] = useState('')
    const chatRef = useRef<HTMLDivElement>(null)
    const [showDeposit, setShowDeposit] = useState(false)
    const [depositAmount, setDepositAmount] = useState(0)

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight
        }
    }, [chatMessages, activeTab])

    const handleSend = () => {
        if (!chatInput.trim()) return
        onSendMessage(chatInput)
        setChatInput('')
    }

    const handleDeposit = async (amount: number) => {
        await updateWallet(amount, amount)
        setShowDeposit(false)
    }

    return (
        <div className={`flex flex-col h-full ${themeColors.card} border ${themeColors.border} rounded-xl overflow-hidden shadow-sm relative`}>
            {/* Wallet Header */}
            <div className={`px-4 py-3 border-b flex justify-between items-center bg-black/10`} style={{ borderColor: themeColors.border }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-[10px] uppercase font-bold opacity-70 ${themeColors.text}`}>Votre Solde</span>
                        <span className={`text-sm font-bold ${themeColors.text}`}>{user?.coins?.toLocaleString() || 0}</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeposit(!showDeposit)}
                    className={`p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20 active:scale-95`}
                    title="Recharger"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Series Info (if active) */}
            {currentSeries && currentSeries.isActive && (
                <div className="px-4 py-2 border-b bg-black/20 flex items-center justify-between" style={{ borderColor: themeColors.border }}>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className={`text-xs font-bold uppercase ${themeColors.text}`}>
                            Série en cours ({currentSeries.currentGameNumber}/{currentSeries.totalGames})
                        </span>
                    </div>
                    <div className="flex gap-3 font-mono font-bold text-sm">
                        <span className="text-green-500">{currentSeries.scores.me}</span>
                        <span className="opacity-50">-</span>
                        <span className="text-red-500">{currentSeries.scores.opponent}</span>
                    </div>
                </div>
            )}

            {/* Quick Deposit Overlay */}
            {showDeposit && (
                <div className="absolute top-[60px] left-0 right-0 p-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className={`${themeColors.card} border ${themeColors.border} rounded-xl shadow-2xl p-4`}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`text-sm font-bold ${themeColors.text}`}>Rechargement Rapide</h3>
                            <button onClick={() => setShowDeposit(false)} className={`p-1 hover:bg-black/10 rounded ${themeColors.text}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[100, 500, 1000].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleDeposit(amount)}
                                    className={`py-2 px-1 rounded-lg border ${themeColors.border} hover:bg-green-500 hover:text-white hover:border-green-500 transition-all text-xs font-bold ${themeColors.text}`}
                                >
                                    +{amount}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-center mt-3 opacity-50">Cliquez pour ajouter immédiatement (Simulation)</p>
                    </div>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowDeposit(false)} />
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-opacity-10" style={{ borderColor: themeColors.border }}>
                {[
                    { id: 'chat', icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
                    { id: 'moves', icon: <ScrollText className="w-4 h-4" />, label: 'Coups' },
                    { id: 'spectators', icon: <Users className="w-4 h-4" />, label: `Spectateurs (${spectators.length})` }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => controlledTab ? null : setLocalTab(tab.id as any)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors
                    ${activeTab === tab.id
                                ? `${themeColors.bg} ${themeColors.text} border-b-2 border-primary`
                                : `${themeColors.card} ${themeColors.textMuted} hover:${themeColors.text}`
                            }
                `}
                        style={{
                            borderBottomColor: activeTab === tab.id ? themeColors.text : 'transparent',
                            backgroundColor: activeTab === tab.id ? themeColors.bg : 'transparent'
                        }}
                    >
                        {tab.icon}
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                    <div className="flex flex-col h-full">
                        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                    <MessageCircle className="w-8 h-8 mb-2" />
                                    <p className="text-sm">Démarrez la conversation !</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${msg.isSelf
                                            ? `${themeColors.accent} text-white rounded-br-none`
                                            : `${themeColors.element} ${themeColors.text} rounded-bl-none`
                                            }`}>
                                            {msg.content}
                                        </div>
                                        <Username
                                            userId={msg.userId || ''}
                                            username={msg.sender}
                                            className="text-[10px] opacity-50 mt-1 cursor-pointer hover:underline"
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={`p-3 border-t ${themeColors.border} flex gap-2 bg-opacity-50`}>
                            <input
                                className={`flex-1 bg-transparent border ${themeColors.border} rounded-lg px-3 py-2 text-sm ${themeColors.text} focus:outline-none focus:ring-1 focus:ring-primary`}
                                placeholder="Message..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                            />
                            <button onClick={handleSend} className={`p-2 rounded-lg ${themeColors.accent} text-white hover:opacity-90`}>
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* MOVES TAB */}
                {activeTab === 'moves' && (
                    <div className="h-full overflow-y-auto p-2">
                        <table className={`w-full text-sm ${themeColors.text}`}>
                            <thead>
                                <tr className="opacity-50 text-xs uppercase text-left">
                                    <th className="p-2">#</th>
                                    <th className="p-2">White</th>
                                    <th className="p-2">Black</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                                    <tr key={i} className={`${themeColors.cardHover} rounded`}>
                                        <td className="p-2 opacity-50 font-mono w-8">{i + 1}.</td>
                                        <td
                                            className={`p-2 cursor-pointer rounded ${currentMoveIndex === i * 2 ? 'bg-primary/20 font-bold' : ''}`}
                                            onClick={() => onNavigateMove(i * 2)}
                                        >
                                            {moveHistory[i * 2]}
                                        </td>
                                        <td
                                            className={`p-2 cursor-pointer rounded ${currentMoveIndex === i * 2 + 1 ? 'bg-primary/20 font-bold' : ''}`}
                                            onClick={() => moveHistory[i * 2 + 1] && onNavigateMove(i * 2 + 1)}
                                        >
                                            {moveHistory[i * 2 + 1] || ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {moveHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                                <ScrollText className="w-8 h-8" />
                                <p className="text-sm">Aucun coup joué</p>
                            </div>
                        )}
                    </div>
                )}

                {/* SPECTATORS TAB */}
                {activeTab === 'spectators' && (
                    <div className="h-full overflow-y-auto p-4">
                        <h3 className={`text-xs font-bold uppercase opacity-50 mb-3 ${themeColors.text}`}>En ligne ({spectators.length})</h3>
                        <div className="space-y-3">
                            {spectators.map((spec, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-bold`}>
                                        {spec.username[0]}
                                    </div>
                                    <div>
                                        <Username
                                            userId={spec.id || `spec-${i}`}
                                            username={spec.username}
                                            elo={spec.elo || 1500}
                                            className={`text-sm font-medium ${themeColors.text}`}
                                        />
                                        <p className={`text-xs ${themeColors.textMuted}`}>Spectateur • {spec.elo || 1500}</p>
                                    </div>
                                </div>
                            ))}
                            {spectators.length === 0 && (
                                <div className="text-center opacity-50 py-10">
                                    <Eye className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Aucun spectateur pour le moment.</p>
                                </div>
                            )}
                        </div>

                        {/* Spectator Chat Area (Mini) */}
                        <div className="mt-8 pt-4 border-t opacity-50">
                            <p className="text-xs text-center">Le chat des spectateurs est visible par les joueurs.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
