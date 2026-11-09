// Lists shared by the app and the server. The server only accepts these ids.

// "Open to" is the heart of blueLink: it tells people it is OK to reach out.
export const OPEN_TO = [
  { id: 'coffee', label: 'Coffee chats' },
  { id: 'study', label: 'Study buddies' },
  { id: 'advice', label: 'Giving advice' },
  { id: 'mentor', label: 'Finding a mentor' },
  { id: 'intern', label: 'Internships' },
  { id: 'projects', label: 'Projects' },
  { id: 'events', label: 'Events' },
  { id: 'recruit', label: 'Recruiting' },
]

export const SCHOOLS = [
  { id: 'soh', short: 'SOH', name: 'School of Humanities' },
  { id: 'soss', short: 'SOSS', name: 'School of Social Sciences' },
  { id: 'sose', short: 'SOSE', name: 'School of Science and Engineering' },
  { id: 'jgsom', short: 'JGSOM', name: 'John Gokongwei School of Management' },
  { id: 'gbseald', short: 'GBSEALD', name: 'Gokongwei Brothers School of Education and Learning Design' },
  { id: 'other', short: 'Other', name: 'Other unit or school' },
]

// Ateneo undergraduate degree programs, from the Ateneo College Viewbook 2026-2027.
// One entry per course: honors and double-degree tracks go under their main course.
// The course box suggests these, but people can still type their own (grad school, older programs).
export const COURSES = [
  'AB Chinese Studies',
  'AB Communication',
  'AB Development Studies',
  'AB Diplomacy and International Relations',
  'AB Economics',
  'AB European Studies',
  'AB History',
  'AB Humanities',
  'AB Interdisciplinary Studies',
  'AB Literature (English)',
  'AB Management Economics',
  'AB Philosophy',
  'AB Political Science',
  'AB Psychology',
  'AB Social Sciences',
  'AB Sociology',
  'BFA Art Management',
  'BFA Creative Writing',
  'BFA Information Design',
  'BFA Theater Arts',
  'BS Applied Mathematics',
  'BS Applied Physics',
  'BS Biology',
  'BS Chemistry',
  'BS Communications Technology Management',
  'BS Computer Engineering',
  'BS Computer Science',
  'BS Electronics Engineering',
  'BS Environmental Science',
  'BS Health Sciences',
  'BS Information Technology Entrepreneurship',
  'BS Innovation Design Engineering',
  'BS Learning Science and Design',
  'BS Legal Management',
  'BS Life Sciences',
  'BS Management',
  'BS Management Engineering',
  'BS Management Information Systems',
  'BS Management of Applied Chemistry',
  'BS Mathematics',
  'BS Physics',
  'BS Psychology',
  'BS Restaurant Entrepreneurship',
]

// Where a student is now. Grad school counts. People who finished pick "alum" and a batch year instead.
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
  { id: 'alum', label: 'Alum' },
  { id: 'faculty', label: 'Faculty or staff' },
]

export const KINDS = [
  { id: 'post', label: 'Post', verb: 'posted' },
  { id: 'ask', label: 'Ask', verb: 'is asking' },
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
