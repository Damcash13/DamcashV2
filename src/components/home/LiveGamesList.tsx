import React from 'react'
import { Clock, Users, Zap, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MiniCheckersBoard, MiniChessBoard } from '../game/MiniBoards'
import Username from '../Username'
import { formatTimeControl } from '../../data/mockLiveGames'
import type { LiveGame } from '../../api/gamesAPI'

interface LiveGamesListProps {
    liveGames: LiveGame[]
    gameType: 'chess' | 'checkers'
    themeColors: any
    t: (key: string) => string
}

export default function LiveGamesList({ liveGames, gameType, themeColors, t }: LiveGamesListProps) {
    const navigate = useNavigate()

    const filteredGames = liveGames
        .filter(g => g.gameType === gameType)
        // Sort primarily by spectators (most followed)
        .sort((a: any, b: any) => {
            if ((b.spectators || 0) !== (a.spectators || 0)) {
                return (b.spectators || 0) - (a.spectators || 0);
            }
            // Tie-breaker: Player ratings
            const eloA = (a.whitePlayer?.eloCheckers || a.whitePlayer?.eloChess || 1200) +
                (a.blackPlayer?.eloCheckers || a.blackPlayer?.eloChess || 1200);
            const eloB = (b.whitePlayer?.eloCheckers || b.whitePlayer?.eloChess || 1200) +
                (b.blackPlayer?.eloCheckers || b.blackPlayer?.eloChess || 1200);
            return eloB - eloA;
        })
        .slice(0, 4)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGames.map(game => (
                <div
                    key={game.id}
                    onClick={() => navigate(`/spectate/${game.id}`)}
                    className={`${themeColors.card} border ${themeColors.border} rounded-lg overflow-hidden cursor-pointer hover:border-opacity-50 hover:scale-105 transition-all group`}
                    style={{ borderColor: themeColors.accent }}
                >
                    {/* Board Preview */}
                    <div className="relative aspect-square w-full">
                        {game.gameType === 'checkers' ? (
                            <MiniCheckersBoard size={300} />
                        ) : (
                            <MiniChessBoard size={300} />
                        )}

                        {/* LIVE badge overlay */}
                        <span className="absolute top-2 right-2 text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold animate-pulse shadow-lg">
                            {t('common.live')}
                        </span>
                    </div>

                    {/* Game Info */}
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold flex items-center gap-1 ${game.gameType === 'checkers' ? 'text-[#7fa650]' : 'text-[#3692e7]'}`}>
                                {game.gameType === 'checkers' ? <Users className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                                {game.gameType === 'checkers' ? 'Dames' : 'Échecs'}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] flex items-center gap-0.5 text-gray-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatTimeControl(game.timeControl)}
                                </span>
                                <span className="text-[10px] flex items-center gap-0.5 text-gray-400">
                                    <Users className="w-2.5 h-2.5" />
                                    {game.spectators}
                                </span>
                            </div>
                        </div>

                        {/* Players */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <img src={game.whitePlayer?.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                <Username
                                    userId={game.whitePlayer?.id || ''}
                                    username={game.whitePlayer?.username || 'Unknown'}
                                    elo={game.gameType === 'checkers' ? game.whitePlayer?.eloCheckers : game.whitePlayer?.eloChess}
                                    className={`${themeColors.text} font-medium flex-1 truncate`}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <img src={game.blackPlayer?.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                <Username
                                    userId={game.blackPlayer?.id || ''}
                                    username={game.blackPlayer?.username || 'Unknown'}
                                    elo={game.gameType === 'checkers' ? game.blackPlayer?.eloCheckers : game.blackPlayer?.eloChess}
                                    className={`${themeColors.text} font-medium flex-1 truncate`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
