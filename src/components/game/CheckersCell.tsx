import React, { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CheckerPiece from './CheckerPiece'
import type { CheckerPiece as CheckerPieceType, PlayerColor, Position } from '../../types'
import { getPieceColor, isKing } from '../../utils/checkersLogic'

interface CheckersCellProps {
    row: number
    col: number
    piece: CheckerPieceType
    isSelected: boolean
    isValid: boolean
    isCapture: boolean
    isLastMove: boolean
    isPremoveSource: boolean
    isPremoveTarget: boolean
    isHovered: boolean
    isDraggable: boolean
    flipped: boolean
    handleCellClick: (row: number, col: number) => void
    handleDrag: (event: any, info: any) => void
    handleDragEnd: (event: any, info: any, row: number, col: number) => void
}

const CheckersCell = memo(({
    row,
    col,
    piece,
    isSelected,
    isValid,
    isCapture,
    isLastMove,
    isPremoveSource,
    isPremoveTarget,
    isHovered,
    isDraggable,
    flipped,
    handleCellClick,
    handleDrag,
    handleDragEnd
}: CheckersCellProps) => {

    const isLight = (row + col) % 2 === 0

    return (
        <div
            data-row={row}
            data-col={col}
            className={`
            cell
            ${isLight ? 'cell-light' : 'cell-dark'}
            ${isSelected || isPremoveSource ? 'cell-highlight' : ''}
            ${isLastMove && !isSelected ? 'cell-highlight' : ''}
            ${isValid && !isCapture ? 'cell-valid' : ''}
            ${isCapture ? 'cell-capture' : ''}
            ${isPremoveTarget ? 'bg-blue-400/50' : ''}
            ${isHovered ? 'bg-white/20' : ''}
            `}
            onClick={() => handleCellClick(row, col)}
        >
            <AnimatePresence mode="wait">
                {piece && (
                    <div style={{ width: '100%', height: '100%' }}>
                        <motion.div
                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            drag={!!isDraggable}
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.1}
                            dragMomentum={false}
                            whileDrag={{ scale: 1.2, zIndex: 100, cursor: 'grabbing' }}
                            onDrag={(e, info) => handleDrag(e, info)}
                            onDragEnd={(e, info) => handleDragEnd(e, info, row, col)}
                            className={isDraggable ? "cursor-grab active:cursor-grabbing" : ""}
                        >
                            <CheckerPiece
                                color={getPieceColor(piece)!}
                                isKing={isKing(piece)}
                                isSelected={isSelected}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
})

export default CheckersCell
