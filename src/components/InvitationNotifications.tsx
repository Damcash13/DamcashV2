import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trophy, Coins, UserPlus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useInvitations } from '../hooks/useInvitations';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export default function InvitationNotifications() {
    const { themeColors, gameType } = useTheme();
    const { gameInvitations, wagerChallenges, friendRequests, acceptInvitation, declineInvitation } = useInvitations();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Local state to hide requests after action until they disappear from hook
    const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

    const allInvitations = [
        ...gameInvitations.map(inv => ({ ...inv, type: 'game' as const })),
        ...wagerChallenges.map(inv => ({ ...inv, type: 'wager' as const })),
        ...friendRequests.map(inv => ({ ...inv, type: 'friend' as const }))
    ].filter(inv => !processedIds.has(inv.id))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const handleAccept = async (invitation: any) => {
        setProcessedIds(prev => new Set(prev).add(invitation.id));

        if (invitation.type === 'friend') {
            try {
                const res = await fetch(`http://localhost:8000/api/friends/${invitation.id}/respond`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'accepted' })
                });
                if (res.ok) {
                    showToast('Ami ajouté !', 'success');
                } else {
                    showToast('Erreur lors de l\'acceptation', 'error');
                    setProcessedIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(invitation.id);
                        return newSet;
                    });
                }
            } catch (e) {
                console.error(e);
                showToast('Erreur de connexion', 'error');
            }
        } else {
            acceptInvitation(invitation.id, invitation.fromId);
            navigate(`/game/${invitation.id}`);
        }
    };

    const handleDecline = async (invitation: any) => {
        setProcessedIds(prev => new Set(prev).add(invitation.id));

        if (invitation.type === 'friend') {
            try {
                await fetch(`http://localhost:8000/api/friends/${invitation.id}/respond`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'declined' })
                });
                showToast('Demande refusée', 'info');
            } catch (e) {
                console.error(e);
            }
        } else {
            declineInvitation(invitation.id, invitation.fromId);
        }
    };

    if (allInvitations.length === 0) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
            <AnimatePresence>
                {allInvitations.map((invitation) => (
                    <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        className={`${themeColors.card} border-2 ${invitation.type === 'wager' ? 'border-yellow-500' :
                                invitation.type === 'friend' ? 'border-blue-500' :
                                    themeColors.border
                            } rounded-lg shadow-2xl p-4`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full ${invitation.type === 'wager' ? 'bg-yellow-500' :
                                    invitation.type === 'friend' ? 'bg-blue-500' :
                                        themeColors.accent
                                } flex items-center justify-center flex-shrink-0`}>
                                {invitation.type === 'wager' ? <Coins className="w-5 h-5 text-white" /> :
                                    invitation.type === 'friend' ? <UserPlus className="w-5 h-5 text-white" /> :
                                        <Trophy className="w-5 h-5 text-white" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-bold ${themeColors.text} truncate`}>
                                        {invitation.from}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(invitation.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <p className={`text-sm ${themeColors.textMuted} mb-2`}>
                                    {invitation.type === 'wager' ? (
                                        <>Wager challenge: <span className="font-bold text-yellow-500">{invitation.amount} coins</span></>
                                    ) : invitation.type === 'friend' ? (
                                        'Souhaite vous ajouter en ami'
                                    ) : (
                                        'Invitation à jouer'
                                    )}
                                </p>

                                {invitation.type !== 'friend' && (
                                    <div className="flex items-center gap-2 text-xs mb-3">
                                        <span className={`px-2 py-0.5 rounded ${themeColors.cardHover}`}>
                                            {invitation.gameType === 'checkers' ? '♛ Dames' : '♔ Échecs'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded ${themeColors.cardHover}`}>
                                            {invitation.timeControl}
                                        </span>
                                        {invitation.variant && (
                                            <span className={`px-2 py-0.5 rounded ${themeColors.cardHover}`}>
                                                {invitation.variant}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAccept(invitation)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Check className="w-4 h-4" />
                                        Accepter
                                    </button>
                                    <button
                                        onClick={() => handleDecline(invitation)}
                                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 ${themeColors.cardHover} hover:bg-red-500/20 ${themeColors.text} rounded-lg text-sm font-medium transition-colors`}
                                    >
                                        <X className="w-4 h-4" />
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
