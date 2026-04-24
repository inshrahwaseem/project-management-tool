import { describe, it, expect } from 'vitest'

describe('Utility functions', () => {
  it('formats currency correctly', () => {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('truncates long strings', () => {
    const truncate = (str: string, max: number) =>
      str.length > max ? str.slice(0, max) + '...' : str
    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Hi', 5)).toBe('Hi')
  })

  it('returns initials from full name', () => {
    const getInitials = (name: string) =>
      name.split(' ').map(n => n[0]).join('').toUpperCase()
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Alice Bob Carol')).toBe('ABC')
  })
})
