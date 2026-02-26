import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (arg1: any, arg2?: any, arg3?: any) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_COLORS = {
  success: 'border-green-500 bg-green-500/10',
  error: 'border-red-500 bg-red-500/10',
  warning: 'border-yellow-500 bg-yellow-500/10',
  info: 'border-blue-500 bg-blue-500/10',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((arg1: any, arg2?: any, arg3?: any) => {
    let newToast: Toast;
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`

    if (typeof arg1 === 'string') {
      // Legacy signature: (message/title, type, message2?)
      // Based on usage: showToast('Message', 'success')
      newToast = {
        id,
        title: arg1,
        type: arg2 || 'info', // default to info if missing
        message: arg3,
        duration: 4000
      }
    } else {
      // Object signature
      newToast = { ...arg1, id }
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = newToast.duration ?? 4000
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }, [showToast])

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }, [showToast])

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }, [showToast])

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = TOAST_ICONS[toast.type]

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className={`
                  relative p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm
                  ${TOAST_COLORS[toast.type]}
                `}
                style={{ background: 'var(--bg-card)' }}
              >
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
                  <div>
                    <h4 className="font-semibold text-sm">{toast.title}</h4>
                    {toast.message && (
                      <p className="text-sm opacity-80 mt-1">{toast.message}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
