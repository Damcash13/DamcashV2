import type { CheckerBoard, CheckerPiece, Position, Move, PlayerColor, AIDifficulty, AIConfig, AIMove } from '../types'
export type { CheckerBoard, CheckerPiece, Position, Move, PlayerColor, AIDifficulty, AIConfig, AIMove }

// ===== BOARD INITIALIZATION =====
export function createInitialBoard(): CheckerBoard {
  // 10x10 International Checkers board
  const board: CheckerBoard = Array(10).fill(null).map(() => Array(10).fill(null))

  // Place black pieces (rows 0-3)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = 'b'
      }
    }
  }

  // Place white pieces (rows 6-9)
  for (let row = 6; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = 'w'
      }
    }
  }

  return board
}

// ===== PIECE UTILITIES =====
export function getPieceColor(piece: CheckerPiece): PlayerColor | null {
  if (!piece) return null
  if (typeof piece !== 'string') return null // Add type check
  return piece.toLowerCase() === 'w' ? 'white' : 'black'
}

export function isKing(piece: CheckerPiece): boolean {
  if (!piece || typeof piece !== 'string') return false // Add type check
  return piece === 'W' || piece === 'B'
}

export function isPawn(piece: CheckerPiece): boolean {
  return piece === 'w' || piece === 'b'
}

export function promoteToKing(piece: CheckerPiece): CheckerPiece {
  if (piece === 'w') return 'W'
  if (piece === 'b') return 'B'
  return piece
}

// ===== MOVE VALIDATION =====
export function getValidMoves(board: CheckerBoard, pos: Position, currentTurn: PlayerColor): Move[] {
  const piece = board[pos.row][pos.col]
  if (!piece) return []

  const pieceColor = getPieceColor(piece)
  if (pieceColor !== currentTurn) return []

  // First check if there are any captures available for any piece
  const allCaptures = getAllCaptures(board, currentTurn)

  // In international draughts, if captures are available, they are mandatory
  if (allCaptures.length > 0) {
    // Return only captures for this piece
    return allCaptures.filter(m => m.from.row === pos.row && m.from.col === pos.col)
  }

  // No captures available, return simple moves
  return getSimpleMoves(board, pos, piece)
}

function getSimpleMoves(board: CheckerBoard, pos: Position, piece: CheckerPiece): Move[] {
  const moves: Move[] = []
  const isKingPiece = isKing(piece)
  const color = getPieceColor(piece)

  // Direction based on piece color
  const directions = isKingPiece
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Kings move in all directions
    : color === 'white'
      ? [[-1, -1], [-1, 1]] // White pawns move up
      : [[1, -1], [1, 1]]   // Black pawns move down

  for (const [dr, dc] of directions) {
    if (isKingPiece) {
      // Kings can move multiple squares (flying kings in international draughts)
      let newRow = pos.row + dr
      let newCol = pos.col + dc

      while (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({
          from: pos,
          to: { row: newRow, col: newCol },
        })
        newRow += dr
        newCol += dc
      }
    } else {
      // Pawns move one square
      const newRow = pos.row + dr
      const newCol = pos.col + dc

      if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
        const isPromotion = (color === 'white' && newRow === 0) || (color === 'black' && newRow === 9)
        moves.push({
          from: pos,
          to: { row: newRow, col: newCol },
          promotion: isPromotion,
        })
      }
    }
  }

  return moves
}

function getAllCaptures(board: CheckerBoard, currentTurn: PlayerColor): Move[] {
  const allCaptures: Move[] = []

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (piece && getPieceColor(piece) === currentTurn) {
        const captures = getCapturesForPiece(board, { row, col }, piece, [])
        allCaptures.push(...captures)
      }
    }
  }

  // In international draughts, must take maximum captures
  if (allCaptures.length === 0) return []

  const maxCaptures = Math.max(...allCaptures.map(m => m.captured?.length || 0))
  return allCaptures.filter(m => (m.captured?.length || 0) === maxCaptures)
}

function getCapturesForPiece(
  board: CheckerBoard,
  pos: Position,
  piece: CheckerPiece,
  alreadyCaptured: Position[]
): Move[] {
  const captures: Move[] = []
  const isKingPiece = isKing(piece)
  const color = getPieceColor(piece)
  const oppositeColor = color === 'white' ? 'black' : 'white'

  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

  for (const [dr, dc] of directions) {
    if (isKingPiece) {
      // Flying king captures - can jump from any distance
      let searchRow = pos.row + dr
      let searchCol = pos.col + dc

      // Find enemy piece
      while (isValidPosition(searchRow, searchCol)) {
        const targetPiece = board[searchRow][searchCol]

        if (targetPiece) {
          // Check if it's an enemy piece and not already captured
          if (getPieceColor(targetPiece) === oppositeColor &&
            !alreadyCaptured.some(p => p.row === searchRow && p.col === searchCol)) {
            // Can land on any empty square after the captured piece
            let landRow = searchRow + dr
            let landCol = searchCol + dc

            while (isValidPosition(landRow, landCol) && !board[landRow][landCol]) {
              const capturedPos = { row: searchRow, col: searchCol }
              const newCaptured = [...alreadyCaptured, capturedPos]

              // Check for chain captures
              const tempBoard = cloneBoard(board)
              tempBoard[pos.row][pos.col] = null
              // CRITICAL FIX: Do NOT remove captured piece from tempBoard (it stays as obstacle)
              // tempBoard[searchRow][searchCol] = null 
              tempBoard[landRow][landCol] = piece

              const chainCaptures = getCapturesForPiece(
                tempBoard,
                { row: landRow, col: landCol },
                piece,
                newCaptured
              )

              if (chainCaptures.length > 0) {
                for (const chain of chainCaptures) {
                  captures.push({
                    from: pos,
                    to: chain.to,
                    captured: [capturedPos, ...(chain.captured || [])],
                  })
                }
              } else {
                captures.push({
                  from: pos,
                  to: { row: landRow, col: landCol },
                  captured: [capturedPos],
                })
              }

              landRow += dr
              landCol += dc
            }
          }
          break // Can't jump over multiple pieces in same direction
        }

        searchRow += dr
        searchCol += dc
      }
    } else {
      // Pawn captures - jump over adjacent enemy
      const jumpRow = pos.row + dr
      const jumpCol = pos.col + dc
      const landRow = pos.row + dr * 2
      const landCol = pos.col + dc * 2

      if (!isValidPosition(jumpRow, jumpCol) || !isValidPosition(landRow, landCol)) continue

      const targetPiece = board[jumpRow][jumpCol]
      const landSquare = board[landRow][landCol]

      // Check if can capture
      if (targetPiece &&
        getPieceColor(targetPiece) === oppositeColor &&
        !landSquare &&
        !alreadyCaptured.some(p => p.row === jumpRow && p.col === jumpCol)) {

        const capturedPos = { row: jumpRow, col: jumpCol }
        const newCaptured = [...alreadyCaptured, capturedPos]

        // CRITICAL FIX: Promotion happens ONLY if sequence ends on promotion row
        const isPromotionRow = (color === 'white' && landRow === 0) || (color === 'black' && landRow === 9)

        // Pass ORIGINAL piece (pawn) to recursion, NOT promoted piece
        // This ensures "flying king" rules don't apply mid-sequence
        const tempBoard = cloneBoard(board)
        tempBoard[pos.row][pos.col] = null
        // CRITICAL FIX: Do NOT remove captured piece
        // tempBoard[jumpRow][jumpCol] = null
        tempBoard[landRow][landCol] = piece

        const chainCaptures = getCapturesForPiece(
          tempBoard,
          { row: landRow, col: landCol },
          piece, // Recursively search as PAWN
          newCaptured
        )

        if (chainCaptures.length > 0) {
          for (const chain of chainCaptures) {
            captures.push({
              from: pos,
              to: chain.to,
              captured: [capturedPos, ...(chain.captured || [])],
              promotion: chain.promotion, // Inherit promotion from end of chain
            })
          }
        } else {
          captures.push({
            from: pos,
            to: { row: landRow, col: landCol },
            captured: [capturedPos],
            promotion: isPromotionRow, // Only promote if stopping here
          })
        }
      }
    }
  }

  return captures
}

// ===== MOVE EXECUTION =====
export function executeMove(board: CheckerBoard, move: Move): CheckerBoard {
  const newBoard = cloneBoard(board)
  const piece = newBoard[move.from.row][move.from.col]

  // Remove piece from original position
  newBoard[move.from.row][move.from.col] = null

  // Remove captured pieces
  if (move.captured) {
    for (const captured of move.captured) {
      newBoard[captured.row][captured.col] = null
    }
  }

  // Place piece at destination (with promotion if applicable)
  const color = getPieceColor(piece)
  const shouldPromote = move.promotion ||
    (isPawn(piece) && ((color === 'white' && move.to.row === 0) || (color === 'black' && move.to.row === 9)))

  newBoard[move.to.row][move.to.col] = shouldPromote ? promoteToKing(piece) : piece

  return newBoard
}

// ===== GAME STATE =====
export function checkGameEnd(board: CheckerBoard, currentTurn: PlayerColor): 'white' | 'black' | 'draw' | null {
  // Check if current player has any moves
  let hasValidMove = false
  let whitePieces = 0
  let blackPieces = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const color = getPieceColor(piece)
      if (color === 'white') whitePieces++
      else blackPieces++

      if (color === currentTurn && !hasValidMove) {
        const moves = getValidMoves(board, { row, col }, currentTurn)
        if (moves.length > 0) hasValidMove = true
      }
    }
  }

  // No pieces left
  if (whitePieces === 0) return 'black'
  if (blackPieces === 0) return 'white'

  // No valid moves (blocked)
  if (!hasValidMove) {
    return currentTurn === 'white' ? 'black' : 'white'
  }

  return null
}

// ===== AI IMPLEMENTATION =====
const AI_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy: { difficulty: 'easy', depth: 4, maxTime: 500, randomization: 80 },      // +1 depth
  medium: { difficulty: 'medium', depth: 7, maxTime: 1500, randomization: 40 }, // +2 depth
  hard: { difficulty: 'hard', depth: 10, maxTime: 4000, randomization: 15 },    // +2 depth
  expert: { difficulty: 'expert', depth: 14, maxTime: 8000, randomization: 0 }, // +4 depth
}

// Strategic position values for international draughts (FMJD)
const POSITION_VALUES = {
  // Grande Diagonale (key squares)
  grandeDiagonale: [5, 14, 23, 32, 41, 46],
  grandeDiagonaleBonus: 15,

  // Central Star
  centralStar: [22, 23, 27, 28, 29],
  centralStarBonus: 12,

  // Other strategic bonuses
  passedPawn: 25,
  triangleFormation: 15,
  suspendedPawn: -20,
  dogHole: -25,
  wingControl: 10,
}

function positionToIndex(row: number, col: number): number {
  return row * 10 + col
}

export function evaluateBoard(board: CheckerBoard, maximizingColor: PlayerColor): number {
  let score = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const color = getPieceColor(piece)
      const isMaximizing = color === maximizingColor
      const multiplier = isMaximizing ? 1 : -1

      // Material value
      const materialValue = isKing(piece) ? 450 : 100
      score += materialValue * multiplier

      // Position index for strategic evaluation
      const posIndex = positionToIndex(row, col)

      // Grande Diagonale bonus
      if (POSITION_VALUES.grandeDiagonale.includes(posIndex)) {
        score += POSITION_VALUES.grandeDiagonaleBonus * multiplier
      }

      // Central Star bonus
      if (POSITION_VALUES.centralStar.includes(posIndex)) {
        score += POSITION_VALUES.centralStarBonus * multiplier
      }

      // Pawn advancement (encourage progression)
      if (isPawn(piece)) {
        const advancementBonus = color === 'white' ? (9 - row) * 3 : row * 3
        score += advancementBonus * multiplier
      }

      // Safety penalty - check if piece can be captured
      const captureRisk = checkCaptureRisk(board, { row, col })
      if (captureRisk) {
        score -= 500 * multiplier // Heavy penalty for pieces at risk
      }
    }
  }

  return score
}

// ===== PATTERN RECOGNITION =====
function detectForks(board: CheckerBoard, color: PlayerColor): number {
  let forks = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece || getPieceColor(piece) !== color) continue

      const captures = getCapturesForPiece(board, { row, col }, piece, [])

      // If one move can capture multiple pieces (2+), it's a fork
      for (const capture of captures) {
        if (capture.captured && capture.captured.length >= 2) {
          forks++
        }
      }
    }
  }

  return forks
}

function detectBreakthroughs(board: CheckerBoard, color: PlayerColor): number {
  let breakthroughs = 0
  const promotionRow = color === 'white' ? 0 : 9

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece || getPieceColor(piece) !== color || !isPawn(piece)) continue

      // Check if pawn can reach promotion row without being captured
      const distanceToPromotion = Math.abs(row - promotionRow)

      if (distanceToPromotion <= 3) {
        // Check if path is clear
        let pathClear = true
        const direction = color === 'white' ? -1 : 1

        for (let i = 1; i <= distanceToPromotion; i++) {
          const checkRow = row + (direction * i)
          const checkCol1 = col - i
          const checkCol2 = col + i

          if (isValidPosition(checkRow, checkCol1)) {
            const piece1 = board[checkRow][checkCol1]
            if (piece1 && getPieceColor(piece1) !== color) {
              pathClear = false
              break
            }
          }

          if (isValidPosition(checkRow, checkCol2)) {
            const piece2 = board[checkRow][checkCol2]
            if (piece2 && getPieceColor(piece2) !== color) {
              pathClear = false
              break
            }
          }
        }

        if (pathClear) breakthroughs++
      }
    }
  }

  return breakthroughs
}

function detectPatterns(board: CheckerBoard, color: PlayerColor): number {
  let score = 0

  // 1. Forks (fourchettes) - very valuable
  score += detectForks(board, color) * 100

  // 2. Breakthroughs (percées) - extremely valuable
  score += detectBreakthroughs(board, color) * 200

  return score
}

// ===== ADVANCED EVALUATION FUNCTIONS =====
function isPassedPawn(board: CheckerBoard, row: number, col: number, color: PlayerColor): boolean {
  const direction = color === 'white' ? -1 : 1
  const enemyColor = color === 'white' ? 'black' : 'white'

  // Check if there are enemy pawns in front that can block
  for (let r = row + direction; (color === 'white' ? r >= 0 : r < 10); r += direction) {
    // Check adjacent columns
    for (let c = col - 1; c <= col + 1; c++) {
      if (isValidPosition(r, c)) {
        const piece = board[r][c]
        if (piece && getPieceColor(piece) === enemyColor && isPawn(piece)) {
          return false // Enemy pawn can block
        }
      }
    }
  }

  return true
}

function isIsolatedPawn(board: CheckerBoard, row: number, col: number, color: PlayerColor): boolean {
  // Check if there are friendly pawns on adjacent files
  for (let r = 0; r < 10; r++) {
    for (let c = col - 1; c <= col + 1; c += 2) { // Only check adjacent columns
      if (c === col || !isValidPosition(r, c)) continue

      const piece = board[r][c]
      if (piece && getPieceColor(piece) === color && isPawn(piece)) {
        return false // Has friendly pawn nearby
      }
    }
  }

  return true
}

function hasConnectedPawn(board: CheckerBoard, row: number, col: number, color: PlayerColor): boolean {
  // Check diagonal neighbors
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc

    if (isValidPosition(newRow, newCol)) {
      const piece = board[newRow][newCol]
      if (piece && getPieceColor(piece) === color && isPawn(piece)) {
        return true
      }
    }
  }

  return false
}

function evaluatePawnStructure(board: CheckerBoard, color: PlayerColor): number {
  let score = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece || getPieceColor(piece) !== color || !isPawn(piece)) continue

      // Passed pawns (very valuable)
      if (isPassedPawn(board, row, col, color)) score += 30

      // Isolated pawns (penalty)
      if (isIsolatedPawn(board, row, col, color)) score -= 15

      // Connected pawns (bonus)
      if (hasConnectedPawn(board, row, col, color)) score += 8
    }
  }

  return score
}

function countControlledSquares(board: CheckerBoard, row: number, col: number): number {
  let controlled = 0
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

  for (const [dr, dc] of directions) {
    let r = row + dr
    let c = col + dc

    while (isValidPosition(r, c)) {
      if (!board[r][c]) {
        controlled++
      } else {
        break // Blocked by piece
      }
      r += dr
      c += dc
    }
  }

  return controlled
}

function evaluateKingActivity(board: CheckerBoard, color: PlayerColor): number {
  let score = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (!piece || getPieceColor(piece) !== color || !isKing(piece)) continue

      // Kings in center are more active
      const distanceFromCenter = Math.abs(row - 4.5) + Math.abs(col - 4.5)
      score += (10 - distanceFromCenter) * 3

      // Kings controlling diagonals
      score += countControlledSquares(board, row, col) * 2
    }
  }

  return score
}

function isEndgame(board: CheckerBoard): boolean {
  let totalPieces = 0

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (board[row][col]) totalPieces++
    }
  }

  return totalPieces <= 12 // Endgame if 12 or fewer pieces
}

function evaluateBoardAdvanced(board: CheckerBoard, maximizingColor: PlayerColor): number {
  let score = evaluateBoard(board, maximizingColor) // Base evaluation

  // 1. Mobility (number of possible moves)
  const myMoves = getAllMoves(board, maximizingColor).length
  const enemyColor = maximizingColor === 'white' ? 'black' : 'white'
  const enemyMoves = getAllMoves(board, enemyColor).length
  score += (myMoves - enemyMoves) * 5

  // 2. Pawn structure
  score += evaluatePawnStructure(board, maximizingColor)
  score -= evaluatePawnStructure(board, enemyColor)

  // 3. King activity
  score += evaluateKingActivity(board, maximizingColor)
  score -= evaluateKingActivity(board, enemyColor)

  // 4. Pattern recognition (tactical motifs)
  score += detectPatterns(board, maximizingColor)
  score -= detectPatterns(board, enemyColor)

  // 5. Endgame bonus for kings
  if (isEndgame(board)) {
    let myKings = 0
    let enemyKings = 0

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const piece = board[row][col]
        if (!piece) continue

        if (isKing(piece)) {
          if (getPieceColor(piece) === maximizingColor) myKings++
          else enemyKings++
        }
      }
    }

    score += (myKings - enemyKings) * 50 // Kings are more valuable in endgame
  }

  return score
}

function checkCaptureRisk(board: CheckerBoard, pos: Position): boolean {
  const piece = board[pos.row][pos.col]
  if (!piece) return false

  const color = getPieceColor(piece)
  const enemyColor = color === 'white' ? 'black' : 'white'

  // Check if any enemy piece can capture this piece
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const enemyPiece = board[row][col]
      if (enemyPiece && getPieceColor(enemyPiece) === enemyColor) {
        const captures = getCapturesForPiece(board, { row, col }, enemyPiece, [])
        if (captures.some(m => m.captured?.some(c => c.row === pos.row && c.col === pos.col))) {
          return true
        }
      }
    }
  }

  return false
}

// ===== MOVE ORDERING =====
function isCentralPosition(pos: Position): boolean {
  // Central 4x4 area
  return pos.row >= 3 && pos.row <= 6 && pos.col >= 3 && pos.col <= 6
}

function countThreats(board: CheckerBoard, pos: Position, color: PlayerColor): number {
  // Count how many enemy pieces this position threatens
  let threats = 0
  const enemyColor = color === 'white' ? 'black' : 'white'

  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  for (const [dr, dc] of directions) {
    let checkRow = pos.row + dr
    let checkCol = pos.col + dc

    while (isValidPosition(checkRow, checkCol)) {
      const piece = board[checkRow][checkCol]
      if (piece && getPieceColor(piece) === enemyColor) {
        threats++
        break
      }
      if (piece) break // Blocked by own piece
      checkRow += dr
      checkCol += dc
    }
  }

  return threats
}

function orderMoves(moves: Move[], board: CheckerBoard, color: PlayerColor, depth: number): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    // 1. Captures first (prioritize multi-captures)
    const capturesA = a.captured?.length || 0
    const capturesB = b.captured?.length || 0
    if (capturesA !== capturesB) return capturesB - capturesA

    // 2. King captures over pawn captures
    if (a.captured && b.captured && a.captured.length > 0 && b.captured.length > 0) {
      const kingCapturesA = a.captured.filter(c => {
        const piece = board[c.row][c.col]
        return piece && isKing(piece)
      }).length
      const kingCapturesB = b.captured.filter(c => {
        const piece = board[c.row][c.col]
        return piece && isKing(piece)
      }).length
      if (kingCapturesA !== kingCapturesB) return kingCapturesB - kingCapturesA
    }

    // 3. Promotions
    if (a.promotion && !b.promotion) return -1
    if (!a.promotion && b.promotion) return 1

    // 4. Killer moves
    if (isKillerMove(depth, a) && !isKillerMove(depth, b)) return -1
    if (!isKillerMove(depth, a) && isKillerMove(depth, b)) return 1

    // 5. History heuristic
    scoreA += getHistoryScore(a)
    scoreB += getHistoryScore(b)

    // 6. Central moves
    scoreA += isCentralPosition(a.to) ? 50 : 0
    scoreB += isCentralPosition(b.to) ? 50 : 0

    // 7. Moves that attack enemy pieces
    scoreA += countThreats(board, a.to, color) * 20
    scoreB += countThreats(board, b.to, color) * 20

    return scoreB - scoreA
  })
}

function getAllMoves(board: CheckerBoard, color: PlayerColor): Move[] {
  const moves: Move[] = []

  // First check for captures (mandatory in international draughts)
  const captures = getAllCaptures(board, color)
  if (captures.length > 0) return captures

  // No captures, get simple moves
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const piece = board[row][col]
      if (piece && getPieceColor(piece) === color) {
        moves.push(...getSimpleMoves(board, { row, col }, piece))
      }
    }
  }

  return moves
}

// ===== TRANSPOSITION TABLE =====
const transpositionTable = new Map<string, { score: number, depth: number, type: 'exact' | 'lower' | 'upper' }>()

function getBoardHash(board: CheckerBoard, color: PlayerColor): string {
  // Simple JSON stringify for now - Zobrist would be better but more complex to setup
  return `${JSON.stringify(board)}-${color}`
}

export function clearTranspositionTable() {
  transpositionTable.clear()
}

// ===== KILLER MOVES HEURISTIC =====
const killerMoves = new Map<number, Move[]>()

function updateKillerMoves(depth: number, move: Move) {
  if (!killerMoves.has(depth)) {
    killerMoves.set(depth, [])
  }
  const moves = killerMoves.get(depth)!

  // Keep only 2 killer moves per depth
  if (!moves.some(m => movesEqual(m, move))) {
    moves.unshift(move)
    if (moves.length > 2) moves.pop()
  }
}

function isKillerMove(depth: number, move: Move): boolean {
  return killerMoves.get(depth)?.some(m => movesEqual(m, move)) || false
}

function movesEqual(a: Move, b: Move): boolean {
  return a.from.row === b.from.row && a.from.col === b.from.col &&
    a.to.row === b.to.row && a.to.col === b.to.col
}

export function clearKillerMoves() {
  killerMoves.clear()
}

// ===== HISTORY HEURISTIC =====
const historyTable = new Map<string, number>()

function getMoveKey(move: Move): string {
  return `${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`
}

function updateHistory(move: Move, depth: number) {
  const key = getMoveKey(move)
  const current = historyTable.get(key) || 0
  historyTable.set(key, current + depth * depth) // Deeper = more important
}

function getHistoryScore(move: Move): number {
  return historyTable.get(getMoveKey(move)) || 0
}

export function clearHistoryTable() {
  historyTable.clear()
}

// ===== OPENING BOOK =====
const openingBook = new Map<string, Move[]>()

function initializeOpeningBook() {
  // Standard opening moves for International Draughts
  // These are the most common and strongest opening moves

  const initialBoard = createInitialBoard()
  const initialHash = getBoardHash(initialBoard, 'white')

  // Best opening moves (notation: row 6-9 are white pieces)
  openingBook.set(initialHash, [
    { from: { row: 6, col: 1 }, to: { row: 5, col: 0 } },  // 32-28
    { from: { row: 6, col: 1 }, to: { row: 5, col: 2 } },  // 32-27
    { from: { row: 6, col: 3 }, to: { row: 5, col: 2 } },  // 33-28
    { from: { row: 6, col: 3 }, to: { row: 5, col: 4 } },  // 33-29
    { from: { row: 6, col: 5 }, to: { row: 5, col: 4 } },  // 34-29
    { from: { row: 6, col: 5 }, to: { row: 5, col: 6 } },  // 34-30
  ])
}

// Initialize opening book on module load
initializeOpeningBook()

function getBookMove(board: CheckerBoard, color: PlayerColor, moveCount: number): Move | null {
  if (moveCount > 6) return null // Only use book for first 6 moves

  const hash = getBoardHash(board, color)
  const moves = openingBook.get(hash)

  if (moves && moves.length > 0) {
    // Return random move from book for variety
    return moves[Math.floor(Math.random() * moves.length)]
  }

  return null
}

// ===== QUIESCENCE SEARCH =====
function quiescence(
  board: CheckerBoard,
  alpha: number,
  beta: number,
  maximizingColor: PlayerColor,
  isMaximizing: boolean,
  depth: number = 0,
  maxDepth: number = 10
): number {
  // Stand-pat evaluation (current position value)
  const standPat = evaluateBoardAdvanced(board, maximizingColor)

  // Beta cutoff - position is too good, opponent won't allow it
  if (standPat >= beta) return beta

  // Update alpha if stand-pat is better
  if (alpha < standPat) alpha = standPat

  // Depth limit to prevent infinite recursion
  if (depth >= maxDepth) return standPat

  const currentColor = isMaximizing ? maximizingColor : (maximizingColor === 'white' ? 'black' : 'white')

  // Only search captures in quiescence
  const captures = getAllCaptures(board, currentColor)

  // No captures available - quiet position
  if (captures.length === 0) return standPat

  // Order captures (multi-captures first, king captures second)
  const orderedCaptures = captures.sort((a, b) => {
    const capturesA = a.captured?.length || 0
    const capturesB = b.captured?.length || 0
    if (capturesA !== capturesB) return capturesB - capturesA

    // King captures
    if (a.captured && b.captured) {
      const kingCapturesA = a.captured.filter(c => {
        const piece = board[c.row][c.col]
        return piece && isKing(piece)
      }).length
      const kingCapturesB = b.captured.filter(c => {
        const piece = board[c.row][c.col]
        return piece && isKing(piece)
      }).length
      if (kingCapturesA !== kingCapturesB) return kingCapturesB - kingCapturesA
    }

    return 0
  })

  // Search captures
  for (const capture of orderedCaptures) {
    const newBoard = executeMove(board, capture)
    const score = -quiescence(newBoard, -beta, -alpha, maximizingColor, !isMaximizing, depth + 1, maxDepth)

    if (score >= beta) return beta // Beta cutoff
    if (score > alpha) alpha = score // Update alpha
  }

  return alpha
}

// ===== MINIMAX =====
function minimax(
  board: CheckerBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  maximizingColor: PlayerColor,
  startTime: number,
  maxTime: number
): number {
  // Time check
  if (Date.now() - startTime > maxTime) {
    return evaluateBoardAdvanced(board, maximizingColor)
  }

  const currentColor = isMaximizing ? maximizingColor : (maximizingColor === 'white' ? 'black' : 'white')
  const boardHash = getBoardHash(board, currentColor)

  // Transposition Table Lookup
  if (transpositionTable.has(boardHash)) {
    const entry = transpositionTable.get(boardHash)!
    if (entry.depth >= depth) {
      if (entry.type === 'exact') return entry.score
      if (entry.type === 'lower') alpha = Math.max(alpha, entry.score)
      if (entry.type === 'upper') beta = Math.min(beta, entry.score)
      if (alpha >= beta) return entry.score
    }
  }

  // Terminal state check
  const gameEnd = checkGameEnd(board, currentColor)
  if (gameEnd) {
    if (gameEnd === maximizingColor) return 10000 + depth
    if (gameEnd === 'draw') return 0
    return -10000 - depth
  }

  if (depth === 0) {
    // Use quiescence search instead of simple evaluation
    return quiescence(board, alpha, beta, maximizingColor, isMaximizing)
  }

  // ===== NULL MOVE PRUNING =====
  // If we can pass our turn and still have a good position, we can prune
  // Only in non-PV nodes and when not in check
  const hasCaptures = getAllCaptures(board, currentColor).length > 0

  if (depth >= 3 && !hasCaptures && beta - alpha === 1) {
    const R = 2 // Reduction factor
    const nullScore = -minimax(
      board,
      depth - 1 - R,
      -beta,
      -beta + 1,
      !isMaximizing,
      maximizingColor,
      startTime,
      maxTime
    )

    if (nullScore >= beta) {
      return beta // Cutoff
    }
  }

  let moves = getAllMoves(board, currentColor)

  if (moves.length === 0) {
    return isMaximizing ? -10000 : 10000
  }

  // ORDER MOVES for better alpha-beta pruning
  moves = orderMoves(moves, board, currentColor, depth)

  let bestScore = isMaximizing ? -Infinity : Infinity
  let type: 'exact' | 'lower' | 'upper' = 'exact'
  let bestMove: Move | null = null

  if (isMaximizing) {
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const newBoard = executeMove(board, move)

      // ===== LATE MOVE REDUCTION (LMR) =====
      let reduction = 0

      // Reduce depth for late moves that are likely not best
      if (i > 3 && depth > 3 && !move.captured && !move.promotion) {
        reduction = 1 + Math.floor(i / 6)
      }

      let evalScore = minimax(
        newBoard,
        depth - 1 - reduction,
        alpha,
        beta,
        false,
        maximizingColor,
        startTime,
        maxTime
      )

      // Re-search if reduced move scores surprisingly well
      if (reduction > 0 && evalScore > alpha) {
        evalScore = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false,
          maximizingColor,
          startTime,
          maxTime
        )
      }

      if (evalScore > bestScore) {
        bestScore = evalScore
        bestMove = move
      }
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) {
        type = 'lower'
        // Update killer moves and history on cutoff
        if (bestMove && !bestMove.captured) {
          updateKillerMoves(depth, bestMove)
        }
        if (bestMove) {
          updateHistory(bestMove, depth)
        }
        break
      }
    }
  } else {
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      const newBoard = executeMove(board, move)

      // ===== LATE MOVE REDUCTION (LMR) =====
      let reduction = 0

      // Reduce depth for late moves that are likely not best
      if (i > 3 && depth > 3 && !move.captured && !move.promotion) {
        reduction = 1 + Math.floor(i / 6)
      }

      let evalScore = minimax(
        newBoard,
        depth - 1 - reduction,
        alpha,
        beta,
        true,
        maximizingColor,
        startTime,
        maxTime
      )

      // Re-search if reduced move scores surprisingly well
      if (reduction > 0 && evalScore < beta) {
        evalScore = minimax(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true,
          maximizingColor,
          startTime,
          maxTime
        )
      }

      if (evalScore < bestScore) {
        bestScore = evalScore
        bestMove = move
      }
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) {
        type = 'upper'
        // Update killer moves and history on cutoff
        if (bestMove && !bestMove.captured) {
          updateKillerMoves(depth, bestMove)
        }
        if (bestMove) {
          updateHistory(bestMove, depth)
        }
        break
      }
    }
  }

  // Store in Transposition Table
  transpositionTable.set(boardHash, { score: bestScore, depth, type })

  return bestScore
}

export function getAIMove(board: CheckerBoard, color: PlayerColor, difficulty: AIDifficulty, moveCount: number = 0): AIMove {
  const config = AI_CONFIGS[difficulty]
  const startTime = Date.now()

  // Check opening book first (for first 6 moves)
  const bookMove = getBookMove(board, color, moveCount)
  if (bookMove) {
    return {
      move: bookMove,
      score: 0,
      depth: 0,
      timeSpent: Date.now() - startTime,
    }
  }

  if (transpositionTable.size > 50000) clearTranspositionTable();

  const moves = getAllMoves(board, color)

  if (moves.length === 0) {
    throw new Error('No valid moves available')
  }

  if (moves.length === 1) {
    return {
      move: moves[0],
      score: 0,
      depth: 0,
      timeSpent: Date.now() - startTime,
    }
  }

  // Iterative deepening with safe timeout
  let bestMove = moves[0]
  let bestScore = -Infinity
  let finalDepth = 1
  let timeOutOccurred = false

  for (let depth = 1; depth <= config.depth; depth++) {
    // Strict time check before starting new depth
    if (Date.now() - startTime > config.maxTime * 0.6) break

    const moveScores: { move: Move; score: number }[] = []

    // Order moves: Try the best move from previous iteration first (Principal Variation)
    // Then order the rest
    const orderedMoves = orderMoves([...moves], board, color, depth)
    // Optimization: Bring previous best move to front if matches
    const prevBestIndex = orderedMoves.findIndex(m => movesEqual(m, bestMove))
    if (prevBestIndex > 0) {
      const [prevBest] = orderedMoves.splice(prevBestIndex, 1)
      orderedMoves.unshift(prevBest)
    }

    let alpha = -Infinity
    const beta = Infinity
    let currentDepthBestMove = bestMove
    let currentDepthBestScore = -Infinity
    let iterationAborted = false

    for (const move of orderedMoves) {
      // Check time during the loop
      if (Date.now() - startTime > config.maxTime) {
        iterationAborted = true
        timeOutOccurred = true
        break
      }

      const newBoard = executeMove(board, move)
      const score = minimax(newBoard, depth - 1, alpha, beta, false, color, startTime, config.maxTime)

      // If minimax returned due to timeout, it might be inaccurate value (though my minimax returns static eval).
      // Ideally minimax should throw or return a specific flag, but checking time here is a proxy.
      if (Date.now() - startTime > config.maxTime) {
        iterationAborted = true
        timeOutOccurred = true
        break
      }

      moveScores.push({ move, score })

      if (score > currentDepthBestScore) {
        currentDepthBestScore = score
        currentDepthBestMove = move
      }

      if (score > alpha) {
        alpha = score
      }
    }

    if (iterationAborted) {
      // Don't update bestMove if we didn't finish this depth
      // console.log(`[AI] Aborted search at depth ${depth} due to timeout`)
      break
    } else {
      // Completed depth successfully
      bestMove = currentDepthBestMove
      bestScore = currentDepthBestScore
      finalDepth = depth

      // Sort moves for next iteration based on scores
      moves.sort((a, b) => {
        const scoreA = moveScores.find(ms => movesEqual(ms.move, a))?.score || -Infinity
        const scoreB = moveScores.find(ms => movesEqual(ms.move, b))?.score || -Infinity
        return scoreB - scoreA
      })
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    depth: finalDepth,
    timeSpent: Date.now() - startTime,
  }
}

// ===== HELPER FUNCTIONS =====
function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 10 && col >= 0 && col < 10
}

function cloneBoard(board: CheckerBoard): CheckerBoard {
  return board.map(row => [...row])
}

export function boardToString(board: CheckerBoard): string {
  return JSON.stringify(board)
}

export function stringToBoard(str: string): CheckerBoard {
  return JSON.parse(str)
}

export function moveToNotation(move: Move): string {
  const fromNotation = `${String.fromCharCode(97 + move.from.col)}${10 - move.from.row}`
  const toNotation = `${String.fromCharCode(97 + move.to.col)}${10 - move.to.row}`
  const separator = move.captured && move.captured.length > 0 ? 'x' : '-'
  return `${fromNotation}${separator}${toNotation}`
}

// Get all valid moves for current player
export function getAllValidMoves(board: CheckerBoard, currentTurn: PlayerColor): Move[] {
  return getAllMoves(board, currentTurn)
}
