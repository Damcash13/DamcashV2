import { useEffect, useState } from 'react'
import { Clock, Zap } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface TournamentTimerProps {
    endTime: Date
    status: 'upcoming' | 'ongoing' | 'completed' | 'finished'
    onTimeUp?: () => void
}

export default function TournamentTimer({ endTime, status, onTimeUp }: TournamentTimerProps) {
    const { themeColors } = useTheme()
    const [timeRemaining, setTimeRemaining] = useState(0)

    useEffect(() => {
        const updateTime = () => {
            const now = Date.now()
            const end = new Date(endTime).getTime()
            const remaining = Math.max(0, Math.floor((end - now) / 1000))
            setTimeRemaining(remaining)

            if (remaining === 0 && onTimeUp) {
                onTimeUp()
            }
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)

        return () => clearInterval(interval)
    }, [endTime, onTimeUp])

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getTimerColor = () => {
        if (status === 'completed' || status === 'finished') return 'text-gray-500'
        if (timeRemaining < 60) return 'text-red-500 animate-pulse'
        if (timeRemaining < 300) return 'text-orange-500'
        return themeColors.accent
    }

    const getLabel = () => {
        if (status === 'upcoming') return 'Démarre dans'
        if (status === 'ongoing') return 'Temps restant'
        return 'Terminé'
    }

    return (
        <div className={`${themeColors.card} rounded-xl border ${themeColors.border} p-4`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {status === 'ongoing' ? (
                        <Zap className={`w-5 h-5 ${getTimerColor()}`} />
                    ) : (
                        <Clock className={`w-5 h-5 ${themeColors.textMuted}`} />
                    )}
                    <span className={`text-sm font-medium ${themeColors.textMuted}`}>{getLabel()}</span>
                </div>
                <div className={`text-3xl font-bold font-mono ${getTimerColor()}`}>
                    {status === 'completed' || status === 'finished' ? '--:--' : formatTime(timeRemaining)}
                </div>
            </div>

            {/* Progress bar */}
            {status === 'ongoing' && (
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${timeRemaining < 60 ? 'bg-red-500' :
                            timeRemaining < 300 ? 'bg-orange-500' :
                                'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(100, (timeRemaining / 3600) * 100)}%` }}
                    />
                </div>
            )}
        </div>
    )
}
