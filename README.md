![logo](./chessjslogo.svg)

# xiangqi.js

[![npm](https://img.shields.io/npm/v/xiangqi.js?color=blue)](https://www.npmjs.com/package/xiangqi.js)
[![npm](https://img.shields.io/npm/dm/xiangqi.js)](https://www.npmjs.com/package/xiangqi.js)

xiangqi.js 是一个 TypeScript 中国象棋（Xiangqi）库，提供着法生成/验证、棋子布署/移动、将军/将杀检测等功能——基本不包含 AI。

已充分测试 Node.js 环境。

## 安装

```sh
npm install xiangqi.js
```

## 示例

```ts
import { Chess } from 'xiangqi.js'

const chess = new Chess()

// 走一步棋（支持 LAN、ICCS、WXF 记谱）
chess.move('b0c2')    // LAN 格式
chess.move('B0-C2')   // ICCS 格式
chess.move('C2.5')    // WXF 格式

// 获取中文记谱
const moves = chess.moves({ Chinese: true })
console.log(moves[0]) // "炮二平五"

// 查看棋盘
console.log(chess.ascii())
console.log(chess.fen())
```

## 项目结构

```
src/
├── types.ts        — 类型定义与常量
├── board.ts        — 棋盘坐标工具
├── hash.ts         — Zobrist 哈希
├── fen.ts          — FEN 校验/解析/序列化
├── move.ts         — Move 类
├── notation.ts     — 记谱系统（WXF/中文/LAN/ICCS）
├── attack.ts       — 攻击检测
├── movegen.ts      — 伪合法着法生成
├── annotation.ts   — 注释/NAG/后缀
├── chess.ts        — Chess 类（编排层，对外入口）
├── pgn.peggy       — PGN 语法定义
├── pgn.js          — PGN 解析器（生成代码）
└── node.ts         — 节点类型
```

## 主要功能

- **棋局管理** — FEN 加载/导出、PGN 读写、悔棋
- **着法生成** — 所有棋子的合法着法生成，含蹩马腿、塞象眼、将帅对面等中国象棋规则
- **记谱系统** — 支持 WXF（`C2.5`）、ICCS（`B0-C2`）、LAN（`b0c2`）、中文记谱（`炮二平五`）
- **状态检测** — 将军、将杀、困毙、长将、三次重复、五十步规则
- **注释系统** — NAG 数字注解符号、后缀注解、棋评
- **性能测试** — Perft 性能测试

## API

```ts
class Chess {
  constructor(fen?: string, options?: { skipValidation?: boolean })
  
  // 棋局管理
  load(fen: string, options?: { skipValidation?, preserveHeaders? }): void
  fen(): string
  reset(): void
  clear(options?: { preserveHeaders? }): void
  
  // 棋子操作
  get(square: Square): Piece | undefined
  put(piece: { type: PieceSymbol; color: Color }, square: Square): boolean
  remove(square: Square): Piece | undefined
  
  // 着法
  move(move: string | { from: string; to: string } | null, options?: { strict? }): Move
  moves(options?: { verbose?, Chinese?, square?, piece? }): string[] | Move[]
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
  findPiece(piece: Piece): Square[]
  
  // PGN
  pgn(options?: { newline?, maxWidth? }): string
  loadPgn(pgn: string, options?: { strict?, newlineChar? }): void
  header(...args: string[]): Record<string, string | null>
  
  // 注释
  getComment(): string
  setComment(comment: string): void
  getComments(): { fen: string; comment?, suffixAnnotation?, nags: NAG[] }[]
  // ... NAG/Suffix 操作
}
```

## 许可

BSD-2-Clause
