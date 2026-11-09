export type Status = 'self' | 'none' | 'sent' | 'received' | 'connected'

export interface Person {
  uid: string
  name: string
  role: string
  school: string
  course: string
  level: string
  year: number | null
  headline: string
  openTo: string[]
  photo: string | null
  status?: Status
  // On profiles and in the people list: a picture's URL, a drawn banner's id, or null for plain gray.
  banner?: string | null
  // Only in the people list: their orgs and businesses, and which one they show first.
  highlight?: string
  orgs?: MyOrg[]
}

export interface GalleryItem {
  id: string
  title: string
  caption: string
  link: string
  featured: boolean
  url: string
}

export type PortfolioStyle = 'gallery' | 'stage' | 'list'

// How a portfolio looks. The owner picks it. An empty title means "Portfolio".
export interface PortfolioLook {
  style: PortfolioStyle
  title: string
}

export interface FullPerson extends Person {
  about: string
  skills: string[]
  // The org or business shown first and biggest on the profile. Empty means none picked.
  highlight: string
  gallery: GalleryItem[]
  portfolio: PortfolioLook
  createdAt: number
}

export interface Comment {
  id: string
  text: string
  at: number
  author: Person
  mine: boolean
}

export interface EventInfo {
  title: string
  date: string
  time: string
  place: string
}

export interface OrgMini {
  id: string
  name: string
  short: string
  type: 'org' | 'business'
  logo: string | null
  cover: string | null
  verified: boolean
}

export interface MyOrg extends OrgMini {
  category: string
  myRole: 'admin' | 'member'
  title: string
}

export interface Org extends OrgMini {
  category: string
  about: string
  recruiting: boolean
  members: number
  followers: number
  myRole: 'admin' | 'member' | null
  following: boolean
  applied: boolean
}

export interface OrgFull extends Org {
  links: { facebook: string; instagram: string; website: string }
  question: string
  gallery: GalleryItem[]
  portfolio: PortfolioLook
  createdAt: number
  people: (Person & { orgRole: 'admin' | 'member'; title: string })[]
  applications: { user: Person; answer: string; at: number }[]
}

export interface Post {
  id: string
  kind: 'post' | 'work' | 'opp' | 'event'
  org: OrgMini | null
  canDelete: boolean
  text: string
  event: EventInfo | null
  at: number
  author: Person
  mine: boolean
  likes: number
  liked: boolean
  going: number
  isGoing: boolean
  comments: Comment[]
}

export interface Membership {
  active: boolean
  until: number
  via: 'gcash' | 'code' | 'admin' | null
  status: 'pending' | 'approved' | 'rejected' | null
  ref: string
  lifetime: boolean
}

export interface Message {
  id: string
  text: string
  at: number
  mine: boolean
  pending?: boolean
}

export interface Thread {
  user: Person
  last: { text: string; at: number; mine: boolean } | null
  unread: number
  at: number
}

export interface Request {
  user: Person
  note: string
  at: number
}
