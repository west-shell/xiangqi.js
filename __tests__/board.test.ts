// 棋盘数组测试
import { Chess } from '../src/chess'
import { describe, expect, it } from 'vitest'

describe('棋盘数组', () => {
  it('初始局面返回 10 行 9 列', () => {
    const chess = new Chess()
    const board = chess.board()

    // 10 行
    expect(board.length).toBe(10)
    // 每行 9 列
    board.forEach((row) => expect(row.length).toBe(9))
  })

  it('初始局面的棋子位置正确', () => {
    const chess = new Chess()
    const board = chess.board()

    // 第 0 行（红方底线 rank 0）
    expect(board[9][0]).toEqual({ square: 'a0', type: 'r', color: 'w' })
    expect(board[9][4]).toEqual({ square: 'e0', type: 'k', color: 'w' })

    // 第 9 行（黑方底线 rank 9）
    expect(board[0][0]).toEqual({ square: 'a9', type: 'r', color: 'b' })
    expect(board[0][4]).toEqual({ square: 'e9', type: 'k', color: 'b' })

    // 空行（第 4 行，河界）
    expect(board[4].every((sq) => sq === null)).toBe(true)
  })

  it('移动后棋盘更新', () => {
    const chess = new Chess()
    chess.move('b0c2')
    const board = chess.board()

    // b0 应该是空了
    expect(board[9][1]).toBeNull()
    // c2 应该有马
    expect(board[7][2]).toEqual({ square: 'c2', type: 'n', color: 'w' })
  })
})
