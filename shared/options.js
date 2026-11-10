// Lists shared by the app and the server. The server only accepts these ids.

// "Open to" is the heart of BlueLink: it tells people it is OK to reach out.
// Each label says on its own if the person wants something or gives it.
// "match" is the tag on the other side, so a want meets a give.
export const OPEN_TO = [
  { id: 'seek-intern', label: 'Seeking internship', match: ['hire-intern'] },
  { id: 'seek-job', label: 'Seeking job', match: ['hire-job'] },
  { id: 'seek-mentor', label: 'Seeking mentor', match: ['advice'] },
  { id: 'hire-intern', label: 'Hiring interns', match: ['seek-intern'] },
  { id: 'hire-job', label: 'Hiring for jobs', match: ['seek-job'] },
  { id: 'advice', label: 'Giving advice', match: ['seek-mentor'] },
]

export const SCHOOLS = [
  { id: 'soh', short: 'SOH', name: 'School of Humanities' },
  { id: 'soss', short: 'SOSS', name: 'School of Social Sciences' },
  { id: 'sose', short: 'SOSE', name: 'School of Science and Engineering' },
  { id: 'jgsom', short: 'JGSOM', name: 'John Gokongwei School of Management' },
  { id: 'gbseald', short: 'GBSEALD', name: 'Gokongwei Brothers School of Education and Learning Design' },
  { id: 'other', short: 'Other', name: 'Other unit or school' },
]

// Ateneo undergraduate degree programs, from the Ateneo College Viewbook 2026-2027, by school.
// One entry per course: honors and double-degree tracks go under their main course.
// The course box suggests these, but people can still type their own (grad school, older programs).
const COURSES_BY_SCHOOL = {
  soh: [
    'AB Humanities',
    'AB Interdisciplinary Studies',
    'AB Literature (English)',
    'AB Philosophy',
    'BFA Art Management',
    'BFA Creative Writing',
    'BFA Information Design',
    'BFA Theater Arts',
  ],
  soss: [
    'AB Chinese Studies',
    'AB Communication',
    'AB Development Studies',
    'AB Diplomacy and International Relations',
    'AB Economics',
    'AB European Studies',
    'AB History',
    'AB Management Economics',
    'AB Political Science',
    'AB Psychology',
    'AB Social Sciences',
    'AB Sociology',
    'BS Psychology',
  ],
  sose: [
    'BS Applied Mathematics',
    'BS Applied Physics',
    'BS Biology',
    'BS Chemistry',
    'BS Computer Engineering',
    'BS Computer Science',
    'BS Electronics Engineering',
    'BS Environmental Science',
    'BS Health Sciences',
    'BS Innovation Design Engineering',
    'BS Life Sciences',
    'BS Management Information Systems',
    'BS Management of Applied Chemistry',
    'BS Mathematics',
    'BS Physics',
  ],
  jgsom: [
    'BS Communications Technology Management',
    'BS Information Technology Entrepreneurship',
    'BS Legal Management',
    'BS Management',
    'BS Management Engineering',
    'BS Restaurant Entrepreneurship',
  ],
  gbseald: ['BS Learning Science and Design'],
}

export const COURSES = Object.values(COURSES_BY_SCHOOL)
  .flat()
  .sort((a, b) => a.localeCompare(b))

// The school comes from the course, so nobody has to pick it. Unknown courses give ''.
export function schoolOf(course) {
  const c = String(course || '').trim().toLowerCase()
  return Object.keys(COURSES_BY_SCHOOL).find((id) => COURSES_BY_SCHOOL[id].some((x) => x.toLowerCase() === c)) || ''
}

// Where a student is now. Grad school counts. People who finished pick "alumni" and a batch year instead.
export const LEVELS = [
  { id: '1', label: '1st year', group: 'College' },
  { id: '2', label: '2nd year', group: 'College' },
  { id: '3', label: '3rd year', group: 'College' },
  { id: '4', label: '4th year', group: 'College' },
  { id: '5', label: '5th year', group: 'College' },
  { id: 'masters', label: "Master's", group: 'Grad school' },
  { id: 'phd', label: 'PhD', group: 'Grad school' },
]

export const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'alum', label: 'Alumni' },
  // Faculty is off for now. Remove the // to turn it back on.
  // { id: 'faculty', label: 'Faculty or staff' },
]

export const KINDS = [
  { id: 'post', label: 'Post', verb: 'posted' },
  { id: 'work', label: 'Open for work', verb: 'is open for work' },
  { id: 'opp', label: 'Opportunity', verb: 'shared an opportunity' },
  { id: 'event', label: 'Event', verb: 'is hosting an event' },
]

export const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'spam', label: 'Spam or selling' },
  { id: 'fake', label: 'Fake profile' },
  { id: 'scam', label: 'Scam or unsafe offer' },
  { id: 'other', label: 'Something else' },
]

export const ORG_CATEGORIES = [
  { id: 'academic', label: 'Academic' },
  { id: 'tech', label: 'Tech' },
  { id: 'business', label: 'Business' },
  { id: 'arts', label: 'Arts and culture' },
  { id: 'media', label: 'Media' },
  { id: 'service', label: 'Faith and service' },
  { id: 'advocacy', label: 'Advocacy' },
  { id: 'sports', label: 'Sports' },
  { id: 'gov', label: 'Student government' },
  { id: 'other', label: 'Other' },
]

// Profile banners anyone can pick. The app draws them, so there is nothing to download.
export const BANNERS = [
  { id: 'space', label: 'Space' },
  { id: 'milky', label: 'Milky Way' },
  { id: 'horizon', label: 'Horizon' },
  { id: 'blue', label: 'Blue' },
]
