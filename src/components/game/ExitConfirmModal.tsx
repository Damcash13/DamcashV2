import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ExitConfirmModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    themeColors: any
}

export default function ExitConfirmModal({ isOpen, onConfirm, onCancel, themeColors }: ExitConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-xl shadow-2xl z-50"
                        style={{
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.border,
                            borderWidth: '1px'
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/10 transition-colors"
                            style={{ color: themeColors.textMuted }}
                        >
                            <X size={20} />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${themeColors.accent}20` }}
                            >
                                <AlertTriangle
                                    size={32}
                                    style={{ color: themeColors.accent }}
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h2
                            className="text-2xl font-bold text-center mb-2"
                            style={{ color: themeColors.text }}
                        >
                            Abandonner cette partie ?
                        </h2>

                        {/* Description */}
                        <p
                            className="text-center mb-6 text-sm"
                            style={{ color: themeColors.textMuted }}
                        >
                            Si vous quittez maintenant, vous perdrez automatiquement cette partie. Votre adversaire remportera la victoire.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            {/* Cancel - Continue playing */}
                            <button
                                onClick={onCancel}
                                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all hover:scale-105"
                                style={{
                                    backgroundColor: themeColors.accent,
                                    color: themeColors.bg
                                }}
                            >
                                Continuer à jouer
                            </button>

                            {/* Confirm - Resign */}
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3 px-4 rounded-lg font-semibold transition-all hover:scale-105 border"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: '#ef4444',
                                    color: '#ef4444'
                                }}
                            >
                                Abandonner
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
