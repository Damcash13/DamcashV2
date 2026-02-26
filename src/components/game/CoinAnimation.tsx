import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CoinAnimationProps {
    show: boolean;
    amount: number;
    isVictory: boolean;
    onComplete: () => void;
}

interface Coin {
    id: number;
    x: number;       // Horizontal start position %
    delay: number;   // Animation delay
    duration: number;// Fall duration
    scale: number;   // Size (depth simulation)
    rotation: number;// Initial rotation
}

export default function CoinAnimation({ show, amount, isVictory, onComplete }: CoinAnimationProps) {
    const [coins, setCoins] = useState<Coin[]>([]);

    useEffect(() => {
        if (show) {
            // High density for "shower" effect
            const count = Math.min(Math.max(amount, 50), 100);

            const newCoins = Array.from({ length: count }, (_, i) => ({
                id: i,
                x: Math.random() * 100, // Spread across full width
                delay: Math.random() * 2, // Rapid fire start
                duration: 2 + Math.random() * 3, // Variable fall speed
                scale: 0.5 + Math.random() * 0.8, // Depth variation (small to large)
                rotation: Math.random() * 360
            }));
            setCoins(newCoins);

            const timeout = setTimeout(onComplete, 6000); // Allow full fall time
            return () => clearTimeout(timeout);
        }
    }, [show, amount, onComplete]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        initial={{
                            top: -100,
                            left: `${coin.x}%`,
                            opacity: 0,
                            scale: coin.scale,
                            rotate: coin.rotation,
                            rotateX: 0,
                            rotateY: 0
                        }}
                        animate={{
                            top: '120vh',
                            opacity: [0, 1, 1, 0], // Fade in then out at bottom
                            rotate: coin.rotation + 720, // Spin on Z axis
                            rotateX: Math.random() * 1080, // Tumble
                            rotateY: Math.random() * 1080  // Tumble
                        }}
                        transition={{
                            duration: coin.duration,
                            delay: coin.delay,
                            ease: "linear",
                            repeat: Infinity // Infinite fall for the duration of the component lifecycle? No, mapped once.
                        }}
                        className="absolute"
                    >
                        {/* 3D Gold Coin Visual */}
                        <div
                            className="w-12 h-12 rounded-full relative"
                            style={{
                                background: 'conic-gradient(from 45deg, #FFD700, #FDB931, #FFD700, #FDB931, #FFD700)',
                                boxShadow: 'inset 0 0 0 2px #B8860B, 0 5px 15px rgba(0,0,0,0.3)',
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {/* Inner Ring */}
                            <div className="absolute inset-1 rounded-full border-2 border-dashed border-[#B8860B]/50 flex items-center justify-center bg-yellow-400/20">
                                {/* Symbol */}
                                <span className="text-yellow-800 font-bold text-lg opacity-60">$</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Victory Banner */}
                {isVictory && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
                    >
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                            VICTOIRE !
                        </h1>
                        <p className="text-2xl font-bold text-white mt-2 drop-shadow-md">
                            +{amount} Coins
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
