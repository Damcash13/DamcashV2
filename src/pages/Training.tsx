import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Puzzle, Target, Flame, Trophy, ChevronRight, Clock, Star,
  RotateCcw, Lightbulb, CheckCircle, XCircle, Zap, TrendingUp,
  History, Info, Play
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import CheckersBoard from '../components/game/CheckersBoard'
import { createInitialBoard, getValidMoves, executeMove } from '../utils/checkersLogic'
import type { CheckerPiece, Position, CheckerBoard as CheckerBoardType, Move } from '../types'

interface PuzzleData {
  id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  theme: string
  rating: number
  board: (CheckerPiece | null)[][]
  currentTurn: 'white' | 'black'
  solution: { from: Position; to: Position }[]
  attempts: number
  played: number
  solved: boolean
  timeSpent?: number
}

const mockPuzzles: PuzzleData[] = [
  {
    id: '1195',
    difficulty: 'medium',
    theme: 'Standard puzzles',
    rating: 2904,
    played: 13572,
    board: createInitialBoard(),
    currentTurn: 'black',
    solution: [
      { from: { row: 3, col: 0 }, to: { row: 4, col: 1 } },
      { from: { row: 4, col: 1 }, to: { row: 5, col: 2 } },
    ],
    attempts: 0,
    solved: false,
  },
  {
    id: '1196',
    difficulty: 'easy',
    theme: 'Test Noir',
    rating: 1200,
    played: 543,
    board: createInitialBoard(),
    currentTurn: 'black',
    solution: [
      { from: { row: 3, col: 0 }, to: { row: 4, col: 1 } },
    ],
    attempts: 0,
    solved: false,
  },
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'expert': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}

export default function Training() {
  const { themeColors } = useTheme()
  const { showToast } = useToast()
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(mockPuzzles[0])
  const [puzzleBoard, setPuzzleBoard] = useState<(CheckerPiece | null)[][]>(() =>
    JSON.parse(JSON.stringify(mockPuzzles[0].board))
  )
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null)
  const [validMoves, setValidMoves] = useState<Position[]>([])
  const [moveIndex, setMoveIndex] = useState(0)
  const [history, setHistory] = useState<{ from: Position; to: Position; correct: boolean }[]>([])
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [puzzleResult, setPuzzleResult] = useState<'success' | 'fail' | null>(null)

  // Stats
  const [stats, setStats] = useState({
    puzzlesSolved: 156,
    rating: 1547,
    ratingChange: +23,
  })

  useEffect(() => {
    if (currentPuzzle) {
      startPuzzle(currentPuzzle)
    }
  }, [])

  useEffect(() => {
    let interval: any
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const startPuzzle = (puzzle: PuzzleData) => {
    setCurrentPuzzle(puzzle)
    setPuzzleBoard(JSON.parse(JSON.stringify(puzzle.board)))
    setMoveIndex(0)
    setHistory([])
    setTimer(0)
    setIsTimerRunning(true)
    setPuzzleResult(null)
    setSelectedPiece(null)
    setValidMoves([])
  }

  const handleCellClick = (row: number, col: number) => {
    if (!currentPuzzle || puzzleResult) return

    const piece = puzzleBoard[row][col]

    if (selectedPiece) {
      const isValidMove = validMoves.some(m => m.row === row && m.col === col)
      if (isValidMove) {
        const expectedMove = currentPuzzle.solution[moveIndex]
        const isCorrect =
          selectedPiece.row === expectedMove.from.row &&
          selectedPiece.col === expectedMove.from.col &&
          row === expectedMove.to.row &&
          col === expectedMove.to.col

        if (isCorrect) {
          const newBoard = executeMove(puzzleBoard, { from: selectedPiece, to: { row, col } })
          setPuzzleBoard(newBoard)
          setHistory(prev => [...prev, { from: selectedPiece, to: { row, col }, correct: true }])
          setMoveIndex(prev => prev + 1)

          if (moveIndex + 1 >= currentPuzzle.solution.length) {
            setIsTimerRunning(false)
            setPuzzleResult('success')
            showToast('Puzzle résolu !', 'success')
          }
        } else {
          setHistory(prev => [...prev, { from: selectedPiece, to: { row, col }, correct: false }])
          setPuzzleResult('fail')
          setIsTimerRunning(false)
          showToast('Mauvais coup !', 'error')
        }
        setSelectedPiece(null)
        setValidMoves([])
        return
      }
    }

    if (piece && (piece === (currentPuzzle.currentTurn === 'white' ? 'w' : 'b') || piece === (currentPuzzle.currentTurn === 'white' ? 'W' : 'B'))) {
      setSelectedPiece({ row, col })
      const moves = getValidMoves(puzzleBoard, { row, col }, currentPuzzle.currentTurn)
      // @ts-ignore
      setValidMoves(moves)
    } else {
      setSelectedPiece(null)
      setValidMoves([])
    }
  }

  const formatNotation = (pos: Position) => {
    // Checkers 10x10 notation (1-50)
    const cellNum = Math.floor(pos.row * 5) + Math.floor((pos.col + (pos.row % 2 === 0 ? 0 : 1)) / 2) + 1
    return cellNum
  }

  const nextPuzzle = () => {
    const currentIndex = mockPuzzles.findIndex(p => p.id === currentPuzzle?.id)
    const nextIndex = (currentIndex + 1) % mockPuzzles.length
    startPuzzle(mockPuzzles[nextIndex])
  }

  return (
    <div className={`min-h-screen ${themeColors.background} text-white`}>
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Puzzle Details */}
          <div className="lg:col-span-3 space-y-6">
            <div className={`${themeColors.card} rounded-xl p-6 border ${themeColors.border} shadow-lg`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Puzzle className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Puzzle {currentPuzzle?.id}</h2>
                  <p className="text-sm opacity-50">Rating: {currentPuzzle?.rating}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Played</span>
                  <span>{currentPuzzle?.played.toLocaleString()} times</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Theme</span>
                  <span>{currentPuzzle?.theme}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-50">Difficulty</span>
                  <span className={`px-2 py-0.5 rounded ${getDifficultyColor(currentPuzzle?.difficulty || '')}`}>
                    {currentPuzzle?.difficulty}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">{stats.rating}</span>
                  <span className="text-xs text-green-500">+{stats.ratingChange}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Board */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[650px] aspect-square relative">
              <CheckersBoard
                initialBoard={puzzleBoard}
                selectedPiece={selectedPiece}
                validMoves={validMoves}
                onCellClick={handleCellClick}
                currentTurn={currentPuzzle?.currentTurn || 'black'}
              />

              <AnimatePresence>
                {puzzleResult === 'fail' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] pointer-events-none flex items-center justify-center"
                  >
                    <div className="bg-red-600 px-8 py-4 rounded-xl shadow-2xl scale-110">
                      <XCircle className="w-12 h-12 mx-auto mb-2" />
                      <span className="font-black text-2xl uppercase">Mauvais coup !</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full max-w-[650px] mt-6 flex justify-between items-center text-sm opacity-50">
              <div className="flex gap-4">
                <button className="hover:text-white flex items-center gap-1 transition-colors">
                  <Info className="w-4 h-4" /> Analyse
                </button>
                <button
                  onClick={() => startPuzzle(currentPuzzle!)}
                  className="hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: History & Success */}
          <div className="lg:col-span-3 h-full flex flex-col">
            <div className={`${themeColors.card} flex-1 rounded-xl border ${themeColors.border} flex flex-col overflow-hidden shadow-lg`}>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <History className="w-4 h-4 opacity-50" /> History
                </h3>
                <span className="text-xs opacity-50">{history.length} moves</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono">
                {history.map((move, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded ${move.correct ? 'bg-white/5' : 'bg-red-500/10'}`}>
                    <span className="w-4 opacity-30 text-[10px]">{i + 1}</span>
                    <span className="flex-1">
                      {formatNotation(move.from)}-{formatNotation(move.to)}
                    </span>
                    {move.correct ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                    <History className="w-12 h-12 mb-2" />
                    <p className="text-sm">Faites le premier coup pour commencer l'historique</p>
                  </div>
                )}
              </div>

              {/* Success Footer */}
              <AnimatePresence>
                {puzzleResult === 'success' && (
                  <motion.div
                    initial={{ y: 200 }}
                    animate={{ y: 0 }}
                    className="p-6 bg-blue-600"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-2xl font-black italic uppercase">Success</span>
                    </div>
                    <button
                      onClick={nextPuzzle}
                      className="w-full bg-white text-blue-600 py-4 rounded-xl font-black uppercase text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="fill-current" /> Continue training
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
