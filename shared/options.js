// Lists shared by the app and the server. The server only accepts these ids.

// "Open to" is the heart of BlueLink: it tells people it is OK to reach out.
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
