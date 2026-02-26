import { useNavigate } from 'react-router-dom'
import UserPopup from './UserPopup'
import { getFlag } from '../utils/countries'

interface UsernameProps {
    userId: string
    username: string
    elo?: number
    title?: string
    country?: string
    className?: string
    showPopup?: boolean  // Enable/disable tooltip
    onClick?: () => void  // Custom click handler
}

export default function Username({
    userId,
    username,
    elo,
    title,
    country,
    className = '',
    showPopup = true,
    onClick
}: UsernameProps) {
    const navigate = useNavigate()

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (onClick) {
            onClick()
        } else {
            navigate(`/profile/${userId}`)
        }
    }

    const usernameElement = (
        <span
            onClick={handleClick}
            className={`cursor-pointer hover:underline transition-colors ${className} flex items-center gap-2`}
        >
            <span className="text-lg leading-none" title={country}>{getFlag(country)}</span>
            <span>{username}</span>
        </span>
    )

    if (!showPopup) {
        return usernameElement
    }

    return (
        <UserPopup
            userId={userId}
            username={username}
            elo={elo}
            title={title}
            country={country}
        >
            {usernameElement}
        </UserPopup>
    )
}
