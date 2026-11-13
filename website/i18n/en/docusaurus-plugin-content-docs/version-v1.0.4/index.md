# xiangqi.js

[![npm](https://img.shields.io/npm/v/@weshell/xiangqi.js?color=blue)](https://www.npmjs.com/package/@weshell/xiangqi.js)
[![npm](https://img.shields.io/npm/dm/@weshell/xiangqi.js)](https://www.npmjs.com/package/@weshell/xiangqi.js)

xiangqi.js is a TypeScript Chinese chess (Xiangqi) library for move
generation/validation, piece placement/movement, and check/checkmate/stalemate
detection - basically everything but the AI.

It has been extensively tested in Node.js.

## Installation

```sh
npm install @weshell/xiangqi.js
```

## Importing

### ESM

```js
import { Chess } from '@weshell/xiangqi.js'
```

### CommonJS

```js
const { Chess } = require('@weshell/xiangqi.js')
```

## Quick Start

```ts
import { Chess } from '@weshell/xiangqi.js'

const chess = new Chess()

// Play a move (LAN, ICCS, and WXF notations are supported)
chess.move('b0c2') // LAN
chess.move('B0-C2') // ICCS
chess.move('C2.5') // WXF

// Get Chinese notation moves
const moves = chess.moves({ chinese: true })
console.log(moves[0]) // "炮二平五"

// Inspect the board
console.log(chess.ascii())
console.log(chess.fen())
```

## Notation Systems

| Format  | Example    | Description                                                                        |
| ------- | ---------- | ---------------------------------------------------------------------------------- |
| LAN     | `b0c2`     | Long algebraic notation, from/to squares concatenated                              |
| ICCS    | `B0-C2`    | Internet Chinese Chess Server notation                                             |
| WXF     | `C2.5`     | World Xiangqi Federation notation                                                  |
| Chinese | `炮二平五` | Traditional Chinese notation (read-only, generated via `moves({ chinese: true })`) |

## Features

- **Game management** — FEN load/export, PGN read/write, undo
- **Move generation** — legal move generation for all pieces, including
  Xiangqi-specific rules such as blocked horse legs, blocked elephant eyes, and
  flying general
- **State detection** — check, checkmate, stalemate, perpetual check, threefold
  repetition, fifty-move rule
- **Notation** — WXF, ICCS, LAN, and Chinese notation
- **Annotation** — NAG numeric glyphs, suffix annotations (`!`, `?`, `!?`, ...),
  comments

## FEN Validation

`validateFen()` validates a FEN string standalone and returns a structured
result:

```ts
import { validateFen } from '@weshell/xiangqi.js'

validateFen(
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
)
// { ok: true }

validateFen('4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1')
// { ok: false, error: 'Invalid FEN: kings are facing each other (flying general)' }
```

FEN strings with 1 to 6 fields are accepted (fields after the side-to-move may
be omitted), and leading/trailing whitespace is tolerated. Validation covers the
10-rank × 9-file board structure, piece character validity, exactly one king per
side, advisor/elephant position constraints, and the flying-general rule.

## API

```ts
class Chess {
  constructor(fen?: string, options?: { skipValidation?: boolean })

  // Game management
  load(fen: string, options?: { skipValidation?; preserveHeaders? }): void
  fen(): string
  reset(): void
  clear(options?: { preserveHeaders? }): void
  setTurn(color: Color): boolean
  moveNumber(): number

  // Piece operations
  get(square: Square): Piece | undefined
  put(piece: { type: PieceSymbol; color: Color }, square: Square): boolean
  remove(square: Square): Piece | undefined
  findPiece(piece: Piece): Square[]

  // Moves
  move(
    move: string | { from: string; to: string } | null,
    options?: { strict? },
  ): Move
  moves(options?: { verbose?; chinese?; square?; piece? }): string[] | Move[]
  undo(): Move | null

  // State queries
  isCheck(): boolean
  isCheckmate(): boolean
  isStalemate(): boolean
  isGameOver(): boolean
  isDraw(): boolean
  isThreefoldRepetition(): boolean
  isDrawByFiftyMoves(): boolean
  isInsufficientMaterial(): boolean

  // Board
  board(): ({ square: Square; type: PieceSymbol; color: Color } | null)[][]
  ascii(): string
  squareColor(square: Square): 'light' | 'dark' | null

  // Notation helpers
  turn(): Color
  history(options?: { verbose? }): string[] | Move[]
  hash(): string
  attackers(square: Square, attackedBy?: Color): Square[]
  isAttacked(square: Square, attackedBy: Color): boolean
  inCheck(): boolean

  // PGN
  pgn(options?: { newline?; maxWidth? }): string
  loadPgn(pgn: string, options?: { strict?; newlineChar? }): void
  header(...args: string[]): Record<string, string | null>
  setHeader(key: string, value: string): Record<string, string>
  removeHeader(key: string): boolean
  getHeaders(): Record<string, string>

  // Comments and annotations
  getComment(): string
  setComment(comment: string): void
  deleteComment(): string
  getComments(): { fen: string; comment?; suffixAnnotation?; nags: NAG[] }[]
  setNags(nags: NAG[], fen?: string): void
  getNags(fen?: string): NAG[]
  addNag(nag: NAG, fen?: string): void
  removeNag(nag: NAG, fen?: string): boolean
  setSuffixAnnotation(suffix: Suffix, fen?: string): void

  // Performance testing
  perft(depth: number): number
}

function validateFen(fen: string): { ok: boolean; error?: string }
function nagToGlyph(nag: NAG): string | undefined
function xoroshiro128(state: bigint): () => bigint
```

### Types and Constants

```ts
type Color = 'w' | 'b'                       // w = red, b = black
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'c' | 'k' | 'a'
// p pawn, n horse, b elephant, r rook, c cannon, k king, a advisor
type Square = 'a0' | ... | 'i9'              // 9 files (a-i) × 10 ranks (0-9), red on ranks 0-4
type Piece = { color: Color; type: PieceSymbol }
type NAG = number
type Suffix = '!' | '?' | '!!' | '!?' | '?!' | '??'

const DEFAULT_POSITION: string               // starting position FEN
const SQUARES: Square[]
const SEVEN_TAG_ROSTER: Record<string, string>
const NAG_TO_SYMBOL: Record<number, string>
const SUFFIX_LIST: readonly Suffix[]
```

### The Move Object

`move()` and `moves({ verbose: true })` return a `Move` instance:

```ts
class Move {
  color: Color // side that moved
  piece: PieceSymbol // piece type
  from: Square // origin square
  to: Square // destination square
  captured?: PieceSymbol // captured piece, if any
  flags: string
  lan: string // LAN notation, e.g. 'b0c2'
  iccs: string // ICCS notation, e.g. 'B0-C2'
  wxf: string // WXF notation, e.g. 'C2.5'
  zh: string // Chinese notation, e.g. '炮二平五'
  before: string // FEN before the move
  after: string // FEN after the move
  isCheck: boolean
  isCheckmate: boolean
  isCapture(): boolean
  isNullMove(): boolean
}
```

## License

BSD-2-Clause
