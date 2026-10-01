import { describe, expect, it } from 'vitest'
import { getLocalDateString, getLocalYearMonthString } from './date'

describe('date utils', () => {
  it('getLocalDateString formata corretamente no fuso local', () => {
    // Usamos uma data fixa 2026-10-01 10:00:00 (hora local para não ter erro de fuso)
    const d = new Date(2026, 9, 1, 10, 0, 0)
    expect(getLocalDateString(d)).toBe('2026-10-01')
  })

  it('getLocalYearMonthString formata corretamente no fuso local', () => {
    const d = new Date(2026, 9, 1, 10, 0, 0)
    expect(getLocalYearMonthString(d)).toBe('2026-10')
  })
})
