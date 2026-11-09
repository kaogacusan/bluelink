// One place to change the prices and how long a membership lasts.
// A lifetime membership is stored as a date far in the future, so every "until" check still works.
export const LIFETIME_UNTIL = Date.UTC(9999, 0, 1)

export const PLANS = [
  { id: 'year', price: 99, name: '1 year', days: 365 },
  { id: 'life', price: 250, name: 'Lifetime', days: null },
]

export const MEMBERSHIP = {
  plans: PLANS,
  codeDays: 365, // 1-year voucher cards and founding member codes give one year. Lifetime voucher cards give lifetime.
}

export const planById = (id) => PLANS.find((p) => p.id === id) || PLANS[0]
export const isLifetime = (until) => (until || 0) >= LIFETIME_UNTIL
