// One place to change which school blueLink is for.
export const SCHOOL = {
  name: 'Ateneo de Manila',
  short: 'Ateneo',
  people: 'Ateneans',
  domains: ['student.ateneo.edu', 'obf.ateneo.edu', 'ateneo.edu'],
  example: 'you@student.ateneo.edu',
}

export function isSchoolEmail(email) {
  const value = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+$/.test(value)) return false
  const domain = value.split('@')[1]
  return SCHOOL.domains.includes(domain)
}
