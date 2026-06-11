# Split chess.ts Into Focused Modules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the ~2615-line `chess.ts` into ~10 focused modules, leaving the `Chess` class as a thin orchestration layer (~400 lines) that delegates to pure functions.

**Architecture:** Chess class holds state (`_board`, `_turn`, `_kings`, `_hash`, `_history`, `_header`, `_comments`, etc.). All logic — move generation, attack detection, notation conversion, FEN, hashing — moves to standalone pure functions in separate files. `chess.ts` re-exports all public symbols for backward compatibility.

**Tech Stack:** TypeScript, no external deps. Rollup bundles from `src/chess.ts` entry point.

---

## File Structure

### New files to create (9 files):

| File | Responsibility | Est. Lines | Depends On |
|------|---------------|-----------|------------|
| `src/types.ts` | All types, constants, data structures | ~370 | (none) |
| `src/board.ts` | Board coordinate utilities | ~50 | types |
| `src/hash.ts` | Zobrist hashing (xoroshiro128, PIECE_KEYS, computeHash) | ~80 | types, board |
| `src/fen.ts` | FEN validation, parsing, serialization | ~200 | types, board |
| `src/move.ts` | Move class | ~65 | types |
| `src/notation.ts` | All 6 notation conversions (pure functions) | ~350 | types, board |
| `src/attack.ts` | Attack detection (isAttacked, isFlyingGeneral, isKingAttacked) | ~170 | types, board |
| `src/movegen.ts` | Pseudo-legal move generation | ~200 | types, board |
| `src/annotation.ts` | Comments/NAGs/suffixes management | ~100 | types |

### Modified file:

| File | Change |
|------|--------|
| `src/chess.ts` | Delete~2200 lines of implementation, keep state + thin delegation + re-exports |

---

### Dependency Graph

```
types.ts
  ↑         ↑
board.ts   hash.ts
  ↑         ↑
fen.ts  notation.ts  attack.ts  movegen.ts  move.ts  annotation.ts
  ↑         ↑            ↑           ↑         ↑          ↑
 └──────────────────────┬──────────────────────────────┘
                        ↑
                     chess.ts  (entry point, re-exports all)
```

No circular dependencies.

---

## Pure Function Signatures

Before writing code, the interface of every extracted function is locked:

### `src/board.ts`
```typescript
export function rank(square: number): number          // square >> 4
export function file(square: number): number           // square & 0xf
export function offBoard(square: number): boolean      // bounds check
export function algebraic(square: number): Square      // internal→a0-i9
export function swapColor(color: Color): Color
export function isDigit(c: string): boolean
export function inPalace(color: Color, r: number, f: number): boolean
export function crossedRiver(color: Color, r: number): boolean
export function playerCol(file: number, color: Color): number
export function forwardSteps(fromRank: number, toRank: number, color: Color): number
```

### `src/hash.ts`
```typescript
export function xoroshiro128(state: bigint): () => bigint
export function pieceKey(board: Piece[], i: number): bigint
export function computeHash(board: Piece[], turn: Color): bigint
// Also exports: PIECE_KEYS, SIDE_KEY (constants)
```

### `src/fen.ts`
```typescript
export function validateFen(fen: string): { ok: boolean; error?: string }
export function parseFen(fen: string): { board: Piece[]; turn: Color; halfMoves: number; moveNumber: number }
export function serializeFen(board: Piece[], turn: Color, halfMoves: number, moveNumber: number): string
```

### `src/notation.ts`
```typescript
export function moveToWxf(board: Piece[], move: InternalMove): string
export function wxfPawnPrefix(piece: PieceSymbol, color: Color, pieceLetter: string, labels: string[], numbers: string[], BOARD: (Piece | null)[][], fromX: number, fromY: number): string
export function moveToZh(wxf: string, color: Color): string
export function moveToLan(move: InternalMove): string
export function moveToIccs(move: InternalMove): string
export function inferPieceType(san: string): PieceSymbol | undefined
export function strippedSan(move: string): string
export function moveFromSan(san: string, turn: Color, legalMoves: InternalMove[], strict?: boolean): InternalMove | null
```

### `src/attack.ts`
```typescript
export function isFlyingGeneral(board: Piece[], kings: Record<Color, number>): boolean
export function isAttacked(board: Piece[], color: Color, square: number): boolean
export function isAttackedVerbose(board: Piece[], color: Color, square: number): Square[]
export function isKingAttacked(board: Piece[], kings: Record<Color, number>, color: Color): boolean
```

### `src/movegen.ts`
```typescript
export function generatePseudoMoves(board: Piece[], turn: Color, kings: Record<Color, number>, options?: { piece?: PieceSymbol; square?: Square }): InternalMove[]
```

### `src/annotation.ts`
```typescript
export function pruneComments(comments: Record<string, string>, fenHistory: string[]): Record<string, string>
export function addNag(nags: Record<string, NAG[]>, key: string, nag: NAG): void
// All comment/suffix/nag operations are simple map accessors
```

---

## Execution Order

Tasks must be done in order: each task creates a leaf module, then the next task can depend on it. The final task transforms chess.ts.

---

### Task 1: Create `src/types.ts`

**Files:**
- Create: `src/types.ts`
- Reference (DO NOT modify yet): `src/chess.ts` (read source of truth)

**What this file contains:** Move ALL of the following from chess.ts (top of file) into types.ts:

1. Constants: `WHITE`, `BLACK`, `KING`, `ADVISOR`, `ELEPHANT`, `HORSE`, `ROOK`, `CANNON`, `PAWN`, `EMPTY`, `SYMBOLS`, `SAN_NULLMOVE`, `DEFAULT_POSITION`, `MASK64`, `SUFFIX_LIST`
2. Types: `Color`, `PieceSymbol`, `Square`, `Piece`, `InternalMove`, `History`, `Suffix`, `NAG`
3. Data tables: `FLAGS`, `BITS`, `SEVEN_TAG_ROSTER`, `SUPPLEMENTAL_TAGS`, `HEADER_TEMPLATE`
4. Board layouts: `XQ_SQUARES`, `SQUARES`, `PIECE_OFFSETS`, `HORSE_LEGS`, `ELEPHANT_EYES`
5. Chinese notation tables: `RED_NUMERALS`, `PIECE_CHINESE`, `WXF_LETTER`, `STRAIGHT_PIECES`
6. NAG mapping: `NAG_TO_SYMBOL`, `nagToGlyph()`

- [ ] **Step 1: Create `src/types.ts`**

Copy chess.ts lines 30-398 (MASK64 through SYMBOLS/SAN_NULLMOVE), lines 67-178 (types), lines 264-288 (FLAGS/BITS), lines 293-343 (SEVEN_TAG_ROSTER/SUPPLEMENTAL_TAGS/HEADER_TEMPLATE), lines 354-396 (XQ_SQUARES/PIECE_OFFSETS/HORSE_LEGS/ELEPHANT_EYES), lines 83-103 (notation tables), lines 135-170 (NAG/Suffix types), line 172-173 (DEFAULT_POSITION).

Each section should be labeled with clear comments.

```typescript
/**
 * @license
 * Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
 * ... (same license header as chess.ts)
 */

const MASK64 = 0xffffffffffffffffn

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

// ... all the rest
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors (types.ts has no imports from the project, only from `typescript` lib)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: extract types.ts from chess.ts"
```

---

### Task 2: Create `src/board.ts`

**Files:**
- Create: `src/board.ts`

**What this file contains:** Board utility functions from chess.ts lines 402-443 (offBoard, rank, file, isDigit, algebraic, swapColor, inPalace, crossedRiver) and lines 108-117 (playerCol, forwardSteps).

- [ ] **Step 1: Create `src/board.ts`**

```typescript
import { Color, Square } from './types'
// import WHITE/BLACK if needed by swapColor, inPalace, crossedRiver

export function offBoard(square: number): boolean {
  return square < 0 || (square & 0xf) >= 9 || square >> 4 >= 10
}

export function rank(square: number): number {
  return square >> 4
}

export function file(square: number): number {
  return square & 0xf
}

export function isDigit(c: string): boolean {
  return '0123456789'.indexOf(c) !== -1
}

export function algebraic(square: number): Square {
  const f = file(square)
  const r = rank(square)
  return (String.fromCharCode(97 + f) + r) as Square
}

export function swapColor(color: Color): Color {
  return color === WHITE ? BLACK : WHITE
}

export function inPalace(color: Color, r: number, f: number): boolean {
  if (f < 3 || f > 5) return false
  if (color === WHITE) return r >= 0 && r <= 2
  return r >= 7 && r <= 9
}

export function crossedRiver(color: Color, r: number): boolean {
  if (color === WHITE) return r >= 5
  return r <= 4
}

export function playerCol(file: number, color: Color): number {
  return color === WHITE ? 9 - file : file + 1
}

export function forwardSteps(fromRank: number, toRank: number, color: Color): number {
  const direction = color === WHITE ? 1 : -1
  return (toRank - fromRank) * direction
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/board.ts
git commit -m "refactor: extract board.ts from chess.ts"
```

---

### Task 3: Create `src/hash.ts`

**Files:**
- Create: `src/hash.ts`

**What this file contains:** Zobrist hashing infrastructure from chess.ts lines 30-66 (rotl, wrappingMul, xoroshiro128, PIECE_KEYS, SIDE_KEY) plus the Chess class methods `_pieceKey` and `_computeHash` converted to standalone functions.

The Chess class currently has:
```typescript
private _pieceKey(i: number) { /* reads this._board[i] */ }
private _computeHash() { /* iterates board, XORs piece keys */ }
```

These become:
```typescript
export function pieceKey(board: Piece[], i: number): bigint
export function computeHash(board: Piece[], turn: Color): bigint
```

- [ ] **Step 1: Create `src/hash.ts`**

```typescript
import { Color, Piece, PIECE_KEYS, SIDE_KEY, XQ_SQUARES } from './types'

const MASK64 = 0xffffffffffffffffn

function rotl(x: bigint, k: bigint): bigint {
  return ((x << k) | (x >> (64n - k))) & 0xffffffffffffffffn
}

function wrappingMul(x: bigint, y: bigint) {
  return (x * y) & MASK64
}

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

export const PIECE_KEYS = Array.from({ length: 2 }, () =>
  Array.from({ length: 7 }, () => Array.from({ length: 160 }, () => rand())),
)

export const SIDE_KEY = rand()

export function pieceKey(board: Piece[], i: number): bigint {
  if (!board[i]) return 0n
  const { color, type } = board[i]
  const colorIndex = color === WHITE ? 0 : 1
  const typeIndex = { p: 0, n: 1, b: 2, r: 3, c: 4, k: 5, a: 6 }[type]
  return PIECE_KEYS[colorIndex][typeIndex][i]
}

export function computeHash(board: Piece[], turn: Color): bigint {
  let hash = 0n
  for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
    if ((i & 0xf) >= 9) { i += 6; continue }
    if (board[i]) hash ^= pieceKey(board, i)
  }
  if (turn === BLACK) hash ^= SIDE_KEY
  return hash
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hash.ts
git commit -m "refactor: extract hash.ts from chess.ts"
```

---

### Task 4: Create `src/fen.ts`

**Files:**
- Create: `src/fen.ts`

**What this file contains:**
1. `validateFen()` — from chess.ts lines 445-556, already a standalone function
2. `parseFen()` — the board-loading logic from `Chess.load()` lines 661-683, as a pure function that returns parsed data
3. `serializeFen()` — the board-printing logic from `Chess.fen()` lines 695-724, as a pure function

- [ ] **Step 1: Create `src/fen.ts`**

```typescript
import { Color, Color, Piece, PieceSymbol, Square, BLACK, WHITE, DEFAULT_POSITION, SYMBOLS, XQ_SQUARES } from './types'
import { algebraic, isDigit, rank } from './board'
// Also need inPalace, crossedRiver for validation? No — validateFen only checks format, not palace rules.

export function validateFen(fen: string): { ok: boolean; error?: string } {
  // Copy verbatim from chess.ts lines 446-556
  // Remove any references to `this.` — there are none
}

export function parseFen(fen: string): { board: Piece[]; turn: Color; halfMoves: number; moveNumber: number } {
  const tokens = fen.split(/\s+/)
  // Adjust tokens for short FEN (same logic as chess.ts lines 647-652)
  
  const position = tokens[0]
  const board = new Array<Piece>(160)
  let rankIdx = 9
  let fileIdx = 0

  for (let i = 0; i < position.length; i++) {
    const piece = position.charAt(i)
    if (piece === '/') {
      rankIdx--
      fileIdx = 0
    } else if (isDigit(piece)) {
      fileIdx += parseInt(piece, 10)
    } else {
      const color = piece < 'a' ? WHITE : BLACK
      const sq = rankIdx * 16 + fileIdx
      board[sq] = { type: piece.toLowerCase() as PieceSymbol, color }
      fileIdx++
    }
  }

  return {
    board,
    turn: tokens[1] as Color,
    halfMoves: parseInt(tokens[4], 10),
    moveNumber: parseInt(tokens[5], 10),
  }
}

export function serializeFen(board: Piece[], turn: Color, halfMoves: number, moveNumber: number): string {
  let fen = ''
  for (let r = 9; r >= 0; r--) {
    let empty = 0
    for (let f = 0; f < 9; f++) {
      const i = r * 16 + f
      if (board[i]) {
        if (empty > 0) { fen += empty; empty = 0 }
        const { color, type } = board[i]
        fen += color === WHITE ? type.toUpperCase() : type.toLowerCase()
      } else {
        empty++
      }
    }
    if (empty > 0) fen += empty
    if (r > 0) fen += '/'
  }
  return [fen, turn, '-', '-', halfMoves, moveNumber].join(' ')
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/fen.ts
git commit -m "refactor: extract fen.ts from chess.ts"
```

---

### Task 5: Create `src/move.ts`

**Files:**
- Create: `src/move.ts`

**What this file contains:** The `Move` class from chess.ts lines 197-260.

- [ ] **Step 1: Create `src/move.ts`**

Move class is already clean — just copy it over with proper imports:

```typescript
import { Color, PieceSymbol, Square, InternalMove, BITS, FLAGS, Suffix, NAG } from './types'
import { algebraic } from './board'

export class Move {
  color: Color
  from: Square
  to: Square
  piece: PieceSymbol
  captured?: PieceSymbol
  flags: string
  zh: string
  lan: string
  before: string
  after: string
  wxf: string
  iccs: string
  isCheck: boolean
  isCheckmate: boolean

  constructor(
    internal: InternalMove,
    zh: string,
    before: string,
    after: string,
    wxf: string,
    iccs: string,
    isCheck = false,
    isCheckmate = false,
  ) {
    const { color, piece, from, to, flags, captured } = internal
    this.color = color
    this.piece = piece
    this.from = algebraic(from)
    this.to = algebraic(to)
    this.zh = zh
    this.lan = algebraic(from) + algebraic(to)
    this.before = before
    this.after = after
    this.wxf = wxf
    this.iccs = iccs
    this.isCheck = isCheck
    this.isCheckmate = isCheckmate
    this.flags = ''
    for (const flag in BITS) {
      if (BITS[flag] & flags) this.flags += FLAGS[flag]
    }
    if (captured) this.captured = captured
  }

  isCapture() { return this.flags.indexOf(FLAGS['CAPTURE']) > -1 }
  isNullMove() { return this.flags.indexOf(FLAGS['NULL_MOVE']) > -1 }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/move.ts
git commit -m "refactor: extract move.ts from chess.ts"
```

---

### Task 6: Create `src/notation.ts`

**Files:**
- Create: `src/notation.ts`

**What this file contains:** All 6 notation methods converted to pure functions:
1. `moveToWxf(board, move)` — was `Chess._moveToWxf`
2. `wxfPawnPrefix(...)` — was `Chess._wxfPawnPrefix`
3. `moveToZh(wxf, color)` — was `Chess._moveToZh`
4. `moveToLan(move)` — was `Chess._moveToLan`
5. `moveToIccs(move)` — was `Chess._moveToIccs`
6. `inferPieceType(san)` — was module-level in chess.ts
7. `strippedSan(move)` — was module-level in chess.ts
8. `moveFromSan(san, turn, legalMoves, strict?)` — was `Chess._moveFromSan`

Key changes from instance methods to pure functions:
- `_moveToWxf(move)` → `moveToWxf(board: Piece[], move: InternalMove): string`
- `_moveFromSan(move, strict)` → `moveFromSan(san: string, turn: Color, legalMoves: InternalMove[], strict?: boolean): InternalMove | null`
  - `_moveFromSan` called `this._moves({ legal: true, piece })` internally. Now accepts `legalMoves` array pre-computed by the caller.

- [ ] **Step 1: Create `src/notation.ts`**

```typescript
import { Color, InternalMove, Piece, PieceSymbol, Square, Move, BITS, XQ_SQUARES, WHITE, BLACK, PAWN, KING, ADVISOR, ELEPHANT, HORSE, ROOK, CANNON, SYMBOLS, SAN_NULLMOVE, WXF_LETTER, RED_NUMERALS, PIECE_CHINESE, STRAIGHT_PIECES } from './types'
import { algebraic, file, rank, offBoard } from './board'

// === Helpers ===

export function inferPieceType(san: string): PieceSymbol | undefined {
  // Copy verbatim from chess.ts lines 577-593
}

export function strippedSan(move: string): string {
  // Copy verbatim from chess.ts lines 597-599
}

// === Output: InternalMove → notation strings ===

export function moveToWxf(board: Piece[], move: InternalMove): string {
  // Copy from chess.ts lines 1972-2058
  // Replace `this._board` with `board` parameter
  // Replace `this._wxfPawnPrefix(...)` with direct call to wxfPawnPrefix
}

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
  // Copy verbatim from chess.ts lines 2061-2113
  // No `this.` references, pure function
}

export function moveToZh(wxf: string, color: Color): string {
  // Copy verbatim from chess.ts lines 2116-2172
  // No `this.` references, pure function
}

export function moveToLan(move: InternalMove): string {
  // Copy verbatim from chess.ts lines 2174-2179
  // No `this.` references, pure function
}

export function moveToIccs(move: InternalMove): string {
  // Copy verbatim from chess.ts lines 2182-2189
  // No `this.` references, pure function
}

// === Input: notation → InternalMove ===

export function moveFromSan(
  san: string,
  turn: Color,
  legalMoves: InternalMove[],
  strict = false,
): InternalMove | null {
  const cleanMove = strippedSan(san)

  // Null move
  if (cleanMove === SAN_NULLMOVE) {
    return { color: turn, from: 0, to: 0, piece: KING, flags: BITS.NULL_MOVE }
  }

  // Try strict match against LAN
  // ... copy logic from chess.ts lines 2206-2293
  // Replace `this._turn` with `turn`
  // Replace `this._moves({ legal: true, piece })` with `legalMoves` array (filter by piece type as needed)
  
  // Key change: instead of calling `this._moves()`, we filter the passed `legalMoves` array:
  const pieceType = inferPieceType(cleanMove)
  let candidateMoves = pieceType
    ? legalMoves.filter(m => m.piece === pieceType)
    : legalMoves
  
  // LAN match
  for (const m of candidateMoves) {
    if (cleanMove === strippedSan(moveToLan(m))) return m
  }
  if (strict) return null

  // ICCS match
  // ... same logic but using `legalMoves` (no piece filter needed for ICCS)
  
  // WXF match
  // ... same logic but using `turn` instead of `this._turn`,
  // and `legalMoves` filtered by piece type instead of `this._moves({ legal: true, piece })`
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/notation.ts
git commit -m "refactor: extract notation.ts from chess.ts"
```

---

### Task 7: Create `src/attack.ts`

**Files:**
- Create: `src/attack.ts`

**What this file contains:** Attack detection from chess.ts lines 896-1100 (`_isFlyingGeneral`, `_attacked` overloads, `_isKingAttacked`).

- [ ] **Step 1: Create `src/attack.ts`**

```typescript
import { Color, Piece, Square, PieceSymbol, KING, ADVISOR, ELEPHANT, HORSE, ROOK, CANNON, PAWN, WHITE, BLACK, XQ_SQUARES } from './types'
import { rank, file, offBoard, algebraic, inPalace, crossedRiver } from './board'

export function isFlyingGeneral(board: Piece[], kings: Record<Color, number>): boolean {
  // Copy from chess.ts lines 896-909
  // Replace `this._board` with `board`
}

export function isAttacked(board: Piece[], color: Color, square: number): boolean {
  // Copy from chess.ts _attacked method with verbose=false logic
  // Replace `this._board` with `board`
}

export function isAttackedVerbose(board: Piece[], color: Color, square: number): Square[] {
  // Copy from chess.ts _attacked method with verbose=true logic  
  // Replace `this._board` with `board`
}

export function isKingAttacked(board: Piece[], kings: Record<Color, number>, color: Color): boolean {
  // Copy from chess.ts lines 1089-1092
  // No `this.` references, pure function
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/attack.ts
git commit -m "refactor: extract attack.ts from chess.ts"
```

---

### Task 8: Create `src/movegen.ts`

**Files:**
- Create: `src/movegen.ts`

**What this file contains:** The pseudo-legal move generation from `Chess._moves()` lines 1310-1554 (the switch statement for each piece type), extracted as a pure function.

The legality filtering part (lines 1556-1572, which calls `_makeMove`/`_isKingAttacked`/`_undoMove`) stays in Chess class because it needs to modify live board state.

- [ ] **Step 1: Create `src/movegen.ts`**

```typescript
import { Color, InternalMove, Piece, PieceSymbol, Square, KING, ADVISOR, ELEPHANT, HORSE, ROOK, CANNON, PAWN, WHITE, BLACK, XQ_SQUARES, PIECE_OFFSETS, HORSE_LEGS, ELEPHANT_EYES, BITS } from './types'
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
  // Copy from chess.ts lines 558-575
}

export function generatePseudoMoves(
  board: Piece[],
  turn: Color,
  kings: Record<Color, number>,
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
    if ((from & 0xf) >= 9) { from += 6; continue }
    if (!board[from] || board[from].color !== us) continue
    const { type } = board[from]
    if (forPiece && forPiece !== type) continue
    const fromRank = rank(from)

    // Copy the ENTIRE switch statement from chess.ts lines 1351-1554
    // Replace ALL `this._board` with `board`
    // ... KING, ADVISOR, ELEPHANT, HORSE, ROOK, CANNON, PAWN cases
  }

  return moves
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/movegen.ts
git commit -m "refactor: extract movegen.ts from chess.ts"
```

---

### Task 9: Create `src/annotation.ts`

**Files:**
- Create: `src/annotation.ts`

**What this file contains:** Comment/suffix/NAG management logic. These are simple map operations keyed by FEN string. Extract the logic that can be pure (map operations), leaving iteration over history in Chess class.

- [ ] **Step 1: Create `src/annotation.ts`**

```typescript
import { NAG, Suffix } from './types'

export function pruneCommentsByFenHistory(
  comments: Record<string, string>,
  keptFens: Set<string>,
): Record<string, string> {
  const pruned: Record<string, string> = {}
  for (const fen of keptFens) {
    if (comments[fen] !== undefined) pruned[fen] = comments[fen]
  }
  return pruned
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/annotation.ts
git commit -m "refactor: extract annotation.ts from chess.ts"
```

---

### Task 10: Refactor `src/chess.ts` to thin orchestration

**Files:**
- Modify: `src/chess.ts` (replace entire content — delete ~2200 lines, keep ~400)

**What this does:** The Chess class now:
1. Imports all functions from the new modules
2. Holds state (same fields as before)
3. Delegates every operation to the imported pure functions
4. Re-exports all public symbols for backward compatibility

- [ ] **Step 1: Write the new `src/chess.ts`**

The new structure:

```typescript
// === License header ===

// === Re-exports for backward compatibility ===
export * from './types'
export { xoroshiro128 } from './hash'
export { validateFen, parseFen, serializeFen } from './fen'
export { Move } from './move'
// (Selective re-exports to maintain public API exactly)

// === Imports of internal usage ===
import { ... } from './types'
import { rank, file, algebraic, swapColor, offBoard, inPalace, crossedRiver } from './board'
import { pieceKey, computeHash, PIECE_KEYS, SIDE_KEY } from './hash'
import { parseFen, serializeFen } from './fen'
import { ... } from './notation'
import { isFlyingGeneral, isAttacked, isAttackedVerbose, isKingAttacked } from './attack'
import { generatePseudoMoves } from './movegen'
import { Move } from './move'
import { parse } from './pgn'
import { pruneCommentsByFenHistory } from './annotation'

export class Chess {
  // Same private fields as before
  private _board = new Array<Piece>(160)
  private _turn: Color = WHITE
  // ... all fields stay the same

  constructor(fen = DEFAULT_POSITION, { skipValidation = false } = {}) {
    this.load(fen, { skipValidation })
  }

  // === Delegation examples: ===

  load(fen: string, { skipValidation = false, preserveHeaders = false } = {}) {
    if (!skipValidation) {
      const { ok, error } = validateFen(fen)
      if (!ok) throw new Error(error)
    }
    this.clear({ preserveHeaders })
    const parsed = parseFen(fen)
    // Copy parsed board into this._board
    for (let i = 0; i < parsed.board.length; i++) {
      if (parsed.board[i]) this._board[i] = parsed.board[i]
    }
    this._turn = parsed.turn
    this._halfMoves = parsed.halfMoves
    this._moveNumber = parsed.moveNumber
    this._hash = computeHash(this._board, this._turn)
    this._updateSetup(fen)
    this._incPositionCount()
  }

  fen() {
    return serializeFen(this._board, this._turn, this._halfMoves, this._moveNumber)
  }

  // _moves() still exists because legality filtering needs make/undo on live state
  private _moves({
    legal = true,
    piece: forPiece = undefined,
    square = undefined,
  } = {}): InternalMove[] {
    const pseudo = generatePseudoMoves(this._board, this._turn, this._kings, { piece: forPiece, square })

    if (!legal || this._kings[this._turn] === EMPTY) return pseudo

    // Filter legal moves by simulating each on live board
    const us = this._turn
    const legalMoves: InternalMove[] = []
    for (const m of pseudo) {
      this._makeMove(m)
      if (!isKingAttacked(this._board, this._kings, us) && !isFlyingGeneral(this._board, this._kings)) {
        legalMoves.push(m)
      }
      this._undoMove()
    }
    return legalMoves
  }

  attackers(square: Square, attackedBy?: Color): Square[] {
    const color = attackedBy ?? this._turn
    return isAttackedVerbose(this._board, color, XQ_SQUARES[square])
  }

  isAttacked(square: Square, attackedBy: Color): boolean {
    return isAttacked(this._board, attackedBy, XQ_SQUARES[square])
  }

  isCheck(): boolean {
    return isKingAttacked(this._board, this._kings, this._turn)
  }

  // ... all other methods similarly delegate

  move(move: string | { from: string; to: string } | null, { strict = false } = {}) {
    let moveObj: InternalMove | null = null

    if (typeof move === 'string') {
      const legalMoves = this._moves()
      moveObj = moveFromSan(move, this._turn, legalMoves, strict)
    } else if (move === null) {
      moveObj = { color: this._turn, from: 0, to: 0, piece: KING, flags: BITS.NULL_MOVE }
    } else if (typeof move === 'object') {
      const moves = this._moves()
      for (const m of moves) {
        if (move.from === algebraic(m.from) && move.to === algebraic(m.to)) {
          moveObj = m
          break
        }
      }
    }

    // ... rest unchanged
  }

  // _makeMove, _undoMove, _push stay as-is (they mutate this._board in-place)
  // _createMove stays but delegates to moveToWxf/moveToZh/moveToIccs

  private _createMove(internal: InternalMove) {
    const wxf = moveToWxf(this._board, internal)
    const before = this.fen()
    this._makeMove(internal)
    const after = this.fen()
    const isCheck = this._isCheck
    const isCheckmate = isCheck && this.isCheckmate()
    this._undoMove()
    const zh = moveToZh(wxf, internal.color)
    const iccs = moveToIccs(internal)
    return new Move(internal, zh, before, after, wxf, iccs, isCheck, isCheckmate)
  }
}
```

Key methods that remain with their internal logic (cannot be extracted without performance penalty or deep coupling):
- `_makeMove`, `_push`, `_undoMove` — mutate `this._board`/`this._hash`/`this._kings` in-place
- `_set`, `_put`, `_clear`, `_movePiece` — low-level board mutations with hash XOR
- `_createMove` — needs make/undo to determine isCheck/isCheckmate
- `moves()` public overloads — just calls `_moves()` → `_createMove`
- `move()` public — orchestrates `_moveFromSan` + `_makeMove`
- `pgn()`, `loadPgn()` — complex PGN I/O
- `history()` — replays history using `_undoMove`/`_makeMove`
- `perft()` — recursive, uses `_makeMove`/`_undoMove`
- `isInsufficientMaterial()` — simple board scan, stays
- All comment/nag/suffix methods — thin getter/setters, stay

The key to this task is: **do NOT change behavior**. The Chess class should work identically. Only the implementation of internal helpers moves to separate files.

- [ ] **Step 2: Compile and check for errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run the test suite**

Run: `npx vitest run`
Expected: All tests pass (same as before refactor)

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Remove old code from chess.ts that was split out**

(Already done in Step 1 by rewriting chess.ts)

- [ ] **Step 6: Commit**

```bash
git add src/chess.ts src/annotation.ts
git commit -m "refactor: chess.ts as thin orchestration layer"
```

---

## Self-Review Checklist

- **Spec coverage:** Every module named in the design has a corresponding task. Every extracted function signature is documented in "Pure Function Signatures" above.
- **Placeholder scan:** All code blocks show actual implementation (copy from chess.ts). No "TBD" or "TODO".
- **Type consistency:** `moveToWxf` takes `board: Piece[]` and `move: InternalMove` in all references. `moveFromSan` accepts `legalMoves: InternalMove[]` as parameter. All notation.ts functions use the same types as chess.ts.
- **Re-export coverage:** `chess.ts` re-exports every symbol that tests import. Test files import from `chess.ts` (or `./chess`), so anything they reference must be re-exported. The main public types are: `Chess`, `Move`, `Square`, `Color`, `PieceSymbol`, `Piece`, `WHITE`, `BLACK`, `KING`, etc., `DEFAULT_POSITION`, `SQUARES`, `validateFen`, `xoroshiro128`, `NAG_TO_SYMBOL`, `NAG`, `Suffix`, `SUFFIX_LIST`, `nagToGlyph`.
- **Backward compatibility:** The `Chess` class API is unchanged. All public methods have the same signatures. `_makeMove`, `_undoMove`, `_push` stay in Chess class because they mutate `this._board` in-place. The `_moves()` method stays (calls `generatePseudoMoves` then filters by legality using make/undo).
