// One place to change the prices and how long a membership lasts.
// A lifetime membership is stored as a date far in the future, so every "until" check still works.
export const LIFETIME_UNTIL = Date.UTC(9999, 0, 1)

export const PLANS = [
  { id: 'year', price: 99, name: '1 year', days: 365 },
  { id: 'life', price: 250, name: 'Lifetime', days: null },
]

// Alumni and faculty join free for now, so the network grows faster.
export const FREE_ROLES = ['alum', 'faculty']

// Early access: anyone who signs up before this time gets in free, no code needed.
// November 10, 2026 only. It ends at midnight Philippine time (UTC+8).
export const EARLY_ACCESS_UNTIL = Date.UTC(2026, 10, 10, 16)
export const earlyAccessOpen = (now = Date.now()) => now < EARLY_ACCESS_UNTIL

export const MEMBERSHIP = {
  plans: PLANS,
  codeDays: 365, // 1-year voucher cards and founding member codes give one year. Lifetime voucher cards give lifetime.
}

export const planById = (id) => PLANS.find((p) => p.id === id) || PLANS[0]
export const isLifetime = (until) => (until || 0) >= LIFETIME_UNTIL
