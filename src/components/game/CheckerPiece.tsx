import { motion } from 'framer-motion'
import type { PlayerColor } from '../../types'

interface CheckerPieceProps {
  color: PlayerColor
  isKing: boolean
  isSelected?: boolean
}

export default function CheckerPiece({ color, isKing, isSelected = false }: CheckerPieceProps) {
  // Styles for white pieces
  const whiteStyle = {
    background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e0e0e0 20%, #dcdcdc 100%)',
    boxShadow: `
      inset 0 0 4px 1px rgba(255,255,255,0.8),
      inset 0 -2px 4px rgba(0,0,0,0.1),
      0 2px 4px rgba(0,0,0,0.3),
      0 6px 6px rgba(0,0,0,0.1)
    `,
    border: '1px solid #c0c0c0'
  }

  // Styles for black pieces
  const blackStyle = {
    background: 'radial-gradient(circle at 30% 30%, #444444 0%, #1a1a1a 40%, #000000 100%)',
    boxShadow: `
      inset 0 0 5px 1px rgba(255,255,255,0.2),
      inset 0 -2px 4px rgba(0,0,0,0.3),
      0 2px 4px rgba(0,0,0,0.4),
      0 6px 6px rgba(0,0,0,0.2)
    `,
    border: '1px solid #000000'
  }

  const pieceStyle = color === 'white' ? whiteStyle : blackStyle

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <motion.div
        className={`
          w-[85%] h-[85%] rounded-full relative
          transition-transform duration-200
        `}
        style={{
          ...pieceStyle,
          transform: isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
          zIndex: isSelected ? 30 : 10,
          boxShadow: isSelected
            ? `${pieceStyle.boxShadow}, 0 0 0 3px #7fa650` // Highlight ring
            : pieceStyle.boxShadow
        }}
      >
        {/* Inner concentric rings for texture details */}
        <div className="absolute inset-[10%] rounded-full border border-black/5 dark:border-white/5" />
        <div className="absolute inset-[25%] rounded-full border border-black/5 dark:border-white/5" />

        {/* King Indicator (Stacked Piece Look) */}
        {isKing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[60%] h-[60%] rounded-full opacity-30 bg-black/20 dark:bg-white/10 shadow-inner" />
            <span className={`absolute text-2xl font-bold ${color === 'white' ? 'text-black/30' : 'text-white/30'}`}>
              ♔
            </span>
          </div>
        )}
      </motion.div>
    </div>
  )
}
