import React from 'react'
import { Zap, Clock, Target, Crown, Settings } from 'lucide-react'

interface GameModesGridProps {
    themeColors: any
    onQuickPlay: (timeControl: string) => void
    onCreateGame: () => void
    gameType: 'chess' | 'checkers'
}

export default function GameModesGrid({ themeColors, onQuickPlay, onCreateGame, gameType }: GameModesGridProps) {

    // Quick Pairing Config
    const quickPairings = [
        { id: '1+0', name: 'Bullet', time: '1+0', type: 'bullet', icon: <Zap className="w-5 h-5" /> },
        { id: '2+1', name: 'Bullet', time: '2+1', type: 'bullet', icon: <Zap className="w-5 h-5" /> },
        { id: '3+0', name: 'Blitz', time: '3+0', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
        { id: '3+2', name: 'Blitz', time: '3+2', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
        { id: '5+0', name: 'Blitz', time: '5+0', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
        { id: '5+3', name: 'Blitz', time: '5+3', type: 'blitz', icon: <Clock className="w-5 h-5" /> },
        { id: '10+0', name: 'Rapide', time: '10+0', type: 'rapid', icon: <Target className="w-5 h-5" /> },
        { id: '15+15', name: 'Classique', time: '15+15', type: 'classical', icon: <Crown className="w-5 h-5" /> },
        { id: 'custom', name: 'Custom', time: 'Custom', type: 'custom', icon: <Settings className="w-5 h-5" /> },
    ]

    return (
        <div className="grid grid-cols-3 gap-0">
            {quickPairings.map((mode, idx) => (
                <button
                    key={mode.id}
                    onClick={() => {
                        if (mode.id === 'custom') {
                            onCreateGame()
                        } else {
                            onQuickPlay(mode.id);
                        }
                    }}
                    className={`
                        relative p-6 flex flex-col items-center justify-center gap-1 transition-all
                        border border-opacity-10
                        ${themeColors.cardHover}
                        group
                    `}
                    style={{
                        borderColor: themeColors.border,
                        borderRightWidth: (idx + 1) % 3 === 0 ? 0 : 1,
                        borderBottomWidth: idx >= 6 ? 0 : 1
                    }}
                >
                    <span className={`text-2xl font-light ${themeColors.text} group-hover:scale-110 transition-transform`}>
                        {mode.time}
                    </span>
                    <span className={`text-xs uppercase tracking-wider ${themeColors.textMuted} font-medium`}>
                        {mode.name}
                    </span>
                </button>
            ))}
        </div>
    )
}
