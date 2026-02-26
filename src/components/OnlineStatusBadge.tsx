import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OnlineStatusBadgeProps {
    userId: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
}

export default function OnlineStatusBadge({ userId, size = 'sm', showText = false }: OnlineStatusBadgeProps) {
    const { getStatus } = useOnlineStatus();
    const status = getStatus(userId);

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    };

    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        offline: 'bg-gray-500'
    };

    const statusText = {
        online: 'En ligne',
        away: 'Absent',
        offline: 'Hors ligne'
    };

    return (
        <div className="flex items-center gap-1.5">
            <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full ring-2 ring-black/20`} />
            {showText && (
                <span className="text-xs text-gray-400">{statusText[status]}</span>
            )}
        </div>
    );
}
