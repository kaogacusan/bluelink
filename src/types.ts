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
}

export interface GalleryItem {
  id: string
  title: string
  caption: string
  link: string
  url: string
}

export interface FullPerson extends Person {
  about: string
  skills: string[]
  gallery: GalleryItem[]
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
  logo: string | null
  verified: boolean
}

export interface MyOrg extends OrgMini {
  category: string
  myRole: 'admin' | 'member'
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
  createdAt: number
  people: (Person & { orgRole: 'admin' | 'member' })[]
  applications: { user: Person; answer: string; at: number }[]
}

export interface Post {
  id: string
  kind: 'post' | 'ask' | 'work' | 'opp' | 'event'
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
