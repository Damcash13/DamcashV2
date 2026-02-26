import { API_BASE_URL } from '../config'

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
}

export const socialAPI = {
    // Friends
    getFriends: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch friends')
            const data = await response.json()
            return data.friends || []
        } catch (error) {
            console.error('Error fetching friends:', error)
            return []
        }
    },

    getFriendRequests: async (): Promise<any[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/requests`, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch friend requests')
            const data = await response.json()
            return data.requests || []
        } catch (error) {
            console.error('Error fetching friend requests:', error)
            return []
        }
    },

    sendFriendRequest: async (userId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/add`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ userId })
            })
            return response.ok
        } catch (error) {
            console.error('Error sending friend request:', error)
            return false
        }
    },

    acceptFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/accept/${requestId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            })
            return response.ok
        } catch (error) {
            console.error('Error accepting friend request:', error)
            return false
        }
    },

    rejectFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/friends/reject/${requestId}`, {
                method: 'POST',
                headers: getAuthHeaders()
            })
            return response.ok
        } catch (error) {
            console.error('Error rejecting friend request:', error)
            return false
        }
    },

    // Messages
    getMessages: async (recipientId?: string): Promise<any[]> => {
        try {
            const url = recipientId
                ? `${API_BASE_URL}/api/messages?recipientId=${recipientId}`
                : `${API_BASE_URL}/api/messages`

            const response = await fetch(url, {
                headers: getAuthHeaders()
            })
            if (!response.ok) throw new Error('Failed to fetch messages')
            const data = await response.json()
            return data.messages || []
        } catch (error) {
            console.error('Error fetching messages:', error)
            return []
        }
    },

    sendMessage: async (recipientId: string, content: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ recipientId, content })
            })
            return response.ok
        } catch (error) {
            console.error('Error sending message:', error)
            return false
        }
    },

    markMessageRead: async (messageId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: getAuthHeaders()
            })
            return response.ok
        } catch (error) {
            console.error('Error marking message as read:', error)
            return false
        }
    }
}
