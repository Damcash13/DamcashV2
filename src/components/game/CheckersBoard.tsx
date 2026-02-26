import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useGameSounds } from '../../hooks/useGameSounds'
import type { CheckerBoard, Position, Move, PlayerColor, AIDifficulty } from '../../types'
import {
  createInitialBoard,
  getValidMoves,
  executeMove,
  checkGameEnd,
  getPieceColor,
  isKing,
  moveToNotation,
  getAllValidMoves
} from '../../utils/checkersLogic'
import { useCheckersEngine } from '../../hooks/useCheckersEngine'
import CheckerPiece from './CheckerPiece'
import CheckersCell from './CheckersCell'

interface CheckersBoardProps {
  // Existing props
  vsAI?: boolean
  aiDifficulty?: AIDifficulty
  playerColor?: PlayerColor
  onGameEnd?: (winner: PlayerColor | 'draw') => void
  onMove?: (move: Move, notation: string) => void
  spectatorMode?: boolean
  initialBoard?: CheckerBoard
  initialTurn?: PlayerColor
  remoteMove?: Move | null


  // Additional props used by consuming components
  board?: any[][]  // Used by Lesson, ReplayCenter, Spectate
  selectedPiece?: Position | null  // Used by Training, Spectate
  validMoves?: Position[]  // Used by Training, Spectate
  onCellClick?: (row: number, col: number) => void  // Used by Training
  onSquareClick?: () => void  // Used by Spectate
  disabled?: boolean  // Used by Lesson, ReplayCenter
  currentTurn?: string | PlayerColor  // Used by all consuming components
  isPlayerTurn?: boolean  // Used by Spectate
}

export default function CheckersBoard({
  vsAI = false,
  aiDifficulty = 'medium',
  playerColor = 'white',
  onGameEnd,
  onMove,
  spectatorMode = false,
  initialBoard,
  initialTurn = 'white',
  remoteMove,
  board: controlledBoard // Destructure and rename to avoid conflict
}: CheckersBoardProps) {
  const [board, setBoard] = useState<CheckerBoard>(() => initialBoard || createInitialBoard())
  const [currentTurn, setCurrentTurn] = useState<PlayerColor>(initialTurn)
  const [flipped, setFlipped] = useState(playerColor === 'black')
  const { engineReady, requestMove, abortSearch } = useCheckersEngine(aiDifficulty || 'medium')
  // Restored State
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Move[]>([])

  // Sync with controlled board prop (for Replay/Spectate)
  useEffect(() => {
    if (controlledBoard) {
      setBoard(controlledBoard as CheckerBoard)
    }
  }, [controlledBoard])
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null)

  const { playMove, playCapture, playCheck, playGameEnd } = useGameSounds()

  // Handle remote moves
  useEffect(() => {
    if (remoteMove) {
      handleMove(remoteMove)
    }
  }, [remoteMove])

  // Premove State
  const [premove, setPremove] = useState<{ from: Position; to: Position } | null>(null)

  // Define callbacks first
  const handleMove = useCallback((move: Move) => {
    const newBoard = executeMove(board, move)
    const notation = moveToNotation(move)

    setBoard(newBoard)
    setLastMove(move)
    setSelectedPiece(null)
    setValidMoves([])
    setMoveHistory(prev => [...prev, notation])
    setCurrentTurn(prev => prev === 'white' ? 'black' : 'white')

    onMove?.(move, notation)

    // Sounds
    if (move.captured && move.captured.length > 0) {
      playCapture()
    } else {
      playMove()
    }
  }, [board, onMove, playMove, playCapture])

  const handleDragEnd = useCallback((event: any, info: any, row: number, col: number) => {
    // row and col passed here are LOGICAL coordinates (from the render loop)
    console.log('[Checkers] DragEnd Log:', {
      logicalFrom: { row, col },
      flipped,
      currentTurn,
      playerColor
    })

    const fromPos = { row, col }

    // Use elementsFromPoint for robust detection
    const elements = document.elementsFromPoint(info.point.x, info.point.y)
    const cell = elements.find(el => el.classList.contains('cell')) as HTMLElement

    if (cell && cell.dataset.row && cell.dataset.col) {
      const targetRow = parseInt(cell.dataset.row) // logical row stored in dataset
      const targetCol = parseInt(cell.dataset.col) // logical col stored in dataset

      console.log('[Checkers] Target Found:', { targetRow, targetCol })

      const toPos = { row: targetRow, col: targetCol }

      // Logic
      const isLocalGame = !vsAI
      // Allow move if it's my turn OR it's a local game (hotseat) where "my turn" is just "current turn"
      // Note: For local game, we allow the move if the moved piece matches the current turn, which is handled by getValidMoves
      // but we need to pass this gate.
      if (isLocalGame || currentTurn === playerColor) {
        // Normal Move
        const moves = getValidMoves(board, fromPos, currentTurn)
        console.log('[Checkers] Valid Moves:', moves)

        const move = moves.find(m => m.to.row === toPos.row && m.to.col === toPos.col)
        console.log('[Checkers] Selected Move:', move)

        if (move) {
          handleMove(move)
        } else {
          // Snap back (implicit)
          setSelectedPiece(null)
          setValidMoves([])
        }
      } else {
        // Premove
        console.log('[Checkers] Premove attempt', { from: fromPos, to: toPos })
        if (fromPos.row !== toPos.row || fromPos.col !== toPos.col) {
          setPremove({ from: fromPos, to: toPos })
        }
      }
    } else {
      console.warn('[Checkers] No target cell found via elementsFromPoint', { point: info.point })
    }
    setHoveredCell(null)
  }, [board, currentTurn, playerColor, handleMove, flipped])

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
    // Row/Col args here: The onClick handler in render needs to pass VISUAL or LOGICAL?
    // Let's assume we pass LOGICAL coordinates from the render loop to avoid confusion here.
    // BUT handleDragEnd receives arguments from the bind in render. 
    // Let's Standardize: Render loop passes LOGICAL coordinates to handlers?
    // If render loop is visual, it calculates logical piece. 
    // Yes, let's pass LOGICAL coordinates to handlers.

    // WAIT. handleDragEnd gets (e, info, row, col). If I bind logical there, then handleDragEnd doesn't need conversion.
    // Let's stick to passing LOGICAL coordinates to all handlers even if flipped.

    if (gameOver || spectatorMode || isThinking) return
    if (vsAI && currentTurn !== playerColor) return

    // row/col are LOGICAL here
    const clickedPiece = board[row][col]
    const clickedColor = clickedPiece ? getPieceColor(clickedPiece) : null

    // If clicking on own piece, select it
    if (clickedColor === currentTurn) {
      const moves = getValidMoves(board, { row, col }, currentTurn)
      setSelectedPiece({ row, col })
      setValidMoves(moves)
      return
    }

    // If piece selected, try to move
    if (selectedPiece) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col)
      if (move) {
        handleMove(move)
      } else {
        // Deselect if clicking on invalid square
        setSelectedPiece(null)
        setValidMoves([])
      }
    }
  }, [board, currentTurn, selectedPiece, validMoves, gameOver, spectatorMode, isThinking, vsAI, playerColor, handleMove])

  // Enhance cell click to clear premove
  const handleCellClickEnhanced = useCallback((row: number, col: number) => {
    if (premove) setPremove(null)
    handleCellClick(row, col)
  }, [premove, handleCellClick])

  const isValidMoveTarget = useCallback((row: number, col: number) => {
    return validMoves.some(m => m.to.row === row && m.to.col === col)
  }, [validMoves])

  const isCaptureMove = useCallback((row: number, col: number) => {
    return validMoves.some(m => m.to.row === row && m.to.col === col && m.captured && m.captured.length > 0)
  }, [validMoves])

  const isLastMoveSquare = useCallback((row: number, col: number) => {
    if (!lastMove) return false
    return (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
  }, [lastMove])


  // EFFECT HOOKS (after definitions)

  // Check for game end
  useEffect(() => {
    const result = checkGameEnd(board, currentTurn)
    if (result) {
      setGameOver(true)
      onGameEnd?.(result)
    }
  }, [board, currentTurn, onGameEnd])

  // Execute Premove
  useEffect(() => {
    if (premove && currentTurn === playerColor && !gameOver) {
      // Validate premove
      const moves = getValidMoves(board, premove.from, currentTurn)
      const move = moves.find(m => m.to.row === premove.to.row && m.to.col === premove.to.col)

      if (move) {
        handleMove(move)
      }
      setPremove(null)
    }
  }, [currentTurn, playerColor, gameOver, premove, board, handleMove])

  // AI move
  useEffect(() => {
    if (gameOver || spectatorMode || !engineReady || isThinking) return
    if (!vsAI || currentTurn === playerColor) return

    let isActive = true;

    async function fetchAIMove() {
      setIsThinking(true)
      try {
        console.log('[Checkers] AI Starting Thinking...', { currentTurn, difficulty: aiDifficulty })
        const aiMove = await requestMove(board, currentTurn)

        if (isActive) {
          if (aiMove) {
            console.log('[Checkers] AI Found Move:', aiMove)
            handleMove(aiMove)
          } else {
            console.log('[Checkers] AI returned no move (Checkmate or Draw)')
            // Force the game over logic to run if it hasn't caught it yet
            if (onGameEnd) {
              onGameEnd(playerColor) // The player wins if AI can't move
            }
          }
        }
      } catch (error) {
        if (isActive) console.error('AI error:', error)
      } finally {
        if (isActive) setIsThinking(false)
      }
    }

    fetchAIMove()

    return () => {
      isActive = false;
      abortSearch()
    }
  }, [board, currentTurn, playerColor, vsAI, gameOver, spectatorMode, aiDifficulty, engineReady])


  // ... (AI logic remains)

  // ... (render)
  return (
    <div className="w-full flex flex-col items-center">
      <div className="board-container">
        {/* Premove Indicator */}
        {premove && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow animate-pulse">
            Premove set
          </div>
        )}

        {/* Board */}
        <div className="board board-10x10 relative">
          {/* ... board cells ... */}
          {Array.from({ length: 10 }, (_, visualRow) =>
            Array.from({ length: 10 }, (_, visualCol) => {
              const row = flipped ? 9 - visualRow : visualRow
              const col = flipped ? 9 - visualCol : visualCol
              const piece = board[row][col]
              const isLight = (row + col) % 2 === 0
              const isSelected = selectedPiece?.row === row && selectedPiece?.col === col
              const isValid = isValidMoveTarget(row, col)
              const isCapture = isCaptureMove(row, col)
              const isLastMove = isLastMoveSquare(row, col)
              const isPremoveSource = premove?.from.row === row && premove?.from.col === col
              const isPremoveTarget = premove?.to.row === row && premove?.to.col === col
              const isHovered = hoveredCell?.row === row && hoveredCell?.col === col
              const pieceColor = piece ? getPieceColor(piece) : null
              const isDraggable = piece && !spectatorMode && (
                (!vsAI && pieceColor === currentTurn) ||
                (vsAI && pieceColor === playerColor)
              )

              return (
                <CheckersCell
                  key={`${row}-${col}`}
                  row={row}
                  col={col}
                  piece={piece}
                  isSelected={!!isSelected}
                  isValid={isValid}
                  isCapture={isCapture}
                  isLastMove={!!isLastMove}
                  isPremoveSource={!!isPremoveSource}
                  isPremoveTarget={!!isPremoveTarget}
                  isHovered={!!isHovered}
                  isDraggable={!!isDraggable}
                  flipped={flipped}
                  handleCellClick={handleCellClickEnhanced}
                  handleDrag={handleDrag}
                  handleDragEnd={handleDragEnd}
                />
              )
            })
          )}

          {/* indicators */}

          {/* AI Thinking Indicator - Subtle Top Right */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute -top-12 right-0 z-30"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md border border-white/10"
                style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(8px)' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-500">Scan 3.1 réfléchit...</span>
              </div>
            </motion.div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
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
                <h2 className="text-2xl font-display font-bold mb-2">Partie Terminée</h2>
                <p className="text-lg opacity-80">
                  {checkGameEnd(board, currentTurn) === 'draw'
                    ? 'Match Nul!'
                    : `${checkGameEnd(board, currentTurn) === 'white' ? 'Blancs' : 'Noirs'} gagnent!`
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Board Controls */}
      <div className="w-full flex justify-end mt-4">
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

