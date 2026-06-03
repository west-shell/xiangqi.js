// FEN 序列化和反序列化测试
import { Chess } from '../src/chess'
import { describe, expect, it, test } from 'vitest'

describe('load() / fen() 对称性测试', () => {
  const validPositions = [
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
    '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1',
    '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1',
  ]

  const chess = new Chess()

  validPositions.forEach((fen) => {
    it('fen 对称性 - ' + fen.substring(0, 20) + '...', () => {
      expect(() => chess.load(fen)).not.toThrow()
      expect(chess.fen()).toEqual(fen)
    })
  })
})

test('fen - 走一步后 FEN 正确更新', () => {
  const chess = new Chess()
  chess.move('b0c2')
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1CN4C1/9/R1BAKABNR b - - 1 1',
  )
})
