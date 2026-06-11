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

// ---- Utility constants ----

export const MASK64 = 0xffffffffffffffffn

// ---- Colors ----

export const WHITE = 'w'
export const BLACK = 'b'

export type Color = 'w' | 'b'

// ---- Piece symbols ----

export const KING = 'k'
export const ADVISOR = 'a'
export const ELEPHANT = 'b'
export const HORSE = 'n'
export const ROOK = 'r'
export const CANNON = 'c'
export const PAWN = 'p'

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'c' | 'k' | 'a'

export const SYMBOLS = 'pnrbckaPNRBCKA'

// ---- Board squares ----

// prettier-ignore
export type Square =
  'a9' | 'b9' | 'c9' | 'd9' | 'e9' | 'f9' | 'g9' | 'h9' | 'i9' |
  'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8' | 'i8' |
  'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' | 'i7' |
  'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' | 'i6' |
  'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' | 'i5' |
  'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' | 'i4' |
  'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' | 'i3' |
  'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' | 'i2' |
  'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' | 'i1' |
  'a0' | 'b0' | 'c0' | 'd0' | 'e0' | 'f0' | 'g0' | 'h0' | 'i0'

// ---- Piece type ----

export type Piece = {
  color: Color
  type: PieceSymbol
}

// ---- Internal move representation ----

export type InternalMove = {
  color: Color
  from: number
  to: number
  piece: PieceSymbol
  captured?: PieceSymbol
  flags: number
}

// ---- History entry ----

export interface History {
  move: InternalMove
  kings: Record<Color, number>
  turn: Color
  halfMoves: number
  moveNumber: number
}

// ---- Empty square sentinel ----

export const EMPTY = -1

// ---- Move flags ----

export const FLAGS: Record<string, string> = {
  NORMAL: 'n',
  CAPTURE: 'c',
  NULL_MOVE: '-',
}

// ---- Move bit flags ----

export const BITS: Record<string, number> = {
  NORMAL: 1,
  CAPTURE: 2,
  NULL_MOVE: 128,
}

// ---- Null move SAN ----

export const SAN_NULLMOVE = '--'

// ---- Default starting position ----

export const DEFAULT_POSITION =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'

// ---- Board square arrays/maps ----

/*
 * Board: 10 ranks x 16 files per rank (9 real + 7 padding) = 160 elements.
 * Internal index = rank * 16 + file.
 * Rank 0 = red's back rank, Rank 9 = black's back rank.
 * File 0 = 'a', ..., File 8 = 'i', files 9-15 are off-board padding.
 */

// prettier-ignore
export const SQUARES: Square[] = [
  'a9', 'b9', 'c9', 'd9', 'e9', 'f9', 'g9', 'h9', 'i9',
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1',
  'a0', 'b0', 'c0', 'd0', 'e0', 'f0', 'g0', 'h0', 'i0'
]

// prettier-ignore
export const XQ_SQUARES: Record<Square, number> = {
  a9: 144, b9: 145, c9: 146, d9: 147, e9: 148, f9: 149, g9: 150, h9: 151, i9: 152,
  a8: 128, b8: 129, c8: 130, d8: 131, e8: 132, f8: 133, g8: 134, h8: 135, i8: 136,
  a7: 112, b7: 113, c7: 114, d7: 115, e7: 116, f7: 117, g7: 118, h7: 119, i7: 120,
  a6: 96, b6: 97, c6: 98, d6: 99, e6: 100, f6: 101, g6: 102, h6: 103, i6: 104,
  a5: 80, b5: 81, c5: 82, d5: 83, e5: 84, f5: 85, g5: 86, h5: 87, i5: 88,
  a4: 64, b4: 65, c4: 66, d4: 67, e4: 68, f4: 69, g4: 70, h4: 71, i4: 72,
  a3: 48, b3: 49, c3: 50, d3: 51, e3: 52, f3: 53, g3: 54, h3: 55, i3: 56,
  a2: 32, b2: 33, c2: 34, d2: 35, e2: 36, f2: 37, g2: 38, h2: 39, i2: 40,
  a1: 16, b1: 17, c1: 18, d1: 19, e1: 20, f1: 21, g1: 22, h1: 23, i1: 24,
  a0: 0, b0: 1, c0: 2, d0: 3, e0: 4, f0: 5, g0: 6, h0: 7, i0: 8,
}

// ---- Piece movement offsets ----

export const PIECE_OFFSETS: Record<PieceSymbol, number[]> = {
  k: [-16, 1, 16, -1],
  a: [-17, -15, 15, 17],
  b: [-34, -30, 30, 34],
  n: [-33, -31, -18, -14, 14, 18, 31, 33],
  r: [-16, 1, 16, -1],
  c: [-16, 1, 16, -1],
  p: [],
}

// ---- Horse leg squares (must be empty for each horse offset) ----

export const HORSE_LEGS: Record<number, number> = {
  [-33]: -16,
  [-31]: -16,
  [-18]: -1,
  [-14]: 1,
  [14]: -1,
  [18]: 1,
  [31]: 16,
  [33]: 16,
}

// ---- Elephant eye squares (must be empty for each elephant offset) ----

export const ELEPHANT_EYES: Record<number, number> = {
  [-34]: -17,
  [-30]: -15,
  [30]: 15,
  [34]: 17,
}

// ---- Chinese notation helpers ----

export const RED_NUMERALS = [
  '',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
]

export const PIECE_CHINESE: Record<
  PieceSymbol,
  { red: string; black: string }
> = {
  k: { red: '帅', black: '将' },
  a: { red: '仕', black: '士' },
  b: { red: '相', black: '象' },
  n: { red: '马', black: '马' },
  r: { red: '车', black: '车' },
  c: { red: '炮', black: '炮' },
  p: { red: '兵', black: '卒' },
}

export const WXF_LETTER: Record<PieceSymbol, string> = {
  k: 'K',
  a: 'A',
  b: 'B',
  n: 'N',
  r: 'R',
  c: 'C',
  p: 'P',
}

// Straight-moving pieces: target is step count for advance/retreat
export const STRAIGHT_PIECES: Set<string> = new Set(['r', 'c', 'k', 'p'])

// ---- Annotation suffixes ----

export const SUFFIX_LIST = ['!', '?', '!!', '!?', '?!', '??'] as const

export type Suffix = (typeof SUFFIX_LIST)[number]

// ---- NAG (Numeric Annotation Glyph) ----

/* eslint-disable @typescript-eslint/naming-convention */
export const NAG_TO_SYMBOL = {
  7: '□', // Only move
  22: '⨀', // Zugzwang
  10: '=', // Equal position
  13: '∞', // Unclear position
  14: '⩲', // White is slightly better
  15: '⩱', // Black is slightly better
  16: '±', // White is better
  17: '∓', // Black is better
  18: '+{}-', // White is winning
  19: '-+', // Black is winning
  146: 'N', // Novelty
  32: '↑↑', // Development
  36: '↑', // Initiative
  40: '→', // Attack
  132: '⇆', // Counterplay
  138: '⊕', // Time trouble
  44: '=∞', // With compensation
  140: '∆', // With the idea
} as const
/* eslint-enable @typescript-eslint/naming-convention */

export type NAG = number

/**
 * Convert a NAG (Numeric Annotation Glyph) to its text symbol representation.
 */
export function nagToGlyph(nag: NAG): string | undefined {
  return NAG_TO_SYMBOL[nag as keyof typeof NAG_TO_SYMBOL]
}

// ---- PGN headers ----

/* eslint-disable @typescript-eslint/naming-convention */

// These are required, according to spec
export const SEVEN_TAG_ROSTER: Record<string, string> = {
  Event: '?',
  Site: '?',
  Date: '????.??.??',
  Round: '?',
  White: '?',
  Black: '?',
  Result: '*',
}

/**
 * These nulls are placeholders to fix the order of tags (as they appear in PGN spec);
 * null values will be eliminated in getHeaders()
 */
export const SUPPLEMENTAL_TAGS: Record<string, string | null> = {
  WhiteTitle: null,
  BlackTitle: null,
  WhiteElo: null,
  BlackElo: null,
  WhiteUSCF: null,
  BlackUSCF: null,
  WhiteNA: null,
  BlackNA: null,
  WhiteType: null,
  BlackType: null,
  EventDate: null,
  EventSponsor: null,
  Section: null,
  Stage: null,
  Board: null,
  Opening: null,
  Variation: null,
  SubVariation: null,
  ECO: null,
  NIC: null,
  Time: null,
  UTCTime: null,
  UTCDate: null,
  TimeControl: null,
  SetUp: null,
  FEN: null,
  Termination: null,
  Annotator: null,
  Mode: null,
  PlyCount: null,
}

export const HEADER_TEMPLATE = {
  ...SEVEN_TAG_ROSTER,
  ...SUPPLEMENTAL_TAGS,
}

/* eslint-enable @typescript-eslint/naming-convention */
