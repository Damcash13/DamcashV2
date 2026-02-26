import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Globe, Loader2, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { countries } from '../../utils/countries';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { themeColors } = useTheme();
    const { user, refreshUser, updateProfile } = useAuth();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        username: user?.username || '',
        bio: user?.bio || '',
        country: user?.country || '',
        avatar: user?.avatarUrl || '' // Map avatarUrl
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile({
                username: formData.username,
                bio: formData.bio,
                country: formData.country,
                avatarUrl: formData.avatar
            });
            await refreshUser();
            showToast('Profil mis à jour avec succès', 'success');
            onClose();
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            showToast(error.message || 'Erreur lors de la mise à jour', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        style={{ backgroundColor: themeColors.card }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold" style={{ color: themeColors.text }}>
                                Modifier le profil
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                                style={{ color: themeColors.textMuted }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/5 shadow-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                                        {formData.avatar ? (
                                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-bold opacity-20" style={{ color: themeColors.text }}>
                                                {formData.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                    >
                                        <Camera className="text-white" size={24} />
                                    </button>
                                </div>
                                <p className="text-xs mt-2" style={{ color: themeColors.textMuted }}>
                                    Cliquez pour changer l'avatar
                                </p>
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: themeColors.textMuted }}>
                                    Nom d'utilisateur
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        backgroundColor: themeColors.background,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }}
                                    required
                                />
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: themeColors.textMuted }}>
                                    Bio
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
                                    style={{
                                        backgroundColor: themeColors.background,
                                        borderColor: themeColors.border,
                                        color: themeColors.text
                                    }}
                                    placeholder="Parlez-nous de vous..."
                                />
                            </div>

                            {/* Country */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{ color: themeColors.textMuted }}>
                                    Pays
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: themeColors.textMuted }}>
                                        <Globe size={18} />
                                    </div>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                                        style={{
                                            backgroundColor: themeColors.background,
                                            borderColor: themeColors.border,
                                            color: themeColors.text
                                        }}
                                    >
                                        <option value="" disabled>Sélectionnez un pays</option>
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: themeColors.textMuted }}>
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl font-bold transition-all"
                                    style={{ backgroundColor: themeColors.hover, color: themeColors.text }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                    style={{ backgroundColor: themeColors.accent }}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
