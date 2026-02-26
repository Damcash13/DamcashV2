import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useGameSounds } from '../../hooks/useGameSounds'
import type { Position, PlayerColor, AIDifficulty } from '../../types'
import {
  createBoardFromFEN,
  getPieceColor,
  getPieceSymbol,
  getValidMoves,
  executeMove,
  getGameStatus,
  getAIMove,
  moveToNotation,
  type ChessBoard as ChessBoardType,
  type ChessPiece
} from '../../utils/chessLogic'
import { chessEngine } from '../../services/stockfish'
import { boardToFEN } from '../../utils/chessLogic'
import { Lightbulb } from 'lucide-react'

interface ChessBoardProps {
  vsAI?: boolean
  aiDifficulty?: AIDifficulty
  playerColor?: PlayerColor
  onGameEnd?: (result: 'white' | 'black' | 'draw') => void
  onMove?: (from: Position, to: Position, notation: string) => void
  spectatorMode?: boolean
  initialFEN?: string
  remoteMove?: { from: Position; to: Position } | null
}

export default function ChessBoard({
  vsAI = false,
  aiDifficulty = 'medium',
  playerColor = 'white',
  onGameEnd,
  onMove,
  spectatorMode = false,
  initialFEN,
  remoteMove
}: ChessBoardProps) {
  const [board, setBoard] = useState<ChessBoardType>(() => createBoardFromFEN(initialFEN))
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>('white')
  // Premove State
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate'>('playing')
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [flipped, setFlipped] = useState(playerColor === 'black')
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null)
  const [bestMoveHint, setBestMoveHint] = useState<{ from: Position; to: Position } | null>(null)
  const [evaluation, setEvaluation] = useState<number>(0)

  const { playMove, playCapture, playCheck, playGameEnd } = useGameSounds()

  // Handle remote moves
  useEffect(() => {
    if (remoteMove) {
      handleMove(remoteMove.from, remoteMove.to)
    }
  }, [remoteMove])

  // Define helper functions and callbacks first
  const getBoardPiece = (row: number, col: number): ChessPiece => {
    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col
    return board[actualRow][actualCol]
  }

  const handleMove = useCallback((from: Position, to: Position) => {
    const piece = board[from.row][from.col]
    const newBoard = executeMove(board, from, to)
    const notation = moveToNotation(from, to, piece)

    setBoard(newBoard)
    setLastMove({ from, to })
    setSelectedPiece(null)
    setValidMoves([])
    setMoveHistory(prev => [...prev, notation])
    setCurrentTurn(prev => prev === 'white' ? 'black' : 'white')

    onMove?.(from, to, notation)

    // Sounds
    if (notation.includes('#') || notation.includes('=')) {
      playGameEnd()
    } else if (notation.includes('+')) {
      playCheck()
    } else if (notation.includes('x')) {
      playCapture()
    } else {
      playMove()
    }
  }, [board, onMove, playMove, playCapture, playCheck, playGameEnd])

  const handleDragEnd = useCallback((event: any, info: any, row: number, col: number) => {
    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col
    const fromPos = { row: actualRow, col: actualCol }

    // Use elementsFromPoint to find the target cell through the dragged element
    const elements = document.elementsFromPoint(info.point.x, info.point.y)
    const cell = elements.find(el => el.classList.contains('cell')) as HTMLElement

    if (cell && cell.dataset.row && cell.dataset.col) {
      const targetRow = parseInt(cell.dataset.row)
      const targetCol = parseInt(cell.dataset.col)
      // data-row/col are always logical coordinates as set in the render loop

      const toPos = { row: targetRow, col: targetCol }

      // Logic for Turn vs Premove
      const isLocalGame = !vsAI
      if (isLocalGame || currentTurn === playerColor) {
        // Normal Move
        setSelectedPiece(fromPos) // Select briefly to get valid moves to validate
        // We need 'validMoves' for validation, but they might not be set if we just dragged.
        // So we calculate valid moves on the fly for drop validation
        const moves = getValidMoves(board, fromPos, currentTurn)
        const isValid = moves.some(m => m.row === toPos.row && m.col === toPos.col)

        if (isValid) {
          handleMove(fromPos, toPos)
        } else {
          // Invalid move, snap back handled by framer-motion layout
          setSelectedPiece(null)
        }
      } else {
        // Premove Logic
        // We allow any move as premove? Or only pseudo-valid?
        // Let's allow any non-same square move for now as "intention"
        if (fromPos.row !== toPos.row || fromPos.col !== toPos.col) {
          setPremove({ from: fromPos, to: toPos })
        }
      }
    }
    setHoveredCell(null)
  }, [board, currentTurn, playerColor, flipped, handleMove])

  // New onDrag handler for visual feedback
  const handleDrag = useCallback((event: any, info: any) => {
    const elements = document.elementsFromPoint(info.point.x, info.point.y)
    const cell = elements.find(el => el.classList.contains('cell')) as HTMLElement

    if (cell && cell.dataset.row && cell.dataset.col) {
      const row = parseInt(cell.dataset.row)
      const col = parseInt(cell.dataset.col)
      // Avoid unnecessary state updates
      setHoveredCell(prev => (prev?.row === row && prev?.col === col) ? prev : { row, col })
    } else {
      setHoveredCell(null)
    }
  }, [])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing' || spectatorMode || isThinking) return
    if (vsAI && currentTurn !== playerColor) return

    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col

    const clickedPiece = board[actualRow][actualCol]
    const clickedColor = clickedPiece ? getPieceColor(clickedPiece) : null

    // If clicking on own piece, select it
    if (clickedColor === currentTurn) {
      const moves = getValidMoves(board, { row: actualRow, col: actualCol }, currentTurn)
      setSelectedPiece({ row: actualRow, col: actualCol })
      setValidMoves(moves)
      return
    }

    // If piece selected, try to move
    if (selectedPiece) {
      const isValidTarget = validMoves.some(m => m.row === actualRow && m.col === actualCol)
      if (isValidTarget) {
        handleMove(selectedPiece, { row: actualRow, col: actualCol })
      } else {
        setSelectedPiece(null)
        setValidMoves([])
      }
    }
  }, [board, currentTurn, selectedPiece, validMoves, gameStatus, spectatorMode, isThinking, vsAI, playerColor, flipped, handleMove])

  // Update handleCellClick to clear premove if user interacts
  const handleCellClickEnhanced = useCallback((row: number, col: number) => {
    if (premove) setPremove(null) // Cancel premove on interaction
    handleCellClick(row, col)
  }, [premove, handleCellClick])

  // EFFECT HOOKS (Now safe to use handleMove)

  // Check game status
  useEffect(() => {
    const status = getGameStatus(board, currentTurn)
    setGameStatus(status)

    if (status === 'checkmate') {
      const winner = currentTurn === 'white' ? 'black' : 'white'
      onGameEnd?.(winner)
    } else if (status === 'stalemate') {
      onGameEnd?.('draw')
    }
  }, [board, currentTurn, onGameEnd])

  // Execute Premove when turn changes
  useEffect(() => {
    if (premove && currentTurn === playerColor && gameStatus === 'playing') {
      // Validate premove
      const moves = getValidMoves(board, premove.from, currentTurn)
      const isValid = moves.some(m => m.row === premove.to.row && m.col === premove.to.col)

      if (isValid) {
        handleMove(premove.from, premove.to)
      }
      setPremove(null)
    }
  }, [currentTurn, playerColor, gameStatus, premove, board, handleMove]) // Added dependencies

  // Effect for board evaluation and best move hint
  useEffect(() => {
    if (gameStatus !== 'playing') return

    const fen = boardToFEN(board, currentTurn)
    chessEngine.setEvaluationListener(setEvaluation)

  }, [board, currentTurn, gameStatus])

  const getHint = useCallback(() => {
    if (gameStatus !== 'playing' || isThinking) return

    setIsThinking(true)
    const fen = boardToFEN(board, currentTurn)

    chessEngine.getBestMove(fen, 20, (bestMoveStr) => {
      // Stockfish returns moves like "e2e4"
      const files = 'abcdefgh'
      const from = {
        row: 8 - parseInt(bestMoveStr[1]),
        col: files.indexOf(bestMoveStr[0])
      }
      const to = {
        row: 8 - parseInt(bestMoveStr[3]),
        col: files.indexOf(bestMoveStr[2])
      }

      setBestMoveHint({ from, to })
      setIsThinking(false)

      // Clear hint after 3 seconds
      setTimeout(() => setBestMoveHint(null), 3000)
    })
  }, [board, currentTurn, gameStatus, isThinking])

  // AI move using Stockfish
  useEffect(() => {
    if (gameStatus !== 'playing' || spectatorMode) return
    if (!vsAI || currentTurn === playerColor) return

    setIsThinking(true)

    const fen = boardToFEN(board, currentTurn)
    const difficultyMap: Record<AIDifficulty, number> = {
      easy: 0,
      medium: 5,
      hard: 12,
      expert: 20
    }

    chessEngine.getBestMove(fen, difficultyMap[aiDifficulty], (bestMoveStr) => {
      const files = 'abcdefgh'
      const from = {
        row: 8 - parseInt(bestMoveStr[1]),
        col: files.indexOf(bestMoveStr[0])
      }
      const to = {
        row: 8 - parseInt(bestMoveStr[3]),
        col: files.indexOf(bestMoveStr[2])
      }

      handleMove(from, to)
      setIsThinking(false)
    })
  }, [currentTurn, vsAI, playerColor, gameStatus, spectatorMode, board, aiDifficulty, handleMove])

  const isValidMoveTarget = useCallback((row: number, col: number) => {
    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col
    return validMoves.some(m => m.row === actualRow && m.col === actualCol)
  }, [validMoves, flipped])

  const isSelectedSquare = useCallback((row: number, col: number) => {
    if (!selectedPiece) return false
    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col
    return selectedPiece.row === actualRow && selectedPiece.col === actualCol
  }, [selectedPiece, flipped])

  const isLastMoveSquare = useCallback((row: number, col: number) => {
    if (!lastMove) return false
    const actualRow = flipped ? 7 - row : row
    const actualCol = flipped ? 7 - col : col
    return (lastMove.from.row === actualRow && lastMove.from.col === actualCol) ||
      (lastMove.to.row === actualRow && lastMove.to.col === actualCol)
  }, [lastMove, flipped])



  return (
    <div className="w-full flex flex-col items-center">
      <div className="board-container">
        {/* Board Labels - Columns */}
        <div className="absolute -top-6 left-0 right-0 flex justify-around px-2">
          {(flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(letter => (
            <span key={letter} className="text-xs opacity-60 font-mono">{letter}</span>
          ))}
        </div>

        {/* Board Labels - Rows */}
        <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-around py-2">
          {(flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]).map(num => (
            <span key={num} className="text-xs opacity-60 font-mono">{num}</span>
          ))}
        </div>

        {/* Premove Indicator */}
        {premove && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow animate-pulse">
            Premove set
          </div>
        )}

        {/* Board */}
        <div className="board board-8x8 relative">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => {
              const isLight = (row + col) % 2 === 0
              const piece = getBoardPiece(row, col)
              const pieceColor = piece ? getPieceColor(piece) : null
              const actualRow = flipped ? 7 - row : row
              const actualCol = flipped ? 7 - col : col
              const isSelected = isSelectedSquare(row, col)
              const isValid = isValidMoveTarget(row, col)
              const isLastMove = isLastMoveSquare(row, col)
              const isPremoveSource = premove?.from.row === actualRow && premove?.from.col === actualCol
              const isPremoveTarget = premove?.to.row === actualRow && premove?.to.col === actualCol
              const isHovered = hoveredCell?.row === actualRow && hoveredCell?.col === actualCol
              const isBestMoveSource = bestMoveHint?.from.row === actualRow && bestMoveHint?.from.col === actualCol
              const isBestMoveTarget = bestMoveHint?.to.row === actualRow && bestMoveHint?.to.col === actualCol
              const hasEnemyPiece = isValid && piece && pieceColor !== currentTurn

              return (
                <div
                  key={`${row}-${col}`}
                  data-row={actualRow}
                  data-col={actualCol}
                  className={`
                    cell
                    ${isLight ? 'cell-light' : 'cell-dark'}
                    ${isSelected || isPremoveSource ? 'cell-highlight' : ''}
                    ${isLastMove && !isSelected ? 'cell-highlight' : ''}
                    ${isValid && !hasEnemyPiece ? 'cell-valid' : ''}
                    ${hasEnemyPiece ? 'cell-capture' : ''}
                    ${isPremoveTarget ? 'bg-blue-400/50' : ''} 
                    ${isHovered ? 'bg-white/20' : ''}
                    ${isBestMoveSource ? 'ring-4 ring-yellow-400/60 ring-inset' : ''}
                    ${isBestMoveTarget ? 'ring-4 ring-green-400/60 ring-inset' : ''}
                  `}
                  onClick={() => handleCellClickEnhanced(row, col)}
                >
                  <AnimatePresence mode="wait">
                    {piece && (
                      <motion.div
                        key={`piece-${row}-${col}`}
                        layout
                        drag={!spectatorMode && (
                          (!vsAI && pieceColor === currentTurn) ||
                          (vsAI && pieceColor === playerColor)
                        )}
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        onDrag={(e, info) => handleDrag(e, info)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, row, col)}
                        whileDrag={{ scale: 1.2, zIndex: 100, cursor: 'grabbing' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`
                          chess-piece cursor-grab active:cursor-grabbing
                          ${pieceColor === 'white' ? 'chess-piece-white' : 'chess-piece-black'}
                          ${piece.toLowerCase() === 'p' ? 'chess-pawn' : ''}
                        `}
                        style={{
                          color: pieceColor === 'white' ? '#FFFFFF' : '#000000',
                          textShadow: pieceColor === 'white'
                            ? '0 2px 4px rgba(0,0,0,0.5)'
                            : '0 1px 2px rgba(255,255,255,0.2)',
                        }}
                      >
                        {getPieceSymbol(piece)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
              <div className="flex items-center gap-3 px-6 py-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                />
                <span className="font-semibold">IA réfléchit...</span>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameStatus !== 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-6 rounded-xl"
                style={{ background: 'var(--bg-card)' }}
              >
                <h2 className="text-2xl font-display font-bold mb-2">
                  {gameStatus === 'checkmate' ? 'Échec et Mat!' : 'Pat!'}
                </h2>
                <p className="text-lg opacity-80">
                  {gameStatus === 'checkmate'
                    ? `${currentTurn === 'white' ? 'Noirs' : 'Blancs'} gagnent!`
                    : 'Match Nul!'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Board Controls */}
      <div className="w-full flex justify-between mt-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={getHint}
            disabled={isThinking || gameStatus !== 'playing'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-yellow-500/20 text-yellow-500 disabled:opacity-30"
          >
            <Lightbulb className="w-4 h-4" />
            Meilleur coup
          </button>

          <div className="text-sm font-mono opacity-60">
            Ev: {evaluation > 0 ? '+' : ''}{evaluation.toFixed(1)}
          </div>
        </div>

        <button
          onClick={() => setFlipped(!flipped)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 opacity-70 hover:opacity-100"
          style={{ color: 'var(--text-muted)' }}
        >
          <RotateCcw className="w-4 h-4" />
          Retourner
        </button>
      </div>
    </div>
  )
}
