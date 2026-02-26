import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MessageCircle,
    Swords,
    History,
    User as UserIcon,
    Target,
    Zap,
    Flame
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useInvitations } from '../hooks/useInvitations';
import ChallengeModal from './ChallengeModal';

interface UserPopupProps {
    userId: string;
    username: string;
    elo?: number;
    title?: string; // GM, IM, etc.
    country?: string; // Country code or name
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function UserPopup({ userId, username, elo, title, country = 'FR', children, side = 'top' }: UserPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const { themeColors, gameType } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    // Don't listen for incoming invitations in every popup!
    const { sendGameInvitation, sendWagerChallenge } = useInvitations({ listen: false });
    const timeoutRef = useRef<number>();

    const isSelf = user?.id === userId;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    const handleChallenge = () => {
        setIsOpen(false);
        // Small delay to ensure the hover popup closing animation starts or completes
        // and doesn't conflict with the modal's entry.
        setTimeout(() => setShowChallengeModal(true), 50);
    };

    const handleSendChallenge = (params: {
        timeControl: string;
        variant: string;
        wager?: number;
        message?: string;
    }) => {
        if (params.wager && params.wager > 0) {
            sendWagerChallenge(userId, params.wager, gameType, params.timeControl, params.variant);
        } else {
            sendGameInvitation(userId, gameType, params.timeControl, params.variant);
        }
    };

    const handleMessage = () => {
        navigate(`/messages?user=${userId}`);
        setIsOpen(false);
    };

    const handleProfile = () => {
        navigate(`/profile/${userId}`);
        setIsOpen(false);
    };

    return (
        <>
            <div
                className="relative inline-block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="cursor-pointer hover:underline decoration-blue-400 decoration-2 underline-offset-2" onClick={handleProfile}>
                    {children}
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute z-50 ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2 w-72`}
                        >
                            <div className={`${themeColors.card} border ${themeColors.border} rounded-xl shadow-2xl overflow-hidden`}>
                                {/* Header / Banner */}
                                <div className={`h-16 ${themeColors.accent} opacity-20 relative`}>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                                </div>

                                <div className="px-4 pb-4 -mt-8 relative">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-end gap-2">
                                            <div className={`w-16 h-16 rounded-xl border-4 ${themeColors.card} bg-gray-800 flex items-center justify-center overflow-hidden shadow-lg`}>
                                                <span className="text-2xl font-bold uppercase">{username.substring(0, 2)}</span>
                                            </div>
                                            <div className="mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    {title && (
                                                        <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-bold px-1 rounded uppercase">
                                                            {title}
                                                        </span>
                                                    )}
                                                    <span className={`font-bold text-lg ${themeColors.text}`}>{username}</span>
                                                    {country && (
                                                        <span className="grayscale opacity-50 text-xs" title={country}>🏳️</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-green-500">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    En ligne
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className={`grid grid-cols-2 gap-2 mb-4 p-2 rounded-lg bg-black/20 text-xs ${themeColors.textMuted}`}>
                                        <div className="flex items-center gap-2" title="Bullet Rating">
                                            <Zap className="w-3 h-3 text-yellow-500" />
                                            <span>Bullet: <strong>{elo ? elo - 50 : 1500}?</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2" title="Blitz Rating">
                                            <Flame className="w-3 h-3 text-orange-500" />
                                            <span>Blitz: <strong>{elo || 1500}?</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2" title="Rapid Rating">
                                            <History className="w-3 h-3 text-green-500" />
                                            <span>Rapid: <strong>{elo ? elo + 25 : 1500}?</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2" title="Games Played">
                                            <Target className="w-3 h-3 text-blue-500" />
                                            <span>Games: <strong>1,240</strong></span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!isSelf ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleChallenge}
                                                className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors`}
                                                title="Défier"
                                            >
                                                <Swords className="w-3 h-3" />
                                                Défier
                                            </button>
                                            <button
                                                onClick={handleMessage}
                                                className={`flex-1 py-1.5 rounded flex items-center justify-center gap-2 ${themeColors.cardHover} border ${themeColors.border} ${themeColors.text} text-xs font-bold transition-colors`}
                                                title="Message"
                                            >
                                                <MessageCircle className="w-3 h-3" />
                                                Message
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                navigate('/lobby');
                                            }}
                                            className={`w-full py-1.5 rounded flex items-center justify-center gap-2 ${themeColors.accent} text-white text-xs font-bold transition-colors`}
                                        >
                                            <Swords className="w-3 h-3" />
                                            Créer une partie
                                        </button>
                                    )}

                                    <button
                                        onClick={handleProfile}
                                        className={`w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-xs ${themeColors.textMuted} hover:text-white transition-colors`}
                                    >
                                        <UserIcon className="w-3 h-3" />
                                        Voir le profil complet
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Challenge Modal */}
            <ChallengeModal
                isOpen={showChallengeModal}
                onClose={() => setShowChallengeModal(false)}
                opponentId={userId}
                opponentName={username}
                gameType={gameType}
                onSendChallenge={handleSendChallenge}
            />
        </>
    );
}
