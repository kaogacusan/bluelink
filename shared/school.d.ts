export const SCHOOL: { name: string; short: string; people: string; domains: string[]; example: string }
export type SignupRole = { id: 'student' | 'alum' | 'faculty'; label: string; title: string; domains: string[]; hint: string }
export const SIGNUP_ROLES: SignupRole[]
export function signupRole(id: string): SignupRole | null
export function canSignUp(email: string, roleId?: string): boolean
