import { useState, useEffect, useRef, useCallback } from 'react'
import { useRealTime } from '../contexts/RealTimeContext'
import { useAuth } from '../contexts/AuthContext'

interface UseWebRTCProps {
    gameId: string
    opponentId?: string
}

export function useWebRTC({ gameId, opponentId }: UseWebRTCProps) {
    const { sendMessage, subscribe } = useRealTime()

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isCallActive, setIsCallActive] = useState(false)

    // Signaling States
    const [isCalling, setIsCalling] = useState(false) // You are calling
    const [incomingCall, setIncomingCall] = useState(false) // Someone is calling you
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new')

    const peerRef = useRef<RTCPeerConnection | null>(null)

    // Initialize Peer Connection
    const createPeer = useCallback(() => {
        if (peerRef.current) return peerRef.current

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        })

        peer.onicecandidate = (event) => {
            if (event.candidate && opponentId) {
                sendMessage('video_signal', {
                    targetUserId: opponentId,
                    signal: { type: 'ice-candidate', candidate: event.candidate }
                })
            }
        }

        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0])
        }

        peer.onconnectionstatechange = () => {
            setConnectionState(peer.connectionState)
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                cleanupCall()
            }
        }

        peerRef.current = peer
        return peer
    }, [opponentId, sendMessage])

    // 1. Initiator starts the process by sending a request
    const requestCall = useCallback(() => {
        if (!opponentId) return
        setIsCalling(true)
        sendMessage('video_signal', {
            targetUserId: opponentId,
            signal: { type: 'call_request' }
        })
    }, [opponentId, sendMessage])

    // 2. Receiver accepts the call
    const acceptCall = useCallback(async () => {
        if (!opponentId) return
        setIncomingCall(false)
        setIsCallActive(true)

        try {
            // Get local stream
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setLocalStream(stream)

            // Signals the caller that we accepted
            sendMessage('video_signal', {
                targetUserId: opponentId,
                signal: { type: 'call_accepted' }
            })
        } catch (err) {
            console.error('Error accepting call:', err)
            cleanupCall()
        }
    }, [opponentId, sendMessage])

    const declineCall = useCallback(() => {
        if (!opponentId) return
        setIncomingCall(false)
        sendMessage('video_signal', {
            targetUserId: opponentId,
            signal: { type: 'call_declined' }
        })
    }, [opponentId, sendMessage])

    // 3. Caller receives acceptance -> Starts actual WebRTC negotiation
    const startNegotiation = async () => {
        if (!opponentId) return
        setIsCalling(false)
        setIsCallActive(true)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setLocalStream(stream)

            const peer = createPeer()
            stream.getTracks().forEach(track => peer.addTrack(track, stream))

            const offer = await peer.createOffer()
            await peer.setLocalDescription(offer)

            sendMessage('video_signal', {
                targetUserId: opponentId,
                signal: { type: 'offer', sdp: offer }
            })
        } catch (err) {
            console.error('Error negotiation:', err)
            cleanupCall()
        }
    }

    // Answer negotiation (Handling the offer)
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
        if (!opponentId) return

        try {
            // Create peer if it doesn't exist (it should if we accepted)
            const peer = peerRef.current || createPeer()

            // Ensure we have 'localStream' before adding tracks (might have set it in acceptCall)
            // If we are late, we add tracks now
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    // Avoid adding duplicate tracks
                    if (!peer.getSenders().find(s => s.track?.id === track.id)) {
                        peer.addTrack(track, localStream)
                    }
                })
            }

            await peer.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peer.createAnswer()
            await peer.setLocalDescription(answer)

            sendMessage('video_signal', {
                targetUserId: opponentId,
                signal: { type: 'answer', sdp: answer }
            })
        } catch (err) {
            console.error('Error handling offer:', err)
        }
    }

    // Handle Incoming Signals
    useEffect(() => {
        const handleSignal = async (payload: any) => {
            if (payload.senderId !== opponentId) return

            const { signal } = payload

            try {
                switch (signal.type) {
                    case 'call_request':
                        setIncomingCall(true)
                        break
                    case 'call_accepted':
                        await startNegotiation()
                        break
                    case 'call_declined':
                        setIsCalling(false)
                        alert("L'adversaire a refusé l'appel.")
                        break
                    case 'offer':
                        await handleOffer(signal.sdp)
                        break
                    case 'answer':
                        const peer = peerRef.current
                        if (peer) {
                            await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                        }
                        break
                    case 'ice-candidate':
                        const peerIce = peerRef.current
                        if (peerIce) {
                            await peerIce.addIceCandidate(new RTCIceCandidate(signal.candidate))
                        }
                        break
                }
            } catch (err) {
                console.error('Error handling signal:', err)
            }
        }

        const unsubscribe = subscribe('video_signal', handleSignal)
        return () => {
            unsubscribe()
        }
    }, [opponentId, createPeer, subscribe, startNegotiation, localStream])

    // Cleanup
    const cleanupCall = useCallback(() => {
        localStream?.getTracks().forEach(t => t.stop())
        setLocalStream(null)
        setRemoteStream(null)
        setIsCallActive(false)
        setIsCalling(false)
        setIncomingCall(false)
        peerRef.current?.close()
        peerRef.current = null
    }, [localStream])

    // Manual End Call
    const endCall = useCallback(() => {
        cleanupCall()
        if (opponentId) {
            sendMessage('video_signal', {
                targetUserId: opponentId,
                signal: { type: 'call_ended' } // Optional: Notify other side
            })
        }
    }, [cleanupCall, opponentId, sendMessage])

    return {
        localStream,
        remoteStream,
        isCallActive,
        isCalling,
        incomingCall,
        connectionState,
        requestCall,
        acceptCall,
        declineCall,
        endCall
    }
}
