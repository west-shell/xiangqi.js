/**
 * @license
 * Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import {
  Color,
  Piece,
  PieceSymbol,
  InternalMove,
  BITS,
  WHITE,
  BLACK,
  PAWN,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  ROOK,
  CANNON,
  SAN_NULLMOVE,
  WXF_LETTER,
  RED_NUMERALS,
  XQ_SQUARES,
  STRAIGHT_PIECES,
  Square,
} from './types'
import { algebraic, file, rank, offBoard } from './board'

// === Helper functions ===

export function inferPieceType(san: string): PieceSymbol | undefined {
  let pieceType = san.charAt(0)
  if (pieceType >= 'a' && pieceType <= 'i') {
    const matches = san.match(/[a-i]\d.*[a-i]\d/)
    if (matches) {
      return undefined // ICCS coordinate notation - piece type from board
    }
    return PAWN
  }
  pieceType = pieceType.toLowerCase()
  if (pieceType === 'k') return KING
  if (pieceType === 'a') return ADVISOR
  if (pieceType === 'b' || pieceType === 'e') return ELEPHANT
  if (pieceType === 'n' || pieceType === 'h') return HORSE
  if (pieceType === 'r') return ROOK
  if (pieceType === 'c') return CANNON
  return pieceType as PieceSymbol
}

// parses all of the decorators out of a SAN string
export function strippedSan(move: string): string {
  return move.replace(/[+#]?[?!]*$/, '')
}

// === InternalMove -> notation strings ===

export function moveToWxf(board: Piece[], move: InternalMove): string {
  if (move.flags & BITS.NULL_MOVE) {
    return '--'
  }

  const { piece, color, from, to } = move
  const isRed = color === WHITE
  const letter = WXF_LETTER[piece]
  const pieceLetter = isRed ? letter : letter.toLowerCase()
  const labels = ['a', 'b', 'c', 'd', 'e']
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  const BOARD: (Piece | null)[][] = Array.from({ length: 9 }, () =>
    Array<Piece | null>(10).fill(null),
  )
  let fromX: number, fromY: number, toX: number, toY: number

  if (isRed) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        BOARD[x][y] = board[(9 - y) * 16 + (8 - x)]
      }
    }
    fromX = 8 - file(from)
    fromY = 9 - rank(from)
    toX = 8 - file(to)
    toY = 9 - rank(to)
  } else {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        BOARD[x][y] = board[y * 16 + x]
      }
    }
    fromX = file(from)
    fromY = rank(from)
    toX = file(to)
    toY = rank(to)
  }

  let prefix: string

  if (piece === 'a' || piece === 'b') {
    prefix = pieceLetter + numbers[fromX]
  } else if (piece === 'p') {
    prefix = wxfPawnPrefix(piece, color, pieceLetter, labels, numbers, BOARD, fromX, fromY)
  } else {
    const sameCol: number[] = []
    for (let y = 0; y < 10; y++) {
      const p = BOARD[fromX][y]
      if (p && p.type === piece && p.color === color) {
        sameCol.push(y)
      }
    }

    if (sameCol.length <= 1) {
      prefix = pieceLetter + numbers[fromX]
    } else {
      sameCol.sort((a, b) => a - b)
      const idx = sameCol.indexOf(fromY)
      if (sameCol.length === 2) {
        prefix = (idx === 0 ? '+' : '-') + pieceLetter
      } else if (sameCol.length === 3) {
        prefix = (idx === 0 ? '+' : idx === 1 ? '.' : '-') + pieceLetter
      } else {
        prefix = labels[idx] + pieceLetter
      }
    }
  }

  let action: string, target: string
  if (fromY === toY) {
    action = '.'
    target = numbers[toX]
  } else {
    const forward = toY < fromY
    action = forward ? '+' : '-'

    if (piece === 'r' || piece === 'c' || piece === 'k' || piece === 'p') {
      const steps = Math.abs(toY - fromY)
      target = numbers[steps - 1]
    } else {
      target = numbers[toX]
    }
  }

  return prefix + action + target
}

/** WXF pawn prefix: {a-e}{piece} or {+-.}{piece} or {piece}{col} */
export function wxfPawnPrefix(
  piece: PieceSymbol,
  color: Color,
  pieceLetter: string,
  labels: string[],
  numbers: string[],
  BOARD: (Piece | null)[][],
  fromX: number,
  fromY: number,
): string {
  const colMap = new Map<number, number[]>()
  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 10; y++) {
      const p = BOARD[x][y]
      if (p && p.type === piece && p.color === color) {
        if (!colMap.has(x)) colMap.set(x, [])
        colMap.get(x)!.push(y)
      }
    }
  }
  for (const rows of colMap.values()) {
    rows.sort((a, b) => a - b)
  }

  const multiCols = [...colMap.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([x]) => x)

  if (!multiCols.includes(fromX)) {
    return pieceLetter + numbers[fromX]
  }

  const rows = colMap.get(fromX)!
  const idx = rows.indexOf(fromY)

  if (multiCols.length === 1) {
    if (rows.length === 2) return (idx === 0 ? '+' : '-') + pieceLetter
    if (rows.length === 3) {
      return (idx === 0 ? '+' : idx === 1 ? '.' : '-') + pieceLetter
    }
    return labels[idx] + pieceLetter
  }

  const sortedCols = [...multiCols].sort((a, b) => a - b)
  const allPawns: { x: number; y: number }[] = []
  for (const x of sortedCols) {
    for (const y of colMap.get(x)!) {
      allPawns.push({ x, y })
    }
  }
  const globalIdx = allPawns.findIndex(p => p.x === fromX && p.y === fromY)
  return labels[globalIdx] + pieceLetter
}

/** WXF -> Chinese notation (text substitution) */
export function moveToZh(wxf: string, color: Color): string {
  if (wxf === '--') return '--'
  const isRed = color === WHITE
  const redNums = [
    '一', '二', '三', '四', '五',
    '六', '七', '八', '九',
  ]

  const PIECE_REV: Record<string, string> = {
    'K': '帅', 'k': '将',
    'A': '仕', 'a': '士',
    'B': '相', 'b': '象',
    'N': '马', 'n': '马',
    'R': '车', 'r': '车',
    'C': '炮', 'c': '炮',
    'P': '兵', 'p': '卒',
  }

  const re = /^([+\-.a-e])?([A-Za-z])(\d)?([+\-.])(\d)$/
  const m = wxf.match(re)
  if (!m) return wxf

  const prefix = m[1] || ''
  const pieceKey = m[2]
  const col = m[3] || ''
  const action = m[4]
  const target = m[5]

  const pieceChar = PIECE_REV[pieceKey]
  if (!pieceChar) return wxf

  let zhPrefix = ''
  if (prefix === '+') zhPrefix = '前'
  else if (prefix === '.') zhPrefix = '中'
  else if (prefix === '-') zhPrefix = '后'
  else if (prefix === 'a') zhPrefix = '一'
  else if (prefix === 'b') zhPrefix = '二'
  else if (prefix === 'c') zhPrefix = '三'
  else if (prefix === 'd') zhPrefix = '四'
  else if (prefix === 'e') zhPrefix = '五'

  let zhAction: string
  if (action === '.') zhAction = '平'
  else if (action === '+') zhAction = '进'
  else zhAction = '退'

  const toZhNum = (n: string) => isRed ? redNums[parseInt(n) - 1] : n

  let zh: string
  if (zhPrefix) {
    zh = zhPrefix + pieceChar + zhAction + toZhNum(target)
  } else {
    zh = pieceChar + toZhNum(col) + zhAction + toZhNum(target)
  }

  return zh
}

/** LAN format: lowercase source+target (e.g., 'b0c2') */
export function moveToLan(move: InternalMove): string {
  if (move.flags & BITS.NULL_MOVE) {
    return SAN_NULLMOVE
  }
  return algebraic(move.from) + algebraic(move.to)
}

/** ICCS format: uppercase with dash (e.g., 'B0-C2') */
export function moveToIccs(move: InternalMove): string {
  if (move.flags & BITS.NULL_MOVE) {
    return SAN_NULLMOVE
  }
  const fromSq = algebraic(move.from)
  const toSq = algebraic(move.to)
  return fromSq.toUpperCase() + '-' + toSq.toUpperCase()
}

// === notation string -> InternalMove ===

export function moveFromSan(
  san: string,
  turn: Color,
  legalMoves: InternalMove[],
  strict = false,
): InternalMove | null {
  const cleanMove = strippedSan(san)

  // Null move
  if (cleanMove == SAN_NULLMOVE) {
    return {
      color: turn,
      from: 0,
      to: 0,
      piece: 'k',
      flags: BITS.NULL_MOVE,
    }
  }

  // Try strict match against all legal moves
  const pieceType = inferPieceType(cleanMove)
  let candidateMoves = pieceType
    ? legalMoves.filter(m => m.piece === pieceType)
    : legalMoves

  for (let i = 0; i < candidateMoves.length; i++) {
    if (cleanMove === strippedSan(moveToLan(candidateMoves[i]))) {
      return candidateMoves[i]
    }
  }

  if (strict) {
    return null
  }

  // Permissive parser - handle ICCS format: [a-i][0-9]-?[a-i][0-9]
  const iccsMatch = cleanMove.match(/^([a-i])([0-9])-?([a-i])([0-9])$/i)
  if (iccsMatch) {
    const fromSq = (iccsMatch[1].toLowerCase() + iccsMatch[2]) as Square
    const toSq = (iccsMatch[3].toLowerCase() + iccsMatch[4]) as Square

    if (!(fromSq in XQ_SQUARES) || !(toSq in XQ_SQUARES)) return null

    const fromIdx = XQ_SQUARES[fromSq]
    const toIdx = XQ_SQUARES[toSq]

    for (let i = 0; i < legalMoves.length; i++) {
      if (legalMoves[i].from === fromIdx && legalMoves[i].to === toIdx) {
        return legalMoves[i]
      }
    }
  }

  // Permissive parser - try WXF format
  const wxfMatch = cleanMove.match(
    /^([KAEHRCPkaehrcp])?([1-9])([+=.x-])([0-9])/,
  )
  if (wxfMatch) {
    const piece = wxfMatch[1]?.toLowerCase() || PAWN
    const fromCol = parseInt(wxfMatch[2], 10)
    const action = wxfMatch[3]
    const targetNum = parseInt(wxfMatch[4], 10)

    /*
     * WXF column numbering: for Red, col 1=file 8, col 9=file 0.
     * For Black, col 1=file 0, col 9=file 8.
     */
    let fromFile: number
    if (turn === WHITE) {
      fromFile = 9 - fromCol
    } else {
      fromFile = fromCol - 1
    }

    // Find the piece on this file that can make the move
    const wxfMoves = legalMoves.filter(m => m.piece === piece)
    for (let i = 0; i < wxfMoves.length; i++) {
      const m = wxfMoves[i]
      if (file(m.from) === fromFile) {
        // Check that the move matches the WXF action and target
        const mToFile = file(m.to)
        const mToRank = rank(m.to)

        // WXF target: for '=' action, target is column; for +/- action, target is steps
        if (action === '=') {
          // Horizontal move - target is column
          let targetFile: number
          if (turn === WHITE) {
            targetFile = 9 - targetNum
          } else {
            targetFile = targetNum - 1
          }
          if (mToFile === targetFile && rank(m.from) === mToRank) {
            return m
          }
        } else if (action === '+' || action === '-') {
          // Forward/backward - target is steps or column
          const forward = turn === WHITE ? 1 : -1
          const actualSteps = (rank(m.to) - rank(m.from)) * forward
          if (actualSteps === targetNum) {
            return m
          }
        }
      }
    }
  }

  return null
}
