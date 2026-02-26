import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trophy, Coins, MessageSquare, Swords } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'

interface ChallengeModalProps {
    isOpen: boolean
    onClose: () => void
    opponentId: string
    opponentName: string
    gameType: 'checkers' | 'chess'
    onSendChallenge: (params: {
        timeControl: string
        variant: string
        wager?: number
        message?: string
    }) => void
}

const TIME_CONTROLS = [
    { value: '1+0', label: 'Bullet 1+0', description: '1 min' },
    { value: '3+0', label: 'Blitz 3+0', description: '3 min' },
    { value: '3+2', label: 'Blitz 3+2', description: '3 min + 2s' },
    { value: '5+0', label: 'Blitz 5+0', description: '5 min' },
    { value: '5+3', label: 'Blitz 5+3', description: '5 min + 3s' },
    { value: '10+0', label: 'Rapid 10+0', description: '10 min' },
    { value: '10+5', label: 'Rapid 10+5', description: '10 min + 5s' },
    { value: '15+10', label: 'Rapid 15+10', description: '15 min + 10s' },
    { value: '30+0', label: 'Classical 30+0', description: '30 min' },
    { value: '1 day', label: '1 Day/mv', description: 'Correspondence' },
    { value: '3 days', label: '3 Days/mv', description: 'Correspondence' },
    { value: '7 days', label: '7 Days/mv', description: 'Correspondence' },
    { value: '14 days', label: '14 Days/mv', description: 'Correspondence' },
]

const VARIANTS = {
    checkers: [
        { value: 'Standard', label: 'Standard', description: 'Règles classiques' },
        { value: 'International', label: 'International', description: 'Damier 10x10' },
    ],
    chess: [
        { value: 'Standard', label: 'Standard', description: 'Échecs classiques' },
        { value: 'Chess960', label: 'Chess960', description: 'Position aléatoire' },
    ]
}

const WAGER_AMOUNTS = [0, 10, 25, 50, 100, 250, 500]

export default function ChallengeModal({
    isOpen,
    onClose,
    opponentId,
    opponentName,
    gameType,
    onSendChallenge
}: ChallengeModalProps) {
    const { themeColors } = useTheme()
    const { showToast } = useToast()

    const [timeControl, setTimeControl] = useState('3+2')
    const [variant, setVariant] = useState('Standard')
    const [wager, setWager] = useState(0)
    const [message, setMessage] = useState('')

    const handleSend = () => {
        onSendChallenge({
            timeControl,
            variant,
            wager: wager > 0 ? wager : undefined,
            message: message.trim() || undefined
        })

        showToast(
            'Défi envoyé!',
            'success',
            `En attente de la réponse de ${opponentName}...`
        )

        onClose()
    }

    if (!isOpen) return null

    const variants = VARIANTS[gameType]

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] outline-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg pointer-events-auto"
                        >
                            <div className={`rounded-2xl ${themeColors.card} border ${themeColors.border} shadow-2xl overflow-hidden`}>
                                {/* Header */}
                                <div className={`p-6 border-b ${themeColors.border} bg-gradient-to-r ${themeColors.accent} bg-opacity-10`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${themeColors.accent} bg-opacity-20`}>
                                                <Swords className={`w-6 h-6 ${themeColors.accent}`} />
                                            </div>
                                            <div>
                                                <h2 className={`text-2xl font-bold ${themeColors.text}`}>
                                                    Défier {opponentName}
                                                </h2>
                                                <p className={`text-sm ${themeColors.textMuted}`}>
                                                    {gameType === 'checkers' ? '♛ Dames' : '♔ Échecs'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className={`p-2 rounded-lg ${themeColors.cardHover} ${themeColors.text} transition-colors`}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                    {/* Time Control */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className={`w-5 h-5 ${themeColors.accent}`} />
                                            <label className={`font-semibold ${themeColors.text}`}>
                                                Contrôle du temps
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {TIME_CONTROLS.map((tc) => (
                                                <button
                                                    key={tc.value}
                                                    onClick={() => setTimeControl(tc.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${timeControl === tc.value
                                                        ? `border-[${themeColors.accent}] ${themeColors.accent} bg-opacity-20`
                                                        : `border-transparent ${themeColors.cardHover}`
                                                        }`}
                                                >
                                                    <div className={`font-bold text-sm ${themeColors.text}`}>
                                                        {tc.value}
                                                    </div>
                                                    <div className={`text-xs ${themeColors.textMuted}`}>
                                                        {tc.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Variant */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Trophy className={`w-5 h-5 ${themeColors.accent}`} />
                                            <label className={`font-semibold ${themeColors.text}`}>
                                                Variante
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {variants.map((v) => (
                                                <button
                                                    key={v.value}
                                                    onClick={() => setVariant(v.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${variant === v.value
                                                        ? `border-[${themeColors.accent}] ${themeColors.accent} bg-opacity-20`
                                                        : `border-transparent ${themeColors.cardHover}`
                                                        }`}
                                                >
                                                    <div className={`font-bold text-sm ${themeColors.text}`}>
                                                        {v.label}
                                                    </div>
                                                    <div className={`text-xs ${themeColors.textMuted}`}>
                                                        {v.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Wager (Optional) */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Coins className={`w-5 h-5 text-yellow-500`} />
                                            <label className={`font-semibold ${themeColors.text}`}>
                                                Mise (optionnel)
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {WAGER_AMOUNTS.map((amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() => setWager(amount)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${wager === amount
                                                        ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                                                        : `border-transparent ${themeColors.cardHover}`
                                                        }`}
                                                >
                                                    <div className={`font-bold text-sm ${wager === amount ? 'text-yellow-500' : themeColors.text}`}>
                                                        {amount === 0 ? 'Aucune' : `${amount}`}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message (Optional) */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <MessageSquare className={`w-5 h-5 ${themeColors.accent}`} />
                                            <label className={`font-semibold ${themeColors.text}`}>
                                                Message (optionnel)
                                            </label>
                                        </div>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Prêt pour une revanche ?"
                                            maxLength={100}
                                            rows={2}
                                            className={`w-full px-4 py-3 rounded-lg ${themeColors.input} ${themeColors.text} focus:outline-none focus:ring-2 ${themeColors.ring} resize-none`}
                                        />
                                        <div className={`text-xs ${themeColors.textMuted} text-right mt-1`}>
                                            {message.length}/100
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={`p-6 border-t ${themeColors.border} bg-opacity-50`}>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className={`flex-1 px-6 py-3 rounded-xl ${themeColors.buttonSecondary} ${themeColors.text} font-medium transition-colors`}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            className={`flex-1 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center justify-center gap-2`}
                                        >
                                            <Swords className="w-5 h-5" />
                                            Envoyer l'invitation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
