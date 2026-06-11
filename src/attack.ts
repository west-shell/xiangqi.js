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
  Square,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  ROOK,
  CANNON,
  PAWN,
  WHITE,
  BLACK,
  XQ_SQUARES,
  EMPTY,
} from './types'
import {
  rank,
  file,
  algebraic,
  inPalace,
  crossedRiver,
  swapColor,
} from './board'

/**
 * Check if a piece at `from` attacks the square `to`.
 * Used internally by isAttacked and isAttackedVerbose.
 */
function _pieceAttacksSquare(
  board: Piece[],
  piece: Piece,
  color: Color,
  from: number,
  to: number,
): boolean {
  const targetFile = file(to)
  const targetRank = rank(to)
  const fromFile = file(from)
  const fromRank = rank(from)
  const df = targetFile - fromFile
  const dr = targetRank - fromRank
  const absDf = Math.abs(df)
  const absDr = Math.abs(dr)

  switch (piece.type) {
    case KING:
      // One step orthogonal, within palace
      if (
        inPalace(color, targetRank, targetFile) &&
        ((absDf === 1 && dr === 0) || (df === 0 && absDr === 1))
      ) {
        return true
      }
      break

    case ADVISOR:
      // One step diagonal, within palace
      if (
        inPalace(color, targetRank, targetFile) &&
        absDf === 1 &&
        absDr === 1
      ) {
        return true
      }
      break

    case ELEPHANT: {
      // Two steps diagonal (田), cannot cross river, check eye
      if (absDf === 2 && absDr === 2) {
        const eyeFile = fromFile + (df > 0 ? 1 : -1)
        const eyeRank = fromRank + (dr > 0 ? 1 : -1)
        const eyeSq = eyeRank * 16 + eyeFile
        if (!board[eyeSq]) {
          return true
        }
      }
      break
    }

    case HORSE: {
      // L-shape with leg blocking check
      if ((absDf === 2 && absDr === 1) || (absDf === 1 && absDr === 2)) {
        let legFile: number, legRank: number
        if (absDf === 2) {
          legFile = fromFile + (df > 0 ? 1 : -1)
          legRank = fromRank
        } else {
          legFile = fromFile
          legRank = fromRank + (dr > 0 ? 1 : -1)
        }
        const legSq = legRank * 16 + legFile
        if (!board[legSq]) {
          return true
        }
      }
      break
    }

    case ROOK:
      // Same file or same rank, no pieces between
      if (df === 0 || dr === 0) {
        let blocked = false
        if (df === 0) {
          const step = dr > 0 ? 16 : -16
          let j = from + step
          while (j !== to) {
            if (board[j]) {
              blocked = true
              break
            }
            j += step
          }
        } else {
          const step = df > 0 ? 1 : -1
          let j = from + step
          while (j !== to) {
            if (board[j]) {
              blocked = true
              break
            }
            j += step
          }
        }
        if (!blocked) return true
      }
      break

    case CANNON:
      // Same file or same rank, exactly one piece between
      if (df === 0 || dr === 0) {
        let pieceCount = 0
        if (df === 0) {
          const step = dr > 0 ? 16 : -16
          let j = from + step
          while (j !== to) {
            if (board[j]) pieceCount++
            j += step
          }
        } else {
          const step = df > 0 ? 1 : -1
          let j = from + step
          while (j !== to) {
            if (board[j]) pieceCount++
            j += step
          }
        }
        if (pieceCount === 1) return true
      }
      break

    case PAWN: {
      // Forward one step; after crossing river, also sideways
      const forward = color === WHITE ? 16 : -16
      if (targetRank === fromRank && absDf === 1) {
        // Sideways - only after crossing river
        if (crossedRiver(color, fromRank)) {
          return true
        }
      } else if (
        targetFile === fromFile &&
        targetRank === fromRank + (forward >> 4)
      ) {
        return true
      }
      break
    }
  }

  return false
}

/**
 * Check if any piece of the given color attacks the target square.
 * Returns true if at least one attacker is found, false otherwise.
 */
export function isAttacked(
  board: Piece[],
  color: Color,
  square: number,
): boolean {
  for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
    if ((i & 0xf) >= 9) {
      i += 6
      continue
    }

    const piece = board[i]
    if (piece === undefined || piece.color !== color) {
      continue
    }

    if (_pieceAttacksSquare(board, piece, color, i, square)) {
      return true
    }
  }

  return false
}

/**
 * Find all pieces of the given color that attack the target square.
 * Returns an array of algebraic square names of all attackers.
 */
export function isAttackedVerbose(
  board: Piece[],
  color: Color,
  square: number,
): Square[] {
  const attackers: Square[] = []

  for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
    if ((i & 0xf) >= 9) {
      i += 6
      continue
    }

    const piece = board[i]
    if (piece === undefined || piece.color !== color) {
      continue
    }

    if (_pieceAttacksSquare(board, piece, color, i, square)) {
      attackers.push(algebraic(i))
    }
  }

  return attackers
}

/**
 * Check if the two kings face each other on the same file with nothing between.
 * This is known as "flying general" (对面笑) and is illegal.
 */
export function isFlyingGeneral(
  board: Piece[],
  kings: Record<Color, number>,
): boolean {
  const wk = kings[WHITE]
  const bk = kings[BLACK]
  if (wk === EMPTY || bk === EMPTY) return false
  if (file(wk) !== file(bk)) return false

  const minRank = Math.min(rank(wk), rank(bk))
  const maxRank = Math.max(rank(wk), rank(bk))
  const f = file(wk)
  for (let r = minRank + 1; r < maxRank; r++) {
    if (board[r * 16 + f]) return false
  }
  return true
}

/**
 * Check if the king of the given color is attacked by the opponent.
 */
export function isKingAttacked(
  board: Piece[],
  kings: Record<Color, number>,
  color: Color,
): boolean {
  const square = kings[color]
  return square === EMPTY ? false : isAttacked(board, swapColor(color), square)
}
