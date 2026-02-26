import { Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BalanceDisplayProps {
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function BalanceDisplay({
    className = '',
    showLabel = true,
    size = 'md'
}: BalanceDisplayProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const sizeClasses = {
        sm: 'text-sm gap-1',
        md: 'text-base gap-2',
        lg: 'text-xl gap-3'
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24
    };

    const handleClick = () => {
        navigate('/wallet');
    };

    return (
        <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`flex items-center ${sizeClasses[size]} ${className} cursor-pointer hover:opacity-80 transition-opacity`}
            title="Cliquez pour gérer votre portefeuille"
        >
            <Coins
                className="text-yellow-500"
                size={iconSizes[size]}
            />
            <div className="flex items-baseline gap-1">
                {showLabel && (
                    <span className="text-gray-400 text-xs uppercase tracking-wide">
                        Solde:
                    </span>
                )}
                <motion.span
                    key={user.coins}
                    initial={{ scale: 1.2, color: '#fbbf24' }}
                    animate={{ scale: 1, color: '#fbbf24' }}
                    transition={{ duration: 0.3 }}
                    className="font-bold text-yellow-400"
                >
                    {user.coins.toLocaleString()}
                </motion.span>
                <span className="text-yellow-500 text-xs">coins</span>
            </div>
        </motion.div>
    );
}
