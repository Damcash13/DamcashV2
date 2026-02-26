// Backend API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// WebSocket Configuration  
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

// Other configuration constants
export const MAX_RETRIES = 3
export const RETRY_DELAY = 1000
