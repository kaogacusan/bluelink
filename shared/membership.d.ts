export type Plan = { id: 'year' | 'life'; price: number; name: string; days: number | null }
export const LIFETIME_UNTIL: number
export const PLANS: Plan[]
export const MEMBERSHIP: { plans: Plan[]; codeDays: number }
export function planById(id: string): Plan
export function isLifetime(until: number): boolean
