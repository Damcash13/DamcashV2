import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface UserPopoverProps {
    user: {
        username: string
        avatar?: string
        country?: string
        bio?: string
        eloCheckers?: number
        eloChess?: number
    } | undefined
    children: React.ReactNode
    className?: string
    align?: 'left' | 'center' | 'right'
}

export default function UserPopover({ user, children, className = '', align = 'center' }: UserPopoverProps) {
    const { themeColors } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

    if (!user) return <>{children}</>

    const getAlignClass = () => {
        switch (align) {
            case 'left': return 'left-0'
            case 'right': return 'right-0'
            case 'center': return 'left-1/2 -translate-x-1/2'
        }
    }

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {children}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute z-50 ${getAlignClass()} bottom-full mb-2 w-64 pointer-events-none`}
                        style={{ minWidth: '200px' }}
                    >
                        <div className={`${themeColors.card} rounded-xl shadow-2xl border border-white/10 p-4 overflow-hidden backdrop-blur-sm`}>
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-full ${themeColors.buttonSecondary} flex items-center justify-center overflow-hidden shrink-0 border border-white/10`}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-400">{user.username.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-white truncate text-lg">
                                        {user.username}
                                    </div>
                                    {user.country && (
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> {user.country}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <div className="text-xs text-gray-300 italic mb-3 line-clamp-3 bg-white/5 p-2 rounded border border-white/5">
                                    "{user.bio}"
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                                <div className="text-center bg-black/20 rounded p-2">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Checkers</div>
                                    <div className="font-mono text-orange-400 font-bold text-lg">{user.eloCheckers || '1200'}</div>
                                </div>
                                <div className="text-center bg-black/20 rounded p-2">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Chess</div>
                                    <div className="font-mono text-blue-400 font-bold text-lg">{user.eloChess || '1200'}</div>
                                </div>
                            </div>
                        </div>
                        {/* Arrow/Pointer visual */}
                        <div className={`absolute bottom-[-6px] ${align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'left' ? 'left-4' : 'right-4'} w-3 h-3 rotate-45 ${themeColors.card} border-b border-r border-white/10`}></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
