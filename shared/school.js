// One place to change which school BlueLink is for.
export const SCHOOL = {
  name: 'Ateneo de Manila',
  short: 'Ateneo',
  people: 'Ateneans',
  domains: ['student.ateneo.edu', 'obf.ateneo.edu', 'ateneo.edu'],
  example: 'you@student.ateneo.edu',
}

// Who can sign up, and with which email. Alumni may not have their school email anymore, so any email works.
export const SIGNUP_ROLES = [
  { id: 'student', label: 'Student', title: 'Sign up as a student', domains: ['student.ateneo.edu'], hint: 'Use your Ateneo student email. It ends in @student.ateneo.edu.' },
  { id: 'alum', label: 'Alumni', title: 'Sign up as alumni', domains: [], hint: 'Type your full email, like juan@gmail.com.' },
  { id: 'faculty', label: 'Professor', title: 'Sign up as a professor', domains: ['ateneo.edu'], hint: 'Use your Ateneo email. It ends in @ateneo.edu.' },
]

export const signupRole = (id) => SIGNUP_ROLES.find((r) => r.id === id) || null

// With no role (an old page still open), any school email works, like before.
export function canSignUp(email, roleId) {
  const value = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false
  const domain = value.split('@')[1]
  const role = signupRole(roleId)
  if (!role) return SCHOOL.domains.includes(domain)
  return !role.domains.length || role.domains.includes(domain)
}
