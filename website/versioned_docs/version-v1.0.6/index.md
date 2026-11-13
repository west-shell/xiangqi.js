# xiangqi.js

[![npm](https://img.shields.io/npm/v/@weshell/xiangqi.js?color=blue)](https://www.npmjs.com/package/@weshell/xiangqi.js)
[![npm](https://img.shields.io/npm/dm/@weshell/xiangqi.js)](https://www.npmjs.com/package/@weshell/xiangqi.js)

xiangqi.js 是一个 TypeScript 中国象棋（Xiangqi）库，提供着法生成/验证、棋子布署/移动、将军/将杀检测等功能——基本不包含 AI。

已充分测试 Node.js 环境。

## 安装

```sh
npm install @weshell/xiangqi.js
```

## 引入

### ESM

```js
import { Chess } from '@weshell/xiangqi.js'
```

### CommonJS

```js
const { Chess } = require('@weshell/xiangqi.js')
```

## 快速上手

```ts
import { Chess } from '@weshell/xiangqi.js'

const chess = new Chess()

// 走一步棋（支持 LAN、ICCS、WXF 记谱）
chess.move('b0c2') // LAN 格式
chess.move('B0-C2') // ICCS 格式
chess.move('C2.5') // WXF 格式

// 获取中文记谱
const moves = chess.moves({ chinese: true })
console.log(moves[0]) // "炮二平五"

// 查看棋盘
console.log(chess.ascii())
console.log(chess.fen())
```

## 记谱系统

| 格式 | 示例       | 说明                                                       |
| ---- | ---------- | ---------------------------------------------------------- |
| LAN  | `b0c2`     | 起止格子直连，小写字母                                     |
| ICCS | `B0-C2`    | Internet Chinese Chess Server 记谱                         |
| WXF  | `C2.5`     | 世界象棋联合会记谱（炮二平五）                             |
| 中文 | `炮二平五` | 中文传统记谱（只读，通过 `moves({ chinese: true })` 生成） |

## 主要功能

- **棋局管理** — FEN 加载/导出、PGN 读写、悔棋
- **着法生成**
  — 所有棋子的合法着法生成，含蹩马腿、塞象眼、将帅对面等中国象棋规则
- **状态检测** — 将军、将杀、困毙、长将、三次重复、五十步规则
- **记谱系统** — WXF、ICCS、LAN、中文记谱
- **注释系统** — NAG 数字注解符号、后缀注解（`!`、`?`、`!?` 等）、棋评

## FEN 校验

`validateFen()` 对 FEN 字符串做独立校验，返回结构化结果：

```ts
import { validateFen } from '@weshell/xiangqi.js'

validateFen(
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
)
// { ok: true }

validateFen('4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1')
// { ok: false, error: 'Invalid FEN: kings are facing each other (flying general)' }
```

支持 1~6 个字段的 FEN（可省略走子方之后的字段），并容忍首尾空白。校验内容包括：10 行 ×
9 列棋盘结构、棋子字符合法性、每方恰好一将、士/象位置限制、将帅对脸（白脸将）等。

## API

```ts
class Chess {
  constructor(fen?: string, options?: { skipValidation?: boolean })

  // 棋局管理
  load(fen: string, options?: { skipValidation?; preserveHeaders? }): void
  fen(): string
  reset(): void
  clear(options?: { preserveHeaders? }): void
  setTurn(color: Color): boolean
  moveNumber(): number

  // 棋子操作
  get(square: Square): Piece | undefined
  put(piece: { type: PieceSymbol; color: Color }, square: Square): boolean
  remove(square: Square): Piece | undefined
  findPiece(piece: Piece): Square[]

  // 着法
  move(
    move: string | { from: string; to: string } | null,
    options?: { strict? },
  ): Move
  moves(options?: { verbose?; chinese?; square?; piece? }): string[] | Move[]
  undo(): Move | null

  // 状态查询
  isCheck(): boolean
  isCheckmate(): boolean
  isStalemate(): boolean
  isGameOver(): boolean
  isDraw(): boolean
  isThreefoldRepetition(): boolean
  isDrawByFiftyMoves(): boolean
  isInsufficientMaterial(): boolean

  // 棋盘
  board(): ({ square: Square; type: PieceSymbol; color: Color } | null)[][]
  ascii(): string
  squareColor(square: Square): 'light' | 'dark' | null

  // 记谱支持
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

  // 注释
  getComment(): string
  setComment(comment: string): void
  deleteComment(): string
  getComments(): { fen: string; comment?; suffixAnnotation?; nags: NAG[] }[]
  setNags(nags: NAG[], fen?: string): void
  getNags(fen?: string): NAG[]
  addNag(nag: NAG, fen?: string): void
  removeNag(nag: NAG, fen?: string): boolean
  setSuffixAnnotation(suffix: Suffix, fen?: string): void

  // 性能测试
  perft(depth: number): number
}

function validateFen(fen: string): { ok: boolean; error?: string }
function nagToGlyph(nag: NAG): string | undefined
function xoroshiro128(state: bigint): () => bigint
```

### 类型与常量

```ts
type Color = 'w' | 'b'                       // w = 红方，b = 黑方
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'c' | 'k' | 'a'
// p 兵/卒、n 马、b 相/象、r 车、c 炮、k 帅/将、a 仕/士
type Square = 'a0' | ... | 'i9'              // 9 列（a-i）× 10 行（0-9），红方在 0-4 行
type Piece = { color: Color; type: PieceSymbol }
type NAG = number
type Suffix = '!' | '?' | '!!' | '!?' | '?!' | '??'

const DEFAULT_POSITION: string               // 初始局面 FEN
const SQUARES: Square[]
const SEVEN_TAG_ROSTER: Record<string, string>
const NAG_TO_SYMBOL: Record<number, string>
const SUFFIX_LIST: readonly Suffix[]
```

### Move 对象

`move()` 与 `moves({ verbose: true })` 返回 `Move` 实例：

```ts
class Move {
  color: Color // 走子方
  piece: PieceSymbol // 棋子类型
  from: Square // 起点
  to: Square // 终点
  captured?: PieceSymbol // 被吃的棋子（若有）
  flags: string
  lan: string // LAN 记谱，如 'b0c2'
  iccs: string // ICCS 记谱，如 'B0-C2'
  wxf: string // WXF 记谱，如 'C2.5'
  zh: string // 中文记谱，如 '炮二平五'
  before: string // 走子前 FEN
  after: string // 走子后 FEN
  isCheck: boolean
  isCheckmate: boolean
  isCapture(): boolean
  isNullMove(): boolean
}
```

## 许可

BSD-2-Clause
