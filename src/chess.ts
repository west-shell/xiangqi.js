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
import { Move } from './move'

import {
  WHITE,
  BLACK,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  ROOK,
  CANNON,
  PAWN,
  Color,
  PieceSymbol,
  Square,
  Piece,
  InternalMove,
  History,
  EMPTY,
  BITS,
  XQ_SQUARES,
  SYMBOLS,
  SAN_NULLMOVE,
  DEFAULT_POSITION,
  HEADER_TEMPLATE,
  SEVEN_TAG_ROSTER,
  SUFFIX_LIST,
  Suffix,
  NAG,
} from './types'

import { rank, file, algebraic, swapColor } from './board'
import { pieceKey, computeHash, SIDE_KEY } from './hash'
import { validateFen, parseFen, serializeFen } from './fen'
import {
  moveToWxf,
  moveToZh,
  moveToLan,
  moveToIccs,
  moveFromSan,
} from './notation'
import {
  isFlyingGeneral,
  isAttacked,
  isAttackedVerbose,
  isKingAttacked,
} from './attack'
import { generatePseudoMoves } from './movegen'

// === Re-exports for backward compatibility ===

export {
  WHITE,
  BLACK,
  KING,
  ADVISOR,
  ELEPHANT,
  HORSE,
  ROOK,
  CANNON,
  PAWN,
  Color,
  PieceSymbol,
  Square,
  Piece,
  SUFFIX_LIST,
  Suffix,
  NAG,
  NAG_TO_SYMBOL,
  nagToGlyph,
  DEFAULT_POSITION,
  SQUARES,
  SEVEN_TAG_ROSTER,
} from './types'

export { xoroshiro128 } from './hash'
export { validateFen } from './fen'
export { Move } from './move'

/* === Chess class === */

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
  private _isCheck = false
  private _isCheckmate = false

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
    this._hash = computeHash(this._board, this._turn)
    this._positionCount = new Map<bigint, number>()

    this._header['SetUp'] = null
    this._header['FEN'] = null
  }

  load(fen: string, { skipValidation = false, preserveHeaders = false } = {}) {
    let tokens = fen.split(/\s+/)

    // append commonly omitted fen tokens
    if (tokens.length >= 1 && tokens.length < 6) {
      const adjustments = ['w', '-', '-', '0', '1']
      fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(' ')
    }

    tokens = fen.split(/\s+/)

    if (!skipValidation) {
      const { ok, error } = validateFen(fen)
      if (!ok) {
        throw new Error(error)
      }
    }

    const parsed = parseFen(fen)
    this.clear({ preserveHeaders })
    this._board = parsed.board

    // Detect kings from parsed board
    for (let i = XQ_SQUARES.a0; i <= XQ_SQUARES.i9; i++) {
      if ((i & 0xf) >= 9) {
        i += 6
        continue
      }
      if (this._board[i] && this._board[i].type === KING) {
        this._kings[this._board[i].color] = i
      }
    }

    this._turn = parsed.turn
    this._halfMoves = parsed.halfMoves
    this._moveNumber = parsed.moveNumber
    this._hash = computeHash(this._board, this._turn)
    this._updateSetup(fen)
    this._incPositionCount()
  }

  fen() {
    return serializeFen(
      this._board,
      this._turn,
      this._halfMoves,
      this._moveNumber,
    )
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
    this._hash ^= pieceKey(this._board, sq)
    this._board[sq] = piece
    this._hash ^= pieceKey(this._board, sq)
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
    this._hash ^= pieceKey(this._board, sq)
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

  attackers(square: Square, attackedBy?: Color): Square[] {
    const color = attackedBy ?? this._turn
    return isAttackedVerbose(this._board, color, XQ_SQUARES[square])
  }

  hash(): string {
    return this._hash.toString(16)
  }

  isAttacked(square: Square, attackedBy: Color): boolean {
    return isAttacked(this._board, attackedBy, XQ_SQUARES[square])
  }

  isCheck(): boolean {
    return isKingAttacked(this._board, this._kings, this._turn)
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
    const wxf = moveToWxf(this._board, internal)
    const before = this.fen()

    this._makeMove(internal)
    const after = this.fen()
    const isCheck = this._isCheck
    const isCheckmate = isCheck && this.isCheckmate()
    this._undoMove()

    const zh = moveToZh(wxf, internal.color)
    const iccs = moveToIccs(internal)

    return new Move(
      internal,
      zh,
      before,
      after,
      wxf,
      iccs,
      isCheck,
      isCheckmate,
    )
  }

  moves(): string[]
  moves({ square }: { square: Square }): string[]
  moves({ piece }: { piece: PieceSymbol }): string[]

  moves({ square, piece }: { square: Square; piece: PieceSymbol }): string[]

  moves({ chinese, square }: { chinese: true; square?: Square }): string[]
  moves({ chinese, square }: { chinese?: boolean; square?: Square }): string[]

  moves({ chinese, piece }: { chinese: true; piece?: PieceSymbol }): string[]
  moves({
    chinese,
    piece,
  }: {
    chinese?: boolean
    piece?: PieceSymbol
  }): string[]

  moves({
    chinese,
    square,
    piece,
  }: {
    chinese: true
    square?: Square
    piece?: PieceSymbol
  }): string[]
  moves({
    chinese,
    square,
    piece,
  }: {
    chinese?: boolean
    square?: Square
    piece?: PieceSymbol
  }): string[]

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
    chinese = false,
    square = undefined,
    piece = undefined,
  }: {
    verbose?: boolean
    chinese?: boolean
    square?: Square
    piece?: PieceSymbol
  } = {}) {
    const moves = this._moves({ square, piece })

    if (verbose) {
      return moves.map((move) => this._createMove(move))
    }

    const toZh = chinese
      ? (move: InternalMove) =>
          moveToZh(moveToWxf(this._board, move), move.color)
      : (move: InternalMove) => moveToLan(move)
    return moves.map(toZh)
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
    const pseudo = generatePseudoMoves(this._board, this._turn, this._kings, {
      piece: forPiece,
      square,
    })

    if (!legal || this._kings[this._turn] === EMPTY) return pseudo

    const us = this._turn
    const legalMoves: InternalMove[] = []
    for (const m of pseudo) {
      this._makeMove(m)
      if (
        !isKingAttacked(this._board, this._kings, us) &&
        !isFlyingGeneral(this._board, this._kings)
      ) {
        legalMoves.push(m)
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
      moveObj = moveFromSan(move, this._turn, this._moves(), strict)
    } else if (move === null) {
      moveObj = moveFromSan(SAN_NULLMOVE, this._turn, this._moves(), strict)
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
    this._hash ^= pieceKey(this._board, from)

    this._board[to] = this._board[from]
    delete this._board[from]

    this._hash ^= pieceKey(this._board, to)
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
      this._hash ^= pieceKey(this._board, move.to)
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
    this._isCheck = isKingAttacked(this._board, this._kings, them)
    this._isCheckmate = false
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

    this._isCheck = isKingAttacked(this._board, this._kings, this._turn)
    this._isCheckmate = false
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

      moveString = moveString + ' ' + moveToLan(move)
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

        const move = moveFromSan(node.move, this._turn, this._moves(), strict)
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
    const moves = generatePseudoMoves(this._board, this._turn, this._kings)
    let nodes = 0
    const color = this._turn

    for (let i = 0; i < moves.length; i++) {
      this._makeMove(moves[i])
      if (
        !isKingAttacked(this._board, this._kings, color) &&
        !isFlyingGeneral(this._board, this._kings)
      ) {
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
        moveHistory.push(moveToLan(move))
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
