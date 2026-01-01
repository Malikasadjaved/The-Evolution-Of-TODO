import { formatRelativeTime, getUrgencyBorderColor } from '../../lib/utils/formatRelativeTime'

describe('formatRelativeTime Utility', () => {
  // Mock 'now' to be 2026-01-01
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-01T12:00:00Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('formats overdue dates correctly', () => {
    const result = formatRelativeTime('2025-12-31')
    expect(result.label).toBe('Overdue by 1 day')
    expect(result.urgency).toBe('overdue')
    expect(result.isCritical).toBe(false)
  })

  it('formats critically overdue dates (>3 days)', () => {
    const result = formatRelativeTime('2025-12-25')
    expect(result.label).toBe('Overdue by 7 days 🔥')
    expect(result.urgency).toBe('overdue')
    expect(result.isCritical).toBe(true)
  })

  it('formats due today correctly', () => {
    const result = formatRelativeTime('2026-01-01')
    expect(result.label).toBe('Due today')
    expect(result.urgency).toBe('today')
  })

  it('formats due tomorrow correctly', () => {
    const result = formatRelativeTime('2026-01-02')
    expect(result.label).toBe('Due tomorrow')
    expect(result.urgency).toBe('tomorrow')
  })

  it('formats soon dates (within a week)', () => {
    const result = formatRelativeTime('2026-01-05')
    expect(result.label).toBe('Due in 4 days')
    expect(result.urgency).toBe('soon')
  })

  it('formats later dates (1 week)', () => {
    const result = formatRelativeTime('2026-01-08')
    expect(result.label).toBe('Due in 1 week')
    expect(result.urgency).toBe('soon')
  })

  it('formats later dates (multiple weeks)', () => {
    const result = formatRelativeTime('2026-01-20')
    expect(result.label).toBe('Due in 2 weeks')
  })

  it('formats distant future (1 month)', () => {
    const result = formatRelativeTime('2026-02-15')
    expect(result.label).toBe('Due in 1 month')
  })
})

describe('getUrgencyBorderColor Utility', () => {
  it('returns correct border for overdue', () => {
    expect(getUrgencyBorderColor('overdue')).toBe('border-l-red-500')
  })
  it('returns correct border for today', () => {
    expect(getUrgencyBorderColor('today')).toBe('border-l-amber-400')
  })
  it('returns transparent for others', () => {
    expect(getUrgencyBorderColor('soon')).toBe('border-l-transparent')
  })
})
