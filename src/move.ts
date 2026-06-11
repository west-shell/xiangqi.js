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

import { Color, PieceSymbol, Square, InternalMove, BITS, FLAGS } from './types'
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
