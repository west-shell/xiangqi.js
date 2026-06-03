// FEN 验证测试（中国象棋）
import { validateFen } from '../src/chess'
import { expect, test } from 'vitest'

test.each([
  // 无效 FEN
  { fen: '9/9/9/9/9/9/9/9/9/9 w - - 0 1', ok: false }, // 无将
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: true,
  }, // 有效 - 初始局面
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: true,
  },
  { fen: '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1', ok: true }, // 仅剩双将
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: true,
  },
  // 缺少字段
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0',
    ok: false,
  },
  // 走子方无效
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR x - - 0 1',
    ok: false,
  },
  // 行数不对
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9 w - - 0 1',
    ok: false,
  },
  // 无效棋子字符
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKqEHR w - - 0 1',
    ok: false,
  },
  // 底行有兵（中国象棋允许兵卒到达对方底线）
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/PHEAKABNR w - - 0 1',
    ok: true,
  },
  // 连续数字
  {
    fen: 'rnbakabnr/91/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: false,
  },
  // 行字段数不对（超过 9 格）
  {
    fen: 'rnbakabnr/10/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: false,
  },
  // 缺少黑将
  {
    fen: 'rheaaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
    ok: false,
  },
  // e.p. 字段不为 '-'
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - e3 0 1',
    ok: false,
  },
  // 易位字段不为 '-'
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w KQkq - 0 1',
    ok: false,
  },
  // 回合计数值无效
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - -1 1',
    ok: false,
  },
  // 半步计数器无效
  {
    fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 0',
    ok: false,
  },
])('validateFen - $fen', ({ fen, ok }) => {
  expect(validateFen(fen).ok).toBe(ok)
})
