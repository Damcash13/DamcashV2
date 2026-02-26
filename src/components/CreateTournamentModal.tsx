import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Clock, Calendar, Zap, Shield, Target, Coins } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

interface CreateTournamentModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (params: any) => void
}

const VARIANTS = {
    checkers: [
        { value: 'Standard', label: 'Standard', description: 'Règles classiques 10x10' },
        { value: 'Frisian', label: 'Frisian', description: 'Dames Frisonnes' },
        { value: 'Russian', label: 'Russian', description: 'Dames Russes' },
        { value: 'Brazilian', label: 'Brazilian', description: 'Dames Brésiliennes' },
    ],
    chess: [
        { value: 'Standard', label: 'Standard', description: 'Échecs classiques' },
        { value: 'Chess960', label: 'Chess960', description: 'Position aléatoire' },
    ]
}

const DURATIONS = [30, 45, 60, 90, 120]

export default function CreateTournamentModal({
    isOpen,
    onClose,
    onCreate
}: CreateTournamentModalProps) {
    const { gameType, themeColors } = useTheme()
    const { showToast } = useToast()
    const { user } = useAuth()

    const [name, setName] = useState('')
    const [variant, setVariant] = useState('Standard')
    const [duration, setDuration] = useState(60)
    const [rated, setRated] = useState(true)
    const [startTime, setStartTime] = useState('')
    const [entryFee, setEntryFee] = useState(0)

    const handleCreate = () => {
        if (!name.trim()) {
            showToast('Nom requis', 'error', 'Veuillez donner un nom au tournoi')
            return
        }

        const start = startTime ? new Date(startTime) : new Date(Date.now() + 5 * 60000)

        onCreate({
            name,
            gameType,
            variant,
            duration,
            rated,
            startTime: start,
            createdBy: user?.id,
            allowBerserk: true,
            minGames: 0,
            entryFee: Number(entryFee),
            prizePool: entryFee > 0 ? entryFee * 4 : 0 // Auto-calc prize pool for now
        })

        showToast('Tournoi créé !', 'success', 'Le tournoi a été ajouté à la liste.')
        onClose()
    }

    if (!isOpen) return null

    const variants = VARIANTS[gameType as keyof typeof VARIANTS] || VARIANTS.checkers

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] outline-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg pointer-events-auto"
                        >
                            <div
                                className={`rounded-2xl border shadow-2xl overflow-hidden`}
                                style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}
                            >
                                <div className={`p-6 border-b bg-gradient-to-r from-green-500/10 to-emerald-500/10`} style={{ borderColor: themeColors.border }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl bg-green-500/20`}>
                                                <Trophy className={`w-6 h-6 text-green-500`} />
                                            </div>
                                            <div>
                                                <h2 className={`text-2xl font-bold ${themeColors.text}`}>
                                                    Créer un Tournoi
                                                </h2>
                                                <p className={`text-sm ${themeColors.textMuted}`}>
                                                    Configurez votre arène {gameType === 'checkers' ? '♛ Dames' : '♔ Échecs'}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={onClose} className={`p-2 rounded-lg ${themeColors.cardHover} ${themeColors.text}`}>
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                    {/* Primary Info Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                            <Shield className={`w-5 h-5 ${themeColors.accent}`} />
                                            <h3 className={`font-bold ${themeColors.text} uppercase tracking-wider text-xs`}>Informations Générales</h3>
                                        </div>

                                        {/* Name */}
                                        <div className="group">
                                            <label className={`block font-semibold ${themeColors.text} mb-2 group-focus-within:text-green-400 transition-colors`}>
                                                Nom du Tournoi
                                            </label>
                                            <div className="relative">
                                                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50 group-focus-within:text-green-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Ex: Arena Nocturne Rapide"
                                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFFFFF' }}
                                                    className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/10 focus:border-green-500/50 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all text-lg font-medium placeholder:text-white/30`}
                                                />
                                            </div>
                                        </div>

                                        {/* Entry Fee */}
                                        <div className="group">
                                            <label className={`block font-semibold ${themeColors.text} mb-2 group-focus-within:text-yellow-400 transition-colors`}>
                                                Frais d'entrée (coins)
                                            </label>
                                            <div className="relative">
                                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50 group-focus-within:text-yellow-400 transition-colors" />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={entryFee}
                                                    onChange={(e) => setEntryFee(Number(e.target.value))}
                                                    placeholder="0 (gratuit)"
                                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFFFFF' }}
                                                    className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 border-white/10 focus:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 transition-all text-lg font-medium placeholder:text-white/30`}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Duration */}
                                            <div className="group">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock className={`w-4 h-4 ${themeColors.accent}`} />
                                                    <label className={`font-semibold ${themeColors.text} text-sm`}>Durée (minutes)</label>
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={duration}
                                                        onChange={(e) => setDuration(Number(e.target.value))}
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFFFFF' }}
                                                        className={`w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-green-500/50 focus:outline-none appearance-none transition-all font-bold cursor-pointer`}
                                                    >
                                                        {DURATIONS.map(d => (
                                                            <option key={d} value={d} className="bg-[#2C1810] text-white">{d} minutes</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-green-500">
                                                        ▼
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Start Time */}
                                            <div className="group">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className={`w-4 h-4 ${themeColors.accent}`} />
                                                    <label className={`font-semibold ${themeColors.text} text-sm`}>Heure de début</label>
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFFFFF' }}
                                                    className={`w-full px-4 py-4 rounded-xl border-2 border-white/10 focus:border-green-500/50 focus:outline-none transition-all font-medium cursor-pointer [color-scheme:dark]`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Format & Variant Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                            <Target className={`w-5 h-5 ${themeColors.accent}`} />
                                            <h3 className={`font-bold ${themeColors.text} uppercase tracking-wider text-xs`}>Format & Variante</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {variants.map((v) => (
                                                <button
                                                    key={v.value}
                                                    onClick={() => setVariant(v.value)}
                                                    className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden group/btn ${variant === v.value
                                                        ? `border-green-500 bg-green-500/10`
                                                        : `border-transparent ${themeColors.cardHover}`
                                                        }`}
                                                >
                                                    <div className={`font-bold text-sm ${themeColors.text} mb-1 transition-colors ${variant === v.value ? 'text-green-400' : ''}`}>{v.label}</div>
                                                    <div className={`text-xs ${themeColors.textMuted} leading-relaxed line-clamp-2`}>{v.description}</div>
                                                    {variant === v.value && (
                                                        <div className="absolute -right-2 -bottom-2 opacity-20">
                                                            <Trophy className="w-12 h-12 text-green-500" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Settings Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                            <Shield className={`w-5 h-5 ${themeColors.accent}`} />
                                            <h3 className={`font-bold ${themeColors.text} uppercase tracking-wider text-xs`}>Paramètres Avancés</h3>
                                        </div>

                                        <div
                                            onClick={() => setRated(!rated)}
                                            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                                            className={`p-5 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer group/rated transition-all hover:bg-white/10`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl transition-colors ${rated ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-white/40'}`}>
                                                    <Shield className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${themeColors.text} group-hover/rated:text-yellow-500 transition-colors`}>Tournoi Classé</div>
                                                    <div className={`text-xs ${themeColors.textMuted}`}>Les points Elo seront impactés</div>
                                                </div>
                                            </div>
                                            <div className={`w-14 h-8 rounded-full transition-all relative ${rated ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/10'}`}>
                                                <motion.div
                                                    animate={{ x: rated ? 24 : 4 }}
                                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-6 border-t bg-opacity-50`} style={{ borderColor: themeColors.border }}>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className={`flex-1 px-6 py-3 rounded-xl ${themeColors.buttonSecondary} ${themeColors.text} font-medium transition-colors`}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleCreate}
                                            className={`flex-1 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center justify-center gap-2`}
                                        >
                                            <Zap className="w-5 h-5" />
                                            Lancer le Tournoi
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
