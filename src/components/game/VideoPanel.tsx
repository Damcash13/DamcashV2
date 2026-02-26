import { useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, PhoneIncoming, Phone } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useWebRTC } from '../../hooks/useWebRTC'

interface VideoPanelProps {
    gameId: string
    opponentId?: string
    opponentName: string
    userName: string
    isMuted?: boolean
    isVideoOff?: boolean
    onToggleMute?: () => void
    onToggleVideo?: () => void
}

export default function VideoPanel({
    gameId,
    opponentId,
    opponentName,
    userName,
    isMuted = false,
    isVideoOff = false,
    onToggleMute,
    onToggleVideo
}: VideoPanelProps) {
    const { themeColors } = useTheme()

    // Use the WebRTC hook
    const {
        localStream,
        remoteStream,
        isCallActive,
        isCalling,
        incomingCall,
        requestCall,
        acceptCall,
        declineCall,
        endCall
    } = useWebRTC({ gameId, opponentId })

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    // Attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // Handle mute/video toggle on the stream tracks
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !isMuted)
            localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff)
        }
    }, [isMuted, isVideoOff, localStream])

    return (
        <div className="flex flex-col gap-4">
            {/* Opponent Video Feed */}
            <div className={`relative aspect-video ${themeColors.card} rounded-xl overflow-hidden shadow-lg border ${themeColors.border} group bg-neutral-900`}>

                {/* Incoming Call Overlay */}
                {incomingCall && !isCallActive && (
                    <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center p-4">
                        <div className="animate-bounce mb-4">
                            <PhoneIncoming className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-white text-lg font-bold mb-6 text-center">
                            Appel entrant de {opponentName}...
                        </h3>
                        <div className="flex gap-4">
                            <button
                                onClick={acceptCall}
                                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-500 transition-colors"
                            >
                                <Phone className="w-5 h-5" /> Accepter
                            </button>
                            <button
                                onClick={declineCall}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-500 transition-colors"
                            >
                                <PhoneOff className="w-5 h-5" /> Refuser
                            </button>
                        </div>
                    </div>
                )}

                {isCallActive && remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white`}>
                            {opponentName[0]?.toUpperCase()}
                        </div>
                        <p className="absolute mt-24 text-sm text-gray-500">
                            {isCalling ? "Appel en cours..." : opponentId ? "Hors ligne / En attente" : "Hors ligne"}
                        </p>
                    </div>
                )}

                {/* Name Label */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/40 px-2 py-1 rounded backdrop-blur-sm z-10">
                    <span className="text-white text-sm font-medium shadow-black drop-shadow-md">{opponentName}</span>
                    <span className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                </div>
            </div>

            {/* User Video Feed (Self View) */}
            <div className={`relative aspect-video ${themeColors.card} rounded-xl overflow-hidden shadow-lg border ${themeColors.border} bg-neutral-900`}>

                {isCallActive && localStream ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`}
                    />
                ) : null}

                {/* Fallback avatar if video off or not active */}
                {(!isCallActive || !localStream || isVideoOff) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white`}>
                            {userName[0]?.toUpperCase()}
                        </div>
                    </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm flex justify-center gap-3 z-10">
                    <button
                        onClick={onToggleMute}
                        className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        title={isMuted ? "Activer micro" : "Couper micro"}
                        disabled={!isCallActive}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {!isCallActive && !incomingCall && !isCalling ? (
                        <button
                            onClick={requestCall}
                            className="p-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20"
                            title="Démarrer appel"
                            disabled={!opponentId}
                        >
                            <Video className="w-5 h-5" />
                        </button>
                    ) : (isCallActive || isCalling) ? (
                        <button
                            onClick={endCall}
                            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 animate-pulse"
                            title="Arrêter appel"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    ) : null}

                    <button
                        onClick={onToggleVideo}
                        className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        title={isVideoOff ? "Activer caméra" : "Couper caméra"}
                        disabled={!isCallActive}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
