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

import { parse } from './pgn'

const MASK64 = 0xffffffffffffffffn

function rotl(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & 0xffffffffffffffffn
}

function wrappingMul(x: bigint, y: bigint) {
  return (x * y) & MASK64
}

// xoroshiro128**
export function xoroshiro128(state: bigint) {
  return function () {
    let s0 = BigInt(state & MASK64)
    let s1 = BigInt((state >> 64n) & MASK64)

    const result = wrappingMul(rotl(wrappingMul(s0, 5n), 7n), 9n)

    s1 ^= s0
    s0 = (rotl(s0, 24n) ^ s1 ^ (s1 << 16n)) & MASK64
    s1 = rotl(s1, 37n)

    state = (s1 << 64n) | s0

    return result
  }
}

const rand = xoroshiro128(0xa187eb39cdcaed8f31c4b365b102e01en)

// 2 colors x 7 piece types x 160 squares (10 ranks x 16 padded)
const PIECE_KEYS = Array.from({ length: 2 }, () =>
  Array.from({ length: 7 }, () => Array.from({ length: 160 }, () => rand())),
)

const SIDE_KEY = rand()

export const WHITE = 'w'
export const BLACK = 'b'

export const KING = 'k'
export const ADVISOR = 'a'
export const ELEPHANT = 'b'
export const HORSE = 'n'
export const ROOK = 'r'
export const CANNON = 'c'
export const PAWN = 'p'

export type Color = 'w' | 'b'
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'c' | 'k' | 'a'

/*
 * Board: 9 columns (a-i) x 10 ranks (0-9), ranks 0=red back, 9=black back
 */
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

export const SUFFIX_LIST = ['!', '?', '!!', '!?', '?!', '??'] as const

export type Suffix = (typeof SUFFIX_LIST)[number]

// NAG (Numeric Annotation Glyph) to symbol mapping
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

export const DEFAULT_POSITION =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'

export type Piece = {
  color: Color
  type: PieceSymbol
}

type InternalMove = {
  color: Color
  from: number
  to: number
  piece: PieceSymbol
  captured?: PieceSymbol
  flags: number
}

interface History {
  move: InternalMove
  kings: Record<Color, number>
  turn: Color
  halfMoves: number
  moveNumber: number
}

export class Move {
  color: Color
  from: Square
  to: Square
  piece: PieceSymbol
  captured?: PieceSymbol

  flags: string

  san: string
  lan: string
  before: string
  after: string

  constructor(
    internal: InternalMove,
    san: string,
    before: string,
    after: string,
  ) {
    const { color, piece, from, to, flags, captured } = internal

    this.color = color
    this.piece = piece
    this.from = algebraic(from)
    this.to = algebraic(to)

    this.san = san
    this.lan = algebraic(from) + algebraic(to)
    this.before = before
    this.after = after

    this.flags = ''
    for (const flag in BITS) {
      if (BITS[flag] & flags) {
        this.flags += FLAGS[flag]
      }
    }

    if (captured) {
      this.captured = captured
    }
  }

  isCapture() {
    return this.flags.indexOf(FLAGS['CAPTURE']) > -1
  }

  isNullMove() {
    return this.flags.indexOf(FLAGS['NULL_MOVE']) > -1
  }
}

const EMPTY = -1

const FLAGS: Record<string, string> = {
  NORMAL: 'n',
  CAPTURE: 'c',
  NULL_MOVE: '-',
}

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

const BITS: Record<string, number> = {
  NORMAL: 1,
  CAPTURE: 2,
  NULL_MOVE: 128,
}

/* eslint-disable @typescript-eslint/naming-convention */

// these are required, according to spec
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
const SUPPLEMENTAL_TAGS: Record<string, string | null> = {
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

const HEADER_TEMPLATE = {
  ...SEVEN_TAG_ROSTER,
  ...SUPPLEMENTAL_TAGS,
}
/* eslint-enable @typescript-eslint/naming-convention */

/*
 * Board: 10 ranks x 16 files per rank (9 real + 7 padding) = 160 elements.
 * Internal index = rank * 16 + file.
 * Rank 0 = red's back rank, Rank 9 = black's back rank.
 * File 0 = 'a', ..., File 8 = 'i', files 9-15 are off-board padding.
 */

// prettier-ignore
const XQ_SQUARES: Record<Square, number> = {
  a9: 144, b9: 145, c9: 146, d9: 147, e9: 148, f9: 149, g9: 150, h9: 151, i9: 152,
  a8: 128, b8: 129, c8: 130, d8: 131, e8: 132, f8: 133, g8: 134, h8: 135, i8: 136,
  a7: 112, b7: 113, c7: 114, d7: 115, e7: 116, f7: 117, g7: 118, h7: 119, i7: 120,
  a6:  96, b6:  97, c6:  98, d6:  99, e6: 100, f6: 101, g6: 102, h6: 103, i6: 104,
  a5:  80, b5:  81, c5:  82, d5:  83, e5:  84, f5:  85, g5:  86, h5:  87, i5:  88,
  a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71, i4:  72,
  a3:  48, b3:  49, c3:  50, d3:  51, e3:  52, f3:  53, g3:  54, h3:  55, i3:  56,
  a2:  32, b2:  33, c2:  34, d2:  35, e2:  36, f2:  37, g2:  38, h2:  39, i2:  40,
  a1:  16, b1:  17, c1:  18, d1:  19, e1:  20, f1:  21, g1:  22, h1:  23, i1:  24,
  a0:   0, b0:   1, c0:   2, d0:   3, e0:   4, f0:   5, g0:   6, h0:   7, i0:   8,
}

// Piece offsets in the 16-per-rank system
const PIECE_OFFSETS: Record<PieceSymbol, number[]> = {
  k: [-16, 1, 16, -1],
  a: [-17, -15, 15, 17],
  b: [-34, -30, 30, 34],
  n: [-33, -31, -18, -14, 14, 18, 31, 33],
  r: [-16, 1, 16, -1],
  c: [-16, 1, 16, -1],
  p: [],
}

// Horse leg squares: the square that must be empty for each horse offset
const HORSE_LEGS: Record<number, number> = {
  [-33]: -16,
  [-31]: -16,
  [-18]: -1,
  [-14]: 1,
  [14]: -1,
  [18]: 1,
  [31]: 16,
  [33]: 16,
}

// Elephant eye squares: the diagonal midpoint that must be empty for each elephant offset
const ELEPHANT_EYES: Record<number, number> = {
  [-34]: -17,
  [-30]: -15,
  [30]: 15,
  [34]: 17,
}

const SYMBOLS = 'pnrbckaPNRBCKA'

const SAN_NULLMOVE = '--'

// Check if a square index is off the board
function offBoard(square: number): boolean {
  return square < 0 || (square & 0xf) >= 9 || square >> 4 >= 10
}

// Extracts the zero-based rank of a square index.
function rank(square: number): number {
  return square >> 4
}

// Extracts the zero-based file of a square index.
function file(square: number): number {
  return square & 0xf
}

function isDigit(c: string): boolean {
  return '0123456789'.indexOf(c) !== -1
}

// Converts an internal square index to algebraic notation (ICCS: a0-i9).
function algebraic(square: number): Square {
  const f = file(square)
  const r = rank(square)
  return (String.fromCharCode(97 + f) + r) as Square
}

function swapColor(color: Color): Color {
  return color === WHITE ? BLACK : WHITE
}

// Check if a given rank/file is within the palace for a given color
function inPalace(color: Color, r: number, f: number): boolean {
  if (f < 3 || f > 5) return false
  if (color === WHITE) return r >= 0 && r <= 2
  return r >= 7 && r <= 9
}

// Check if a soldier has crossed the river
function crossedRiver(color: Color, r: number): boolean {
  if (color === WHITE) return r >= 5
  return r <= 4
}

export function validateFen(fen: string): { ok: boolean; error?: string } {
  // 1st criterion: 6 space-separated fields?
  const tokens = fen.split(/\s+/)
  if (tokens.length !== 6) {
    return {
      ok: false,
      error: 'Invalid FEN: must contain six space-delimited fields',
    }
  }

  // 2nd criterion: move number field is an integer value > 0?
  const moveNumber = parseInt(tokens[5], 10)
  if (isNaN(moveNumber) || moveNumber <= 0) {
    return {
      ok: false,
      error: 'Invalid FEN: move number must be a positive integer',
    }
  }

  // 3rd criterion: half move counter is an integer >= 0?
  const halfMoves = parseInt(tokens[4], 10)
  if (isNaN(halfMoves) || halfMoves < 0) {
    return {
      ok: false,
      error:
        'Invalid FEN: half move counter number must be a non-negative integer',
    }
  }

  // 4th criterion: 4th field is a valid e.p.-string? (always '-' for Xiangqi)
  if (tokens[3] !== '-') {
    return { ok: false, error: 'Invalid FEN: en-passant square must be "-"' }
  }

  // 5th criterion: 3rd field is a valid castle-string? (always '-' for Xiangqi)
  if (tokens[2] !== '-') {
    return {
      ok: false,
      error: 'Invalid FEN: castling availability must be "-"',
    }
  }

  // 6th criterion: 2nd field is "w" (white/red) or "b" (black)?
  if (!/^(w|b)$/.test(tokens[1])) {
    return { ok: false, error: 'Invalid FEN: side-to-move is invalid' }
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

  return { ok: true }
}

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

function inferPieceType(san: string): PieceSymbol | undefined {
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
function strippedSan(move: string): string {
  return move.replace(/[+#]?[?!]*$/, '')
}

export class Chess {
  private _board = new Array<Piece>(160)
  private _turn: Color = WHITE
  private _header: Record<string, string | null> = {}
  private _kings: Record<Color, number> = { w: EMPTY, b: EMPTY }
  private _halfMoves = 0
  private _moveNumber = 0
  private _history: History[] = []
  private _comments: Record<string, string> = {}
  private _suffixes: Record<string, Suffix> = {}
  private _nags: Record<string, NAG[]> = {}

  private _hash = 0n

  // tracks number of times a position has been seen for repetition checking
  private _positionCount = new Map<bigint, number>()

  constructor(fen = DEFAULT_POSITION, { skipValidation = false } = {}) {
    this._comments = {}
    this._suffixes = {}
    this._nags = {}
    this.load(fen, { skipValidation })
  }

  clear({ preserveHeaders = false } = {}) {
    this._board = new Array<Piece>(160)
    this._kings = { w: EMPTY, b: EMPTY }
    this._turn = WHITE
    this._halfMoves = 0
    this._moveNumber = 1
    this._history = []
    this._comments = {}
    this._header = preserveHeaders ? this._header : { ...HEADER_TEMPLATE }
    this._hash = this._computeHash()
    this._positionCount = new Map<bigint, number>()

    this._header['SetUp'] = null
    this._header['FEN'] = null
  }

  load(fen: string, { skipValidation = false, preserveHeaders = false } = {}) {
    let tokens = fen.split(/\s+/)

    // append commonly omitted fen tokens
    if (tokens.length >= 2 && tokens.length < 6) {
      const adjustments = ['-', '-', '0', '1']
      fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(' ')
    }

    tokens = fen.split(/\s+/)

    if (!skipValidation) {
      const { ok, error } = validateFen(fen)
      if (!ok) {
        throw new Error(error)
      }
    }

    const position = tokens[0]
    let rank = 9 // FEN starts from top (rank 9)
    let file = 0

    this.clear({ preserveHeaders })

    for (let i = 0; i < position.length; i++) {
      const piece = position.charAt(i)

      if (piece === '/') {
        rank--
        file = 0
      } else if (isDigit(piece)) {
        file += parseInt(piece, 10)
      } else {
        const color = piece < 'a' ? WHITE : BLACK
        this._put(
          { type: piece.toLowerCase() as PieceSymbol, color },
          algebraic(rank * 16 + file),
        )
        file++
      }
    }

    this._turn = tokens[1] as Color

    this._halfMoves = parseInt(tokens[4], 10)
    this._moveNumber = parseInt(tokens[5], 10)

    this._hash = this._computeHash()
    this._updateSetup(fen)
    this._incPositionCount()
  }

  fen() {
    let fen = ''

    for (let r = 9; r >= 0; r--) {
      let empty = 0
      for (let f = 0; f < 9; f++) {
        const i = r * 16 + f
        if (this._board[i]) {
          if (empty > 0) {
            fen += empty
            empty = 0
          }
          const { color, type: piece } = this._board[i]
          fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase()
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

    return [fen, this._turn, '-', '-', this._halfMoves, this._moveNumber].join(
      ' ',
    )
  }

  private _pieceKey(i: number) {
    if (!this._board[i]) {
      return 0n
    }

    const { color, type } = this._board[i]

    const colorIndex = {
      w: 0,
      b: 1,
    }[color]

    const typeIndex = {
      p: 0,
      n: 1,
      b: 2,
      r: 3,
      c: 4,
      k: 5,
      a: 6,
    }[type]

    return PIECE_KEYS[colorIndex][typeIndex][i]
  }

  private _computeHash() {
    let hash = 0n

    for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
      if ((i & 0xf) >= 9) {
        i += 6
        continue
      }

      if (this._board[i]) {
        hash ^= this._pieceKey(i)
      }
    }

    if (this._turn === 'b') {
      hash ^= SIDE_KEY
    }

    return hash
  }

  /*
   * Called when the initial board setup is changed with put() or remove().
   */
  private _updateSetup(fen: string) {
    if (this._history.length > 0) return

    if (fen !== DEFAULT_POSITION) {
      this._header['SetUp'] = '1'
      this._header['FEN'] = fen
    } else {
      this._header['SetUp'] = null
      this._header['FEN'] = null
    }
  }

  reset() {
    this.load(DEFAULT_POSITION)
    this._comments = {}
    this._suffixes = {}
    this._nags = {}
  }

  get(square: Square): Piece | undefined {
    return this._board[XQ_SQUARES[square]]
  }

  findPiece(piece: Piece): Square[] {
    const squares: Square[] = []
    for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
      if ((i & 0xf) >= 9) {
        i += 6
        continue
      }

      if (!this._board[i] || this._board[i]?.color !== piece.color) {
        continue
      }

      if (
        this._board[i].color === piece.color &&
        this._board[i].type === piece.type
      ) {
        squares.push(algebraic(i))
      }
    }

    return squares
  }

  put(
    { type, color }: { type: PieceSymbol; color: Color },
    square: Square,
  ): boolean {
    if (this._put({ type, color }, square)) {
      this._updateSetup(this.fen())
      return true
    }
    return false
  }

  private _set(sq: number, piece: Piece) {
    this._hash ^= this._pieceKey(sq)
    this._board[sq] = piece
    this._hash ^= this._pieceKey(sq)
  }

  private _put(
    { type, color }: { type: PieceSymbol; color: Color },
    square: Square,
  ): boolean {
    // check for piece
    if (SYMBOLS.indexOf(type.toLowerCase()) === -1) {
      return false
    }

    // check for valid square
    if (!(square in XQ_SQUARES)) {
      return false
    }

    const sq = XQ_SQUARES[square]

    // don't let the user place more than one king
    if (
      type == KING &&
      !(this._kings[color] == EMPTY || this._kings[color] == sq)
    ) {
      return false
    }

    const currentPieceOnSquare = this._board[sq]

    // if one of the kings will be replaced, clear the kings entry
    if (currentPieceOnSquare && currentPieceOnSquare.type === KING) {
      this._kings[currentPieceOnSquare.color] = EMPTY
    }

    this._set(sq, { type: type as PieceSymbol, color: color as Color })

    if (type === KING) {
      this._kings[color] = sq
    }

    return true
  }

  private _clear(sq: number) {
    this._hash ^= this._pieceKey(sq)
    delete this._board[sq]
  }

  remove(square: Square): Piece | undefined {
    const piece = this.get(square)
    this._clear(XQ_SQUARES[square])
    if (piece && piece.type === KING) {
      this._kings[piece.color] = EMPTY
    }

    this._updateSetup(this.fen())

    return piece
  }

  // Check if the two kings face each other on the same file with nothing between
  private _isFlyingGeneral(): boolean {
    const wk = this._kings['w']
    const bk = this._kings['b']
    if (wk === EMPTY || bk === EMPTY) return false
    if (file(wk) !== file(bk)) return false

    const minRank = Math.min(rank(wk), rank(bk))
    const maxRank = Math.max(rank(wk), rank(bk))
    const f = file(wk)
    for (let r = minRank + 1; r < maxRank; r++) {
      if (this._board[r * 16 + f]) return false
    }
    return true
  }

  private _attacked(color: Color, square: number): boolean
  private _attacked(color: Color, square: number, verbose: false): boolean
  private _attacked(color: Color, square: number, verbose: true): Square[]
  private _attacked(color: Color, square: number, verbose?: boolean) {
    const attackers: Square[] = []
    const targetFile = file(square)
    const targetRank = rank(square)

    for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
      if ((i & 0xf) >= 9) {
        i += 6
        continue
      }

      if (this._board[i] === undefined || this._board[i].color !== color) {
        continue
      }

      const piece = this._board[i]
      const fromFile = file(i)
      const fromRank = rank(i)
      const df = targetFile - fromFile
      const dr = targetRank - fromRank
      const absDf = Math.abs(df)
      const absDr = Math.abs(dr)

      let attacks = false

      switch (piece.type) {
        case KING:
          // One step orthogonal, within palace
          if (
            inPalace(color, targetRank, targetFile) &&
            ((absDf === 1 && dr === 0) || (df === 0 && absDr === 1))
          ) {
            attacks = true
          }
          break

        case ADVISOR:
          // One step diagonal, within palace
          if (
            inPalace(color, targetRank, targetFile) &&
            absDf === 1 &&
            absDr === 1
          ) {
            attacks = true
          }
          break

        case ELEPHANT: {
          // Two steps diagonal (田), cannot cross river, check eye
          if (absDf === 2 && absDr === 2) {
            // Check eye blocking
            const eyeFile = fromFile + (df > 0 ? 1 : -1)
            const eyeRank = fromRank + (dr > 0 ? 1 : -1)
            const eyeSq = eyeRank * 16 + eyeFile
            if (!this._board[eyeSq]) {
              attacks = true
            }
          }
          break
        }

        case HORSE: {
          // L-shape with leg blocking check
          if ((absDf === 2 && absDr === 1) || (absDf === 1 && absDr === 2)) {
            // Determine leg square
            let legFile: number, legRank: number
            if (absDf === 2) {
              legFile = fromFile + (df > 0 ? 1 : -1)
              legRank = fromRank
            } else {
              legFile = fromFile
              legRank = fromRank + (dr > 0 ? 1 : -1)
            }
            const legSq = legRank * 16 + legFile
            if (!this._board[legSq]) {
              attacks = true
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
              let j = i + step
              while (j !== square) {
                if (this._board[j]) {
                  blocked = true
                  break
                }
                j += step
              }
            } else {
              const step = df > 0 ? 1 : -1
              let j = i + step
              while (j !== square) {
                if (this._board[j]) {
                  blocked = true
                  break
                }
                j += step
              }
            }
            if (!blocked) attacks = true
          }
          break

        case CANNON:
          // Same file or same rank, exactly one piece between
          if (df === 0 || dr === 0) {
            let pieceCount = 0
            if (df === 0) {
              const step = dr > 0 ? 16 : -16
              let j = i + step
              while (j !== square) {
                if (this._board[j]) pieceCount++
                j += step
              }
            } else {
              const step = df > 0 ? 1 : -1
              let j = i + step
              while (j !== square) {
                if (this._board[j]) pieceCount++
                j += step
              }
            }
            if (pieceCount === 1) attacks = true
          }
          break

        case PAWN: {
          // Forward one step; after crossing river, also sideways
          const forward = color === WHITE ? 16 : -16
          if (targetRank === fromRank && absDf === 1) {
            // Sideways - only after crossing river
            if (crossedRiver(color, fromRank)) {
              attacks = true
            }
          } else if (
            targetFile === fromFile &&
            targetRank === fromRank + (forward >> 4)
          ) {
            attacks = true
          }
          break
        }
      }

      if (attacks) {
        if (!verbose) {
          return true
        } else {
          attackers.push(algebraic(i))
        }
      }
    }

    if (verbose) {
      return attackers
    } else {
      return false
    }
  }

  attackers(square: Square, attackedBy?: Color): Square[] {
    if (!attackedBy) {
      return this._attacked(this._turn, XQ_SQUARES[square], true)
    } else {
      return this._attacked(attackedBy, XQ_SQUARES[square], true)
    }
  }

  private _isKingAttacked(color: Color): boolean {
    const square = this._kings[color]
    return square === -1 ? false : this._attacked(swapColor(color), square)
  }

  hash(): string {
    return this._hash.toString(16)
  }

  isAttacked(square: Square, attackedBy: Color): boolean {
    return this._attacked(attackedBy, XQ_SQUARES[square])
  }

  isCheck(): boolean {
    return this._isKingAttacked(this._turn)
  }

  inCheck(): boolean {
    return this.isCheck()
  }

  // In Xiangqi, having no legal moves is a loss (not stalemate)
  isCheckmate(): boolean {
    return this._moves().length === 0
  }

  // In Xiangqi, stalemate does not exist - no legal moves is a loss
  isStalemate(): boolean {
    return false
  }

  isInsufficientMaterial(): boolean {
    const pieces: Record<string, number> = {}
    let numPieces = 0

    for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
      if ((i & 0xf) >= 9) {
        i += 6
        continue
      }

      if (this._board[i]) {
        pieces[this._board[i].type] = (pieces[this._board[i].type] || 0) + 1
        numPieces++
      }
    }

    // Only kings left
    if (numPieces === 2) return true

    /*
     * One side has only king, other has king + advisors/elephants only
     * (advisors and elephants alone cannot checkmate)
     */
    const attackPieces = [
      pieces[ROOK] || 0,
      pieces[CANNON] || 0,
      pieces[HORSE] || 0,
      pieces[PAWN] || 0,
    ]
    const hasAttackPieces = attackPieces.some((c) => c > 0)

    if (!hasAttackPieces) {
      /*
       * Only kings, advisors, elephants remain.
       * Advisors and elephants from one side cannot force checkmate.
       */
      if ((pieces[ADVISOR] || 0) + (pieces[ELEPHANT] || 0) <= 2) {
        return true
      }
    }

    return false
  }

  isThreefoldRepetition(): boolean {
    return this._getPositionCount(this._hash) >= 3
  }

  isDrawByFiftyMoves(): boolean {
    return this._halfMoves >= 100
  }

  isDraw(): boolean {
    return (
      this.isDrawByFiftyMoves() ||
      this.isInsufficientMaterial() ||
      this.isThreefoldRepetition()
    )
  }

  isGameOver(): boolean {
    return this.isCheckmate() || this.isDraw()
  }

  private _createMove(internal: InternalMove) {
    const san = this._moveToSan(internal)
    const before = this.fen()

    this._makeMove(internal)
    const after = this.fen()
    this._undoMove()

    return new Move(internal, san, before, after)
  }

  moves(): string[]
  moves({ square }: { square: Square }): string[]
  moves({ piece }: { piece: PieceSymbol }): string[]

  moves({ square, piece }: { square: Square; piece: PieceSymbol }): string[]

  moves({ verbose, square }: { verbose: true; square?: Square }): Move[]
  moves({ verbose, square }: { verbose: false; square?: Square }): string[]
  moves({
    verbose,
    square,
  }: {
    verbose?: boolean
    square?: Square
  }): string[] | Move[]

  moves({ verbose, piece }: { verbose: true; piece?: PieceSymbol }): Move[]
  moves({ verbose, piece }: { verbose: false; piece?: PieceSymbol }): string[]
  moves({
    verbose,
    piece,
  }: {
    verbose?: boolean
    piece?: PieceSymbol
  }): string[] | Move[]

  moves({
    verbose,
    square,
    piece,
  }: {
    verbose: true
    square?: Square
    piece?: PieceSymbol
  }): Move[]
  moves({
    verbose,
    square,
    piece,
  }: {
    verbose: false
    square?: Square
    piece?: PieceSymbol
  }): string[]
  moves({
    verbose,
    square,
    piece,
  }: {
    verbose?: boolean
    square?: Square
    piece?: PieceSymbol
  }): string[] | Move[]

  moves({ square, piece }: { square?: Square; piece?: PieceSymbol }): Move[]

  moves({
    verbose = false,
    square = undefined,
    piece = undefined,
  }: { verbose?: boolean; square?: Square; piece?: PieceSymbol } = {}) {
    const moves = this._moves({ square, piece })

    if (verbose) {
      return moves.map((move) => this._createMove(move))
    } else {
      return moves.map((move) => this._moveToSan(move))
    }
  }

  private _moves({
    legal = true,
    piece: forPiece = undefined,
    square = undefined,
  }: {
    legal?: boolean
    piece?: PieceSymbol
    square?: Square
  } = {}): InternalMove[] {
    const forSquare = square ? (square.toLowerCase() as Square) : undefined

    const moves: InternalMove[] = []
    const us = this._turn
    const them = swapColor(us)

    let firstSquare = XQ_SQUARES.a0
    let lastSquare = XQ_SQUARES.i9

    if (forSquare) {
      if (!(forSquare in XQ_SQUARES)) {
        return []
      } else {
        firstSquare = lastSquare = XQ_SQUARES[forSquare]
      }
    }

    for (let from = firstSquare; from <= lastSquare; from++) {
      if ((from & 0xf) >= 9) {
        from += 6
        continue
      }

      if (!this._board[from] || this._board[from].color !== us) {
        continue
      }

      const { type } = this._board[from]
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
            if (!this._board[to]) {
              addMove(moves, us, from, to, KING)
            } else if (this._board[to].color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                KING,
                this._board[to].type,
                BITS.CAPTURE,
              )
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
            if (!this._board[to]) {
              addMove(moves, us, from, to, ADVISOR)
            } else if (this._board[to].color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                ADVISOR,
                this._board[to].type,
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
            if (this._board[eyeSq]) continue
            if (!this._board[to]) {
              addMove(moves, us, from, to, ELEPHANT)
            } else if (this._board[to].color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                ELEPHANT,
                this._board[to].type,
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
            if (this._board[legSq]) continue
            if (!this._board[to]) {
              addMove(moves, us, from, to, HORSE)
            } else if (this._board[to].color === them) {
              addMove(
                moves,
                us,
                from,
                to,
                HORSE,
                this._board[to].type,
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
              if (!this._board[to]) {
                addMove(moves, us, from, to, ROOK)
              } else {
                if (this._board[to].color === them) {
                  addMove(
                    moves,
                    us,
                    from,
                    to,
                    ROOK,
                    this._board[to].type,
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
            while (!offBoard(to) && !this._board[to]) {
              addMove(moves, us, from, to, CANNON)
              to += offset
            }
            // If we hit a piece, it's the screen. Skip it and look for a capture target.
            if (!offBoard(to)) {
              to += offset // skip the screen
              while (!offBoard(to) && !this._board[to]) {
                to += offset
              }
              if (!offBoard(to) && this._board[to]?.color === them) {
                addMove(
                  moves,
                  us,
                  from,
                  to,
                  CANNON,
                  this._board[to].type,
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
            if (!this._board[fwd]) {
              addMove(moves, us, from, fwd, PAWN)
            } else if (this._board[fwd].color === them) {
              addMove(
                moves,
                us,
                from,
                fwd,
                PAWN,
                this._board[fwd].type,
                BITS.CAPTURE,
              )
            }
          }
          // Sideways moves (only after crossing river)
          if (crossedRiver(us, fromRank)) {
            for (const side of [-1, 1]) {
              const to = from + side
              if (offBoard(to) || rank(to) !== fromRank) continue
              if (!this._board[to]) {
                addMove(moves, us, from, to, PAWN)
              } else if (this._board[to].color === them) {
                addMove(
                  moves,
                  us,
                  from,
                  to,
                  PAWN,
                  this._board[to].type,
                  BITS.CAPTURE,
                )
              }
            }
          }
          break
        }
      }
    }

    // return all pseudo-legal moves
    if (!legal || this._kings[us] === -1) {
      return moves
    }

    // filter out illegal moves
    const legalMoves: InternalMove[] = []

    for (let i = 0; i < moves.length; i++) {
      this._makeMove(moves[i])
      if (!this._isKingAttacked(us) && !this._isFlyingGeneral()) {
        legalMoves.push(moves[i])
      }
      this._undoMove()
    }

    return legalMoves
  }

  move(
    move: string | { from: string; to: string } | null,
    { strict = false }: { strict?: boolean } = {},
  ): Move {
    let moveObj: InternalMove | null = null

    if (typeof move === 'string') {
      moveObj = this._moveFromSan(move, strict)
    } else if (move === null) {
      moveObj = this._moveFromSan(SAN_NULLMOVE, strict)
    } else if (typeof move === 'object') {
      const moves = this._moves()

      for (let i = 0; i < moves.length; i++) {
        if (
          move.from === algebraic(moves[i].from) &&
          move.to === algebraic(moves[i].to)
        ) {
          moveObj = moves[i]
          break
        }
      }
    }

    // failed to find move
    if (!moveObj) {
      if (typeof move === 'string') {
        throw new Error(`Invalid move: ${move}`)
      } else {
        throw new Error(`Invalid move: ${JSON.stringify(move)}`)
      }
    }

    // disallow null moves when in check
    if (this.isCheck() && moveObj.flags & BITS.NULL_MOVE) {
      throw new Error('Null move not allowed when in check')
    }

    const prettyMove = this._createMove(moveObj)

    this._makeMove(moveObj)
    this._incPositionCount()
    return prettyMove
  }

  private _push(move: InternalMove) {
    this._history.push({
      move,
      kings: { b: this._kings.b, w: this._kings.w },
      turn: this._turn,
      halfMoves: this._halfMoves,
      moveNumber: this._moveNumber,
    })
  }

  private _movePiece(from: number, to: number) {
    this._hash ^= this._pieceKey(from)

    this._board[to] = this._board[from]
    delete this._board[from]

    this._hash ^= this._pieceKey(to)
  }

  private _makeMove(move: InternalMove) {
    const us = this._turn
    const them = swapColor(us)
    this._push(move)

    if (move.flags & BITS.NULL_MOVE) {
      if (us === BLACK) {
        this._moveNumber++
      }
      this._halfMoves++
      this._turn = them
      return
    }

    if (move.captured) {
      this._hash ^= this._pieceKey(move.to)
    }

    this._movePiece(move.from, move.to)

    // Update king position if king moved
    if (this._board[move.to].type === KING) {
      this._kings[us] = move.to
    }

    // Reset half-move clock on pawn moves and captures
    if (move.piece === PAWN || move.flags & BITS.CAPTURE) {
      this._halfMoves = 0
    } else {
      this._halfMoves++
    }

    if (us === BLACK) {
      this._moveNumber++
    }

    this._turn = them
    this._hash ^= SIDE_KEY
  }

  undo(): Move | null {
    const hash = this._hash
    const move = this._undoMove()
    if (move) {
      const prettyMove = this._createMove(move)
      this._decPositionCount(hash)
      return prettyMove
    }
    return null
  }

  private _undoMove(): InternalMove | null {
    const old = this._history.pop()
    if (old === undefined) {
      return null
    }

    const move = old.move

    this._kings = old.kings
    this._turn = old.turn
    this._halfMoves = old.halfMoves
    this._moveNumber = old.moveNumber

    this._hash ^= SIDE_KEY

    const us = this._turn
    const them = swapColor(us)

    if (move.flags & BITS.NULL_MOVE) {
      return move
    }

    this._movePiece(move.to, move.from)

    // Restore original piece (undoes any promotion, though we don't have promotion in Xiangqi)
    if (move.piece) {
      this._clear(move.from)
      this._set(move.from, { type: move.piece, color: us })
    }

    if (move.captured) {
      this._set(move.to, { type: move.captured, color: them })
    }

    return move
  }

  pgn({
    newline = '\n',
    maxWidth = 0,
  }: { newline?: string; maxWidth?: number } = {}): string {
    const result: string[] = []
    let headerExists = false

    for (const i in this._header) {
      const headerTag = this._header[i]
      if (headerTag) result.push(`[${i} "${this._header[i]}"]` + newline)
      headerExists = true
    }

    if (headerExists && this._history.length) {
      result.push(newline)
    }

    const appendComment = (moveString: string) => {
      const comment = this._comments[this.fen()]
      if (typeof comment !== 'undefined') {
        const delimiter = moveString.length > 0 ? ' ' : ''
        moveString = `${moveString}${delimiter}{${comment}}`
      }
      return moveString
    }

    const reversedHistory: InternalMove[] = []
    while (this._history.length > 0) {
      reversedHistory.push(this._undoMove()!)
    }

    const moves: string[] = []
    let moveString = ''

    if (reversedHistory.length === 0) {
      moves.push(appendComment(''))
    }

    while (reversedHistory.length > 0) {
      moveString = appendComment(moveString)
      const move = reversedHistory.pop()
      if (!move) break

      if (!this._history.length && move.color === 'b') {
        const prefix = `${this._moveNumber}. ...`
        moveString = moveString ? `${moveString} ${prefix}` : prefix
      } else if (move.color === 'w') {
        if (moveString.length) {
          moves.push(moveString)
        }
        moveString = this._moveNumber + '.'
      }

      moveString = moveString + ' ' + this._moveToSan(move)
      this._makeMove(move)
    }

    if (moveString.length) {
      moves.push(appendComment(moveString))
    }

    moves.push(this._header.Result || '*')

    if (maxWidth === 0) {
      return result.join('') + moves.join(' ')
    }

    const strip = function () {
      if (result.length > 0 && result[result.length - 1] === ' ') {
        result.pop()
        return true
      }
      return false
    }

    const wrapComment = function (width: number, move: string) {
      for (const token of move.split(' ')) {
        if (!token) continue
        if (width + token.length > maxWidth) {
          while (strip()) width--
          result.push(newline)
          width = 0
        }
        result.push(token)
        width += token.length
        result.push(' ')
        width++
      }
      if (strip()) width--
      return width
    }

    let currentWidth = 0
    for (let i = 0; i < moves.length; i++) {
      if (currentWidth + moves[i].length > maxWidth) {
        if (moves[i].includes('{')) {
          currentWidth = wrapComment(currentWidth, moves[i])
          continue
        }
      }
      if (currentWidth + moves[i].length > maxWidth && i !== 0) {
        if (result[result.length - 1] === ' ') {
          result.pop()
        }
        result.push(newline)
        currentWidth = 0
      } else if (i !== 0) {
        result.push(' ')
        currentWidth++
      }
      result.push(moves[i])
      currentWidth += moves[i].length
    }

    return result.join('')
  }

  header(...args: string[]): Record<string, string | null> {
    for (let i = 0; i < args.length; i += 2) {
      if (typeof args[i] === 'string' && typeof args[i + 1] === 'string') {
        this._header[args[i]] = args[i + 1]
      }
    }
    return this._header
  }

  setHeader(key: string, value: string): Record<string, string> {
    this._header[key] = value ?? SEVEN_TAG_ROSTER[key] ?? null
    return this.getHeaders()
  }

  removeHeader(key: string): boolean {
    if (key in this._header) {
      this._header[key] = SEVEN_TAG_ROSTER[key] || null
      return true
    }
    return false
  }

  getHeaders(): Record<string, string> {
    const nonNullHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(this._header)) {
      if (value !== null) {
        nonNullHeaders[key] = value
      }
    }
    return nonNullHeaders
  }

  loadPgn(
    pgn: string,
    {
      strict = false,
      newlineChar = '\r?\n',
    }: { strict?: boolean; newlineChar?: string } = {},
  ) {
    if (newlineChar !== '\r?\n') {
      pgn = pgn.replace(new RegExp(newlineChar, 'g'), '\n')
    }

    const parsedPgn = parse(pgn)

    this.reset()

    const headers = parsedPgn.headers
    let fen = ''

    for (const key in headers) {
      if (key.toLowerCase() === 'fen') {
        fen = headers[key]
      }
      this.header(key, headers[key])
    }

    if (!strict) {
      if (fen) {
        this.load(fen, { preserveHeaders: true })
      }
    } else {
      if (headers['SetUp'] === '1') {
        if (!('FEN' in headers)) {
          throw new Error(
            'Invalid PGN: FEN tag must be supplied with SetUp tag',
          )
        }
        this.load(headers['FEN'], { preserveHeaders: true })
      }
    }

    let node = parsedPgn.root

    while (node) {
      if (node.move) {
        const suffixAnnotation = node.suffixAnnotation

        const move = this._moveFromSan(node.move, strict)
        if (!move) {
          throw new Error(`Invalid move in PGN: ${node.move}`)
        } else {
          this._makeMove(move)
          this._incPositionCount()

          if (suffixAnnotation) {
            this._suffixes[this.fen()] = suffixAnnotation as Suffix
          }

          if (node.nags && node.nags.length > 0) {
            this._nags[this.fen()] = node.nags
          }
        }
      }

      if (node.comment !== undefined) {
        this._comments[this.fen()] = node.comment
      }

      node = node.variations[0]
    }

    const result = parsedPgn.result
    if (
      result &&
      Object.keys(this._header).length &&
      this._header['Result'] !== result
    ) {
      this.setHeader('Result', result)
    }
  }

  // Convert a move to ICCS notation (e.g., "b0e2")
  private _moveToSan(move: InternalMove): string {
    if (move.flags & BITS.NULL_MOVE) {
      return SAN_NULLMOVE
    }

    let output = algebraic(move.from) + algebraic(move.to)

    this._makeMove(move)
    if (this.isCheck()) {
      if (this.isCheckmate()) {
        output += '#'
      } else {
        output += '+'
      }
    }
    this._undoMove()

    return output
  }

  // Convert from SAN (WXF/ICCS notation) to internal move
  private _moveFromSan(move: string, strict = false): InternalMove | null {
    const cleanMove = strippedSan(move)

    // Null move
    if (cleanMove == SAN_NULLMOVE) {
      return {
        color: this._turn,
        from: 0,
        to: 0,
        piece: 'k',
        flags: BITS.NULL_MOVE,
      }
    }

    // Try strict match against all legal moves
    const pieceType = inferPieceType(cleanMove)
    let moves = this._moves({ legal: true, piece: pieceType })

    for (let i = 0; i < moves.length; i++) {
      if (cleanMove === strippedSan(this._moveToSan(moves[i]))) {
        return moves[i]
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

      moves = this._moves({ legal: true })
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].from === fromIdx && moves[i].to === toIdx) {
          return moves[i]
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
      if (this._turn === WHITE) {
        fromFile = 9 - fromCol
      } else {
        fromFile = fromCol - 1
      }

      // Find the piece on this file that can make the move
      moves = this._moves({ legal: true, piece: piece as PieceSymbol })
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i]
        if (file(m.from) === fromFile) {
          // Check that the move matches the WXF action and target
          const mToFile = file(m.to)
          const mToRank = rank(m.to)

          // WXF target: for '=' action, target is column; for +/- action, target is steps
          if (action === '=') {
            // Horizontal move - target is column
            let targetFile: number
            if (this._turn === WHITE) {
              targetFile = 9 - targetNum
            } else {
              targetFile = targetNum - 1
            }
            if (mToFile === targetFile && rank(m.from) === mToRank) {
              return m
            }
          } else if (action === '+' || action === '-') {
            // Forward/backward - target is steps or column
            const forward = this._turn === WHITE ? 1 : -1
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

  ascii(): string {
    let s = '   +---+---+---+---+---+---+---+---+---+\n'
    for (let r = 9; r >= 0; r--) {
      s += ' ' + r + ' |'
      for (let f = 0; f < 9; f++) {
        const sq = r * 16 + f
        if (this._board[sq]) {
          const piece = this._board[sq].type
          const color = this._board[sq].color
          const symbol =
            color === WHITE ? piece.toUpperCase() : piece.toLowerCase()
          s += ' ' + symbol + ' '
        } else {
          s += ' . '
        }
        if (f < 8) s += '|'
      }
      s += '|\n'
      if (r === 5) {
        s += '   +~~~+~~~+~~~+~~~+~~~+~~~+~~~+~~~+~~~+\n'
      } else if (r > 0) {
        s += '   +---+---+---+---+---+---+---+---+---+\n'
      }
    }
    s += '   +---+---+---+---+---+---+---+---+---+\n'
    s += '     a   b   c   d   e   f   g   h   i'
    return s
  }

  perft(depth: number): number {
    const moves = this._moves({ legal: false })
    let nodes = 0
    const color = this._turn

    for (let i = 0; i < moves.length; i++) {
      this._makeMove(moves[i])
      if (!this._isKingAttacked(color) && !this._isFlyingGeneral()) {
        if (depth - 1 > 0) {
          nodes += this.perft(depth - 1)
        } else {
          nodes++
        }
      }
      this._undoMove()
    }

    return nodes
  }

  setTurn(color: Color): boolean {
    if (this._turn == color) {
      return false
    }

    this.move(SAN_NULLMOVE)
    return true
  }

  turn(): Color {
    return this._turn
  }

  board(): ({ square: Square; type: PieceSymbol; color: Color } | null)[][] {
    const output: ({
      square: Square
      type: PieceSymbol
      color: Color
    } | null)[][] = []

    for (let r = 9; r >= 0; r--) {
      const row: ({
        square: Square
        type: PieceSymbol
        color: Color
      } | null)[] = []
      for (let f = 0; f < 9; f++) {
        const i = r * 16 + f
        if (this._board[i] == null) {
          row.push(null)
        } else {
          row.push({
            square: algebraic(i),
            type: this._board[i].type,
            color: this._board[i].color,
          })
        }
      }
      output.push(row)
    }

    return output
  }

  squareColor(square: Square): 'light' | 'dark' | null {
    if (square in XQ_SQUARES) {
      const sq = XQ_SQUARES[square]
      return (rank(sq) + file(sq)) % 2 === 0 ? 'light' : 'dark'
    }

    return null
  }

  history(): string[]
  history({ verbose }: { verbose: true }): Move[]
  history({ verbose }: { verbose: false }): string[]
  history({ verbose }: { verbose: boolean }): string[] | Move[]
  history({ verbose = false }: { verbose?: boolean } = {}) {
    const reversedHistory: InternalMove[] = []
    const moveHistory: (string | Move)[] = []

    while (this._history.length > 0) {
      reversedHistory.push(this._undoMove()!)
    }

    while (true) {
      const move = reversedHistory.pop()
      if (!move) break

      if (verbose) {
        moveHistory.push(this._createMove(move))
      } else {
        moveHistory.push(this._moveToSan(move))
      }
      this._makeMove(move)
    }

    return moveHistory
  }

  private _getPositionCount(hash: bigint): number {
    return this._positionCount.get(hash) ?? 0
  }

  private _incPositionCount() {
    this._positionCount.set(
      this._hash,
      (this._positionCount.get(this._hash) ?? 0) + 1,
    )
  }

  private _decPositionCount(hash: bigint) {
    const currentCount = this._positionCount.get(hash) ?? 0

    if (currentCount === 1) {
      this._positionCount.delete(hash)
    } else {
      this._positionCount.set(hash, currentCount - 1)
    }
  }

  private _pruneComments() {
    const reversedHistory: InternalMove[] = []
    const currentComments: Record<string, string> = {}

    const copyComment = (fen: string) => {
      if (fen in this._comments) {
        currentComments[fen] = this._comments[fen]
      }
    }

    while (this._history.length > 0) {
      reversedHistory.push(this._undoMove()!)
    }

    copyComment(this.fen())

    while (true) {
      const move = reversedHistory.pop()
      if (!move) break
      this._makeMove(move)
      copyComment(this.fen())
    }
    this._comments = currentComments
  }

  getComment(): string {
    return this._comments[this.fen()]
  }

  setComment(comment: string) {
    this._comments[this.fen()] = comment.replace('{', '[').replace('}', ']')
  }

  deleteComment(): string {
    return this.removeComment()
  }

  removeComment(): string {
    const comment = this._comments[this.fen()]
    delete this._comments[this.fen()]
    return comment
  }

  getComments(): {
    fen: string
    comment?: string
    suffixAnnotation?: string
    nags: NAG[]
  }[] {
    this._pruneComments()

    const allFenKeys = new Set<string>()
    Object.keys(this._comments).forEach((fen) => allFenKeys.add(fen))
    Object.keys(this._suffixes).forEach((fen) => allFenKeys.add(fen))
    Object.keys(this._nags).forEach((fen) => allFenKeys.add(fen))

    const result: {
      fen: string
      comment?: string
      suffixAnnotation?: string
      nags: NAG[]
    }[] = []

    for (const fen of allFenKeys) {
      const commentContent = this._comments[fen]
      const suffixAnnotation = this._suffixes[fen]
      const nags = this._nags[fen]

      const entry: {
        fen: string
        comment?: string
        suffixAnnotation?: string
        nags: NAG[]
      } = {
        fen: fen,
        nags: nags ?? [],
      }

      if (commentContent !== undefined) {
        entry.comment = commentContent
      }

      if (suffixAnnotation !== undefined) {
        entry.suffixAnnotation = suffixAnnotation
      }

      result.push(entry)
    }

    return result
  }

  getSuffixAnnotation(fen?: string): Suffix | undefined {
    const key = fen ?? this.fen()
    return this._suffixes[key]
  }

  setSuffixAnnotation(suffix: Suffix, fen?: string): void {
    if (!SUFFIX_LIST.includes(suffix)) {
      throw new Error(`Invalid suffix: ${suffix}`)
    }
    this._suffixes[fen || this.fen()] = suffix
  }

  removeSuffixAnnotation(fen?: string): Suffix | undefined {
    const key = fen || this.fen()
    const old = this._suffixes[key]
    delete this._suffixes[key]
    return old
  }

  getNags(fen?: string): NAG[] {
    const key = fen ?? this.fen()
    return this._nags[key] ?? []
  }

  addNag(nag: NAG, fen?: string): void {
    const key = fen || this.fen()
    if (!this._nags[key]) {
      this._nags[key] = []
    }
    if (!this._nags[key].includes(nag)) {
      this._nags[key].push(nag)
    }
  }

  setNags(nags: NAG[], fen?: string): void {
    const key = fen || this.fen()
    this._nags[key] = [...nags]
  }

  removeNags(fen?: string): NAG[] {
    const key = fen || this.fen()
    const old = this._nags[key] ?? []
    delete this._nags[key]
    return old
  }

  removeNag(nag: NAG, fen?: string): boolean {
    const key = fen || this.fen()
    const nags = this._nags[key]
    if (!nags) return false

    const index = nags.indexOf(nag)
    if (index === -1) return false

    nags.splice(index, 1)
    if (nags.length === 0) {
      delete this._nags[key]
    }
    return true
  }

  deleteComments(): { fen: string; comment: string }[] {
    return this.removeComments()
  }

  removeComments(): { fen: string; comment: string }[] {
    this._pruneComments()
    return Object.keys(this._comments).map((fen) => {
      const comment = this._comments[fen]
      delete this._comments[fen]
      return { fen: fen, comment: comment }
    })
  }

  moveNumber(): number {
    return this._moveNumber
  }
}
