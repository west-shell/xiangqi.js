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

import { Color, Piece, PieceSymbol, WHITE, BLACK } from './types'
import { isDigit } from './board'

export function validateFen(fen: string): { ok: boolean; error?: string } {
  // 1st criterion: at least 1 field (position), up to 6
  const tokens = fen.split(/\s+/)
  if (tokens.length < 1 || tokens.length > 6) {
    return {
      ok: false,
      error: 'Invalid FEN: must contain 1 to 6 space-delimited fields',
    }
  }

  if (tokens.length >= 6) {
    const moveNumber = parseInt(tokens[5], 10)
    if (isNaN(moveNumber) || moveNumber <= 0) {
      return {
        ok: false,
        error: 'Invalid FEN: move number must be a positive integer',
      }
    }
  }

  if (tokens.length >= 5) {
    const halfMoves = parseInt(tokens[4], 10)
    if (isNaN(halfMoves) || halfMoves < 0) {
      return {
        ok: false,
        error: 'Invalid FEN: half move counter must be a non-negative integer',
      }
    }
  }

  if (tokens.length >= 4) {
    if (tokens[3] !== '-') {
      return { ok: false, error: 'Invalid FEN: en-passant must be "-"' }
    }
  }

  if (tokens.length >= 3) {
    if (tokens[2] !== '-') {
      return {
        ok: false,
        error: 'Invalid FEN: castling must be "-"',
      }
    }
  }

  if (tokens.length >= 2) {
    if (!/^(w|b)$/.test(tokens[1])) {
      return { ok: false, error: 'Invalid FEN: side-to-move is invalid' }
    }
  }

  // 7th criterion: 1st field contains 10 rows?
  const rows = tokens[0].split('/')
  if (rows.length !== 10) {
    return {
      ok: false,
      error: "Invalid FEN: piece data does not contain 10 '/'-delimited rows",
    }
  }

  // 8th criterion: every row has exactly 9 files
  for (let i = 0; i < rows.length; i++) {
    let sumFields = 0
    let previousWasNumber = false

    for (let k = 0; k < rows[i].length; k++) {
      if (isDigit(rows[i][k])) {
        if (previousWasNumber) {
          return {
            ok: false,
            error: 'Invalid FEN: piece data is invalid (consecutive number)',
          }
        }
        sumFields += parseInt(rows[i][k], 10)
        previousWasNumber = true
      } else {
        if (!/^[pnrbckahePNRBCKAHE]$/.test(rows[i][k])) {
          return {
            ok: false,
            error: 'Invalid FEN: piece data is invalid (invalid piece)',
          }
        }
        sumFields += 1
        previousWasNumber = false
      }
    }
    if (sumFields !== 9) {
      return {
        ok: false,
        error: 'Invalid FEN: piece data is invalid (too many squares in rank)',
      }
    }
  }

  // 9th criterion: exactly one king per side
  const kings = [
    { color: 'red', regex: /K/g },
    { color: 'black', regex: /k/g },
  ]

  for (const { color, regex } of kings) {
    if (!regex.test(tokens[0])) {
      return { ok: false, error: `Invalid FEN: missing ${color} king` }
    }

    if ((tokens[0].match(regex) || []).length > 1) {
      return { ok: false, error: `Invalid FEN: too many ${color} kings` }
    }
  }

  // 10th criterion: positional checks for advisors, elephants, and flying general
  const board: (string | null)[][] = []
  for (let i = 0; i < rows.length; i++) {
    const row: (string | null)[] = []
    for (let k = 0; k < rows[i].length; k++) {
      if (isDigit(rows[i][k])) {
        for (let d = 0; d < parseInt(rows[i][k], 10); d++) {
          row.push(null)
        }
      } else {
        row.push(rows[i][k])
      }
    }
    board.push(row)
  }

  // Advisors must be on specific palace diagonal points
  // Red advisor (A): (3,9) (5,9) (4,8) (3,7) (5,7)
  // Black advisor (a): (3,0) (5,0) (4,1) (3,2) (5,2)
  const RED_ADVISOR_POSITIONS = new Set(['3,9', '5,9', '4,8', '3,7', '5,7'])
  const BLACK_ADVISOR_POSITIONS = new Set(['3,0', '5,0', '4,1', '3,2', '5,2'])

  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r][f]
      if (piece === 'A') {
        if (!RED_ADVISOR_POSITIONS.has(`${f},${r}`)) {
          return {
            ok: false,
            error: 'Invalid FEN: red advisor is on an invalid position',
          }
        }
      } else if (piece === 'a') {
        if (!BLACK_ADVISOR_POSITIONS.has(`${f},${r}`)) {
          return {
            ok: false,
            error: 'Invalid FEN: black advisor is on an invalid position',
          }
        }
      }
    }
  }

  // Elephants must be on specific "field" diagonal points (not crossing the river)
  // Red elephant (B/E): (2,9) (6,9) (0,7) (4,7) (8,7) (2,5) (6,5)
  // Black elephant (b/e): (2,0) (6,0) (0,2) (4,2) (8,2) (2,4) (6,4)
  const RED_ELEPHANT_POSITIONS = new Set([
    '2,9', '6,9', '0,7', '4,7', '8,7', '2,5', '6,5',
  ])
  const BLACK_ELEPHANT_POSITIONS = new Set([
    '2,0', '6,0', '0,2', '4,2', '8,2', '2,4', '6,4',
  ])

  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const piece = board[r][f]
      if (piece === 'B' || piece === 'E') {
        if (!RED_ELEPHANT_POSITIONS.has(`${f},${r}`)) {
          return {
            ok: false,
            error: 'Invalid FEN: red elephant is on an invalid position',
          }
        }
      } else if (piece === 'b' || piece === 'e') {
        if (!BLACK_ELEPHANT_POSITIONS.has(`${f},${r}`)) {
          return {
            ok: false,
            error: 'Invalid FEN: black elephant is on an invalid position',
          }
        }
      }
    }
  }

  // Flying general: kings must not face each other on the same file with no intervening piece
  let redKingRow = -1
  let redKingFile = -1
  let blackKingRow = -1
  let blackKingFile = -1
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      if (board[r][f] === 'K') {
        redKingRow = r
        redKingFile = f
      } else if (board[r][f] === 'k') {
        blackKingRow = r
        blackKingFile = f
      }
    }
  }

  if (redKingFile === blackKingFile) {
    let blocked = false
    const minRow = Math.min(redKingRow, blackKingRow)
    const maxRow = Math.max(redKingRow, blackKingRow)
    for (let r = minRow + 1; r < maxRow; r++) {
      if (board[r][redKingFile] !== null) {
        blocked = true
        break
      }
    }
    if (!blocked) {
      return {
        ok: false,
        error: 'Invalid FEN: kings are facing each other (flying general)',
      }
    }
  }

  return { ok: true }
}

export function parseFen(fen: string): {
  board: Piece[]
  turn: Color
  halfMoves: number
  moveNumber: number
} {
  let tokens = fen.split(/\s+/)

  // append commonly omitted fen tokens
  if (tokens.length >= 1 && tokens.length < 6) {
    const adjustments = ['w', '-', '-', '0', '1']
    fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(' ')
  }

  tokens = fen.split(/\s+/)

  const position = tokens[0]
  let rank = 9 // FEN starts from top (rank 9)
  let file = 0

  const board: Piece[] = new Array<Piece>(160)

  for (let i = 0; i < position.length; i++) {
    const piece = position.charAt(i)

    if (piece === '/') {
      rank--
      file = 0
    } else if (isDigit(piece)) {
      file += parseInt(piece, 10)
    } else {
      const color = piece < 'a' ? WHITE : BLACK
      let type = piece.toLowerCase()
      // Normalize alternate piece letters accepted by validateFen
      if (type === 'e')
        type = 'b' // elephant alternate
      else if (type === 'h') type = 'n' // horse alternate
      board[rank * 16 + file] = {
        type: type as PieceSymbol,
        color,
      }
      file++
    }
  }

  return {
    board,
    turn: tokens[1] as Color,
    halfMoves: parseInt(tokens[4], 10),
    moveNumber: parseInt(tokens[5], 10),
  }
}

export function serializeFen(
  board: Piece[],
  turn: Color,
  halfMoves: number,
  moveNumber: number,
): string {
  let fen = ''

  for (let r = 9; r >= 0; r--) {
    let empty = 0
    for (let f = 0; f < 9; f++) {
      const i = r * 16 + f
      if (board[i]) {
        if (empty > 0) {
          fen += empty
          empty = 0
        }
        const { color, type } = board[i]
        fen += color === WHITE ? type.toUpperCase() : type.toLowerCase()
      } else {
        empty++
      }
    }
    if (empty > 0) {
      fen += empty
    }
    if (r > 0) {
      fen += '/'
    }
  }

  return [fen, turn, '-', '-', halfMoves, moveNumber].join(' ')
}
