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

import { Color, Square, WHITE, BLACK } from './types'

/**
 * Board: 10 ranks x 16 files per rank (9 real + 7 padding) = 160 elements.
 * Internal index = rank * 16 + file.
 * Rank 0 = red's back rank, Rank 9 = black's back rank.
 * File 0 = 'a', ..., File 8 = 'i', files 9-15 are off-board padding.
 */

// Check if a square index is off the board
export function offBoard(square: number): boolean {
  return square < 0 || (square & 0xf) >= 9 || square >> 4 >= 10
}

// Extracts the zero-based rank of a square index.
export function rank(square: number): number {
  return square >> 4
}

// Extracts the zero-based file of a square index.
export function file(square: number): number {
  return square & 0xf
}

export function isDigit(c: string): boolean {
  return '0123456789'.indexOf(c) !== -1
}

// Converts an internal square index to algebraic notation (ICCS: a0-i9).
export function algebraic(square: number): Square {
  const f = file(square)
  const r = rank(square)
  return (String.fromCharCode(97 + f) + r) as Square
}

export function swapColor(color: Color): Color {
  return color === WHITE ? BLACK : WHITE
}

// Check if a given rank/file is within the palace for a given color
export function inPalace(color: Color, r: number, f: number): boolean {
  if (f < 3 || f > 5) return false
  if (color === WHITE) return r >= 0 && r <= 2
  return r >= 7 && r <= 9
}

// Check if a soldier has crossed the river
export function crossedRiver(color: Color, r: number): boolean {
  if (color === WHITE) return r >= 5
  return r <= 4
}

/** Column 1-9 from the moving side's perspective (right -> left). */
export function playerCol(file: number, color: Color): number {
  return color === WHITE ? 9 - file : file + 1
}

/** Forward steps (positive = advance, negative = retreat). */
export function forwardSteps(
  fromRank: number,
  toRank: number,
  color: Color,
): number {
  const direction = color === WHITE ? 1 : -1
  return (toRank - fromRank) * direction
}
