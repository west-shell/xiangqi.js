// 回归测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('regression - 开局走子不报错', () => {
  const chess = new Chess()
  chess.move('h0g2') // 红马 h0→g2
  chess.move('h9g7') // 黑马 h9→g7
  chess.move('b2e2') // 红炮 b2→e2
  expect(chess.fen()).toBeTruthy()
})

test('regression - 将军局面有合法应着', () => {
  // 红车在 e7 将军黑将
  const chess = new Chess(
    'rnbakabnr/9/1c2R2c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  const moves = chess.moves()
  expect(moves.length).toBeGreaterThan(0)
})
