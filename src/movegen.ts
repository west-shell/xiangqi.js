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
  InternalMove,
  Piece,
  PieceSymbol,
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
  PIECE_OFFSETS,
  HORSE_LEGS,
  ELEPHANT_EYES,
  BITS,
} from './types'
import { rank, file, offBoard, inPalace, crossedRiver, swapColor } from './board'

function addMove(
  moves: InternalMove[],
  color: Color,
  from: number,
  to: number,
  piece: PieceSymbol,
  captured?: PieceSymbol,
  flags: number = BITS.NORMAL,
) {
  moves.push({
    color,
    from,
    to,
    piece,
    captured,
    flags,
  })
}

export function generatePseudoMoves(
  board: Piece[],
  turn: Color,
  _kings: Record<Color, number>,
  options: { piece?: PieceSymbol; square?: Square } = {},
): InternalMove[] {
  const { piece: forPiece, square } = options
  const forSquare = square ? (square.toLowerCase() as Square) : undefined
  const moves: InternalMove[] = []
  const us = turn
  const them = swapColor(us)

  let firstSquare = XQ_SQUARES.a0
  let lastSquare = XQ_SQUARES.i9
  if (forSquare) {
    if (!(forSquare in XQ_SQUARES)) return []
    firstSquare = lastSquare = XQ_SQUARES[forSquare]
  }

  for (let from = firstSquare; from <= lastSquare; from++) {
    if ((from & 0xf) >= 9) {
      from += 6
      continue
    }

    if (!board[from] || board[from].color !== us) continue
    const { type } = board[from]
    if (forPiece && forPiece !== type) continue

    const fromRank = rank(from)

    switch (type) {
      case KING: {
        for (const offset of PIECE_OFFSETS.k) {
          const to = from + offset
          if (offBoard(to)) continue
          const toR = rank(to)
          const toF = file(to)
          if (!inPalace(us, toR, toF)) continue
          if (!board[to]) {
            addMove(moves, us, from, to, KING)
          } else if (board[to].color === them) {
            addMove(moves, us, from, to, KING, board[to].type, BITS.CAPTURE)
          }
        }
        break
      }

      case ADVISOR: {
        for (const offset of PIECE_OFFSETS.a) {
          const to = from + offset
          if (offBoard(to)) continue
          const toR = rank(to)
          const toF = file(to)
          if (!inPalace(us, toR, toF)) continue
          if (!board[to]) {
            addMove(moves, us, from, to, ADVISOR)
          } else if (board[to].color === them) {
            addMove(
              moves,
              us,
              from,
              to,
              ADVISOR,
              board[to].type,
              BITS.CAPTURE,
            )
          }
        }
        break
      }

      case ELEPHANT: {
        // Elephant cannot cross river
        const onOwnSide = us === WHITE ? fromRank <= 4 : fromRank >= 5
        if (!onOwnSide) break

        for (const offset of PIECE_OFFSETS[ELEPHANT]) {
          const to = from + offset
          if (offBoard(to)) continue
          const toR = rank(to)
          // Cannot cross river
          const toOnOwnSide = us === WHITE ? toR <= 4 : toR >= 5
          if (!toOnOwnSide) continue
          // Check eye blocking
          const eyeSq = from + ELEPHANT_EYES[offset]
          if (board[eyeSq]) continue
          if (!board[to]) {
            addMove(moves, us, from, to, ELEPHANT)
          } else if (board[to].color === them) {
            addMove(
              moves,
              us,
              from,
              to,
              ELEPHANT,
              board[to].type,
              BITS.CAPTURE,
            )
          }
        }
        break
      }

      case HORSE: {
        for (const offset of PIECE_OFFSETS[HORSE]) {
          const to = from + offset
          if (offBoard(to)) continue
          // Check leg blocking
          const legSq = from + HORSE_LEGS[offset]
          if (board[legSq]) continue
          if (!board[to]) {
            addMove(moves, us, from, to, HORSE)
          } else if (board[to].color === them) {
            addMove(
              moves,
              us,
              from,
              to,
              HORSE,
              board[to].type,
              BITS.CAPTURE,
            )
          }
        }
        break
      }

      case ROOK: {
        for (const offset of PIECE_OFFSETS.r) {
          let to = from + offset
          while (!offBoard(to)) {
            if (!board[to]) {
              addMove(moves, us, from, to, ROOK)
            } else {
              if (board[to].color === them) {
                addMove(
                  moves,
                  us,
                  from,
                  to,
                  ROOK,
                  board[to].type,
                  BITS.CAPTURE,
                )
              }
              break
            }
            to += offset
          }
        }
        break
      }

      case CANNON: {
        for (const offset of PIECE_OFFSETS.c) {
          let to = from + offset
          // Non-capturing moves: slide to empty squares until hitting a piece
          while (!offBoard(to) && !board[to]) {
            addMove(moves, us, from, to, CANNON)
            to += offset
          }
          // If we hit a piece, it's the screen. Skip it and look for a capture target.
          if (!offBoard(to)) {
            to += offset // skip the screen
            while (!offBoard(to) && !board[to]) {
              to += offset
            }
            if (!offBoard(to) && board[to]?.color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                CANNON,
                board[to].type,
                BITS.CAPTURE,
              )
            }
          }
        }
        break
      }

      case PAWN: {
        const forward = us === WHITE ? 16 : -16
        // Forward move
        const fwd = from + forward
        if (!offBoard(fwd)) {
          if (!board[fwd]) {
            addMove(moves, us, from, fwd, PAWN)
          } else if (board[fwd].color === them) {
            addMove(
              moves,
              us,
              from,
              fwd,
              PAWN,
              board[fwd].type,
              BITS.CAPTURE,
            )
          }
        }
        // Sideways moves (only after crossing river)
        if (crossedRiver(us, fromRank)) {
          for (const side of [-1, 1]) {
            const to = from + side
            if (offBoard(to) || rank(to) !== fromRank) continue
            if (!board[to]) {
              addMove(moves, us, from, to, PAWN)
            } else if (board[to].color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                PAWN,
                board[to].type,
                BITS.CAPTURE,
              )
            }
          }
        }
        break
      }
    }
  }

  return moves
}
