import type { PlayerColor, AIDifficulty, Position } from '../types'

// Chess piece symbols
export const CHESS_PIECES = {
  white: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
}

// Initial chess position in FEN notation
export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export type ChessPiece = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | null
export type ChessBoard = ChessPiece[][]



// Create initial board from FEN
export function createBoardFromFEN(fen: string = INITIAL_FEN): ChessBoard {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null))
  const [position] = fen.split(' ')
  const rows = position.split('/')

  rows.forEach((row, rowIndex) => {
    let colIndex = 0
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        board[rowIndex][colIndex] = char as ChessPiece
        colIndex++
      } else {
        colIndex += parseInt(char)
      }
    }
  })

  return board
}

// Convert board to FEN
export function boardToFEN(board: ChessBoard, turn: PlayerColor = 'white'): string {
  let fen = ''

  for (let row = 0; row < 8; row++) {
    let emptyCount = 0
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount
          emptyCount = 0
        }
        fen += piece
      } else {
        emptyCount++
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount
    }
    if (row < 7) fen += '/'
  }

  fen += ` ${turn === 'white' ? 'w' : 'b'} KQkq - 0 1`
  return fen
}

// Get piece color
export function getPieceColor(piece: ChessPiece): PlayerColor | null {
  if (!piece) return null
  return piece === piece.toUpperCase() ? 'white' : 'black'
}

// Get piece symbol for display
export function getPieceSymbol(piece: ChessPiece): string {
  if (!piece) return ''

  const color = getPieceColor(piece)!
  const type = piece.toLowerCase()

  const pieceMap: Record<string, keyof typeof CHESS_PIECES.white> = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
  }

  return CHESS_PIECES[color][pieceMap[type]]
}

// Simple move validation (basic implementation)
export function isValidMove(
  board: ChessBoard,
  from: Position,
  to: Position,
  currentTurn: PlayerColor
): boolean {
  const piece = board[from.row][from.col]
  if (!piece) return false

  const pieceColor = getPieceColor(piece)
  if (pieceColor !== currentTurn) return false

  const targetPiece = board[to.row][to.col]
  if (targetPiece && getPieceColor(targetPiece) === currentTurn) return false

  // Basic validation per piece type
  const pieceType = piece.toLowerCase()
  const dr = to.row - from.row
  const dc = to.col - from.col
  const absDr = Math.abs(dr)
  const absDc = Math.abs(dc)

  switch (pieceType) {
    case 'p': {
      const direction = currentTurn === 'white' ? -1 : 1
      const startRow = currentTurn === 'white' ? 6 : 1

      // Forward move
      if (dc === 0 && !targetPiece) {
        if (dr === direction) return true
        if (dr === direction * 2 && from.row === startRow && !board[from.row + direction][from.col]) return true
      }
      // Capture
      if (absDc === 1 && dr === direction && targetPiece) return true
      return false
    }

    case 'r':
      if (dr !== 0 && dc !== 0) return false
      return !isPathBlocked(board, from, to)

    case 'n':
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2)

    case 'b':
      if (absDr !== absDc) return false
      return !isPathBlocked(board, from, to)

    case 'q':
      if (dr !== 0 && dc !== 0 && absDr !== absDc) return false
      return !isPathBlocked(board, from, to)

    case 'k':
      // Basic king move
      if (absDr <= 1 && absDc <= 1) return true
      // Castling (simplified)
      if (absDr === 0 && absDc === 2) {
        // Would need full castling validation
        return true
      }
      return false

    default:
      return false
  }
}

function isPathBlocked(board: ChessBoard, from: Position, to: Position): boolean {
  const dr = Math.sign(to.row - from.row)
  const dc = Math.sign(to.col - from.col)

  let row = from.row + dr
  let col = from.col + dc

  while (row !== to.row || col !== to.col) {
    if (board[row][col]) return true
    row += dr
    col += dc
  }

  return false
}

// Get all valid moves for a piece
export function getValidMoves(board: ChessBoard, pos: Position, currentTurn: PlayerColor): Position[] {
  const validMoves: Position[] = []

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (isValidMove(board, pos, { row, col }, currentTurn)) {
        validMoves.push({ row, col })
      }
    }
  }

  return validMoves
}

// Execute move
export function executeMove(board: ChessBoard, from: Position, to: Position): ChessBoard {
  const newBoard = board.map(row => [...row])
  const piece = newBoard[from.row][from.col]

  // Handle pawn promotion
  let finalPiece = piece
  if (piece?.toLowerCase() === 'p') {
    if ((getPieceColor(piece) === 'white' && to.row === 0) ||
      (getPieceColor(piece) === 'black' && to.row === 7)) {
      finalPiece = getPieceColor(piece) === 'white' ? 'Q' : 'q'
    }
  }

  newBoard[from.row][from.col] = null
  newBoard[to.row][to.col] = finalPiece

  return newBoard
}

// Check for checkmate or stalemate
export function getGameStatus(board: ChessBoard, currentTurn: PlayerColor): 'playing' | 'checkmate' | 'stalemate' {
  let hasValidMove = false

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && getPieceColor(piece) === currentTurn) {
        const moves = getValidMoves(board, { row, col }, currentTurn)
        if (moves.length > 0) {
          hasValidMove = true
          break
        }
      }
    }
    if (hasValidMove) break
  }

  if (!hasValidMove) {
    // Check if king is in check
    const inCheck = isKingInCheck(board, currentTurn)
    return inCheck ? 'checkmate' : 'stalemate'
  }

  return 'playing'
}

function isKingInCheck(board: ChessBoard, color: PlayerColor): boolean {
  // Find king position
  let kingPos: Position | null = null
  const kingPiece = color === 'white' ? 'K' : 'k'

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingPiece) {
        kingPos = { row, col }
        break
      }
    }
    if (kingPos) break
  }

  if (!kingPos) return false

  // Check if any enemy piece can capture king
  const enemyColor = color === 'white' ? 'black' : 'white'
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && getPieceColor(piece) === enemyColor) {
        if (isValidMove(board, { row, col }, kingPos, enemyColor)) {
          return true
        }
      }
    }
  }

  return false
}

// Move to algebraic notation
export function moveToNotation(from: Position, to: Position, piece: ChessPiece): string {
  const files = 'abcdefgh'
  const fromSquare = `${files[from.col]}${8 - from.row}`
  const toSquare = `${files[to.col]}${8 - to.row}`

  const pieceChar = piece?.toUpperCase() === 'P' ? '' : piece?.toUpperCase() || ''
  return `${pieceChar}${fromSquare}-${toSquare}`
}

// AI Configuration
const CHESS_AI_DEPTHS: Record<AIDifficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
  expert: 5,
}

// Simple piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
}

export function evaluateBoard(board: ChessBoard, color: PlayerColor): number {
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const pieceColor = getPieceColor(piece)
      const value = PIECE_VALUES[piece.toLowerCase()] || 0

      if (pieceColor === color) {
        score += value
      } else {
        score -= value
      }
    }
  }

  return score
}

// Simple AI - returns best move
export function getAIMove(
  board: ChessBoard,
  color: PlayerColor,
  difficulty: AIDifficulty
): { from: Position; to: Position } | null {
  const depth = CHESS_AI_DEPTHS[difficulty]
  let bestMove: { from: Position; to: Position } | null = null
  let bestScore = -Infinity

  // Get all possible moves
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol]
      if (!piece || getPieceColor(piece) !== color) continue

      const from = { row: fromRow, col: fromCol }
      const validMoves = getValidMoves(board, from, color)

      for (const to of validMoves) {
        const newBoard = executeMove(board, from, to)
        const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, color)

        // Add randomization for easier difficulties
        const randomFactor = difficulty === 'easy' ? Math.random() * 200 - 100 :
          difficulty === 'medium' ? Math.random() * 100 - 50 : 0

        if (score + randomFactor > bestScore) {
          bestScore = score + randomFactor
          bestMove = { from, to }
        }
      }
    }
  }

  return bestMove
}

function minimax(
  board: ChessBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  maximizingColor: PlayerColor
): number {
  if (depth === 0) {
    return evaluateBoard(board, maximizingColor)
  }

  const currentColor = isMaximizing ? maximizingColor : (maximizingColor === 'white' ? 'black' : 'white')

  if (isMaximizing) {
    let maxEval = -Infinity

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (!piece || getPieceColor(piece) !== currentColor) continue

        const from = { row, col }
        const moves = getValidMoves(board, from, currentColor)

        for (const to of moves) {
          const newBoard = executeMove(board, from, to)
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, maximizingColor)
          maxEval = Math.max(maxEval, evalScore)
          alpha = Math.max(alpha, evalScore)
          if (beta <= alpha) break
        }
      }
    }

    return maxEval
  } else {
    let minEval = Infinity

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (!piece || getPieceColor(piece) !== currentColor) continue

        const from = { row, col }
        const moves = getValidMoves(board, from, currentColor)

        for (const to of moves) {
          const newBoard = executeMove(board, from, to)
          const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, maximizingColor)
          minEval = Math.min(minEval, evalScore)
          beta = Math.min(beta, evalScore)
          if (beta <= alpha) break
        }
      }
    }

    return minEval
  }
}
