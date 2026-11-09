import { BannerArt } from './Network'
import type { Person } from '../types'

export const isBannerPicture = (banner?: string | null) => !!banner?.startsWith('/')

// A person's banner: a picture they added, or one of the drawn ones. Nothing for plain gray.
export function Banner({ person }: { person: Pick<Person, 'uid' | 'banner'> }) {
  const b = person.banner
  if (!b) return null
  return isBannerPicture(b) ? <img className="cover-img" src={b} alt="" /> : <BannerArt id={b} seed={person.uid} />
}

// The strip at the top of a profile or a person card. Plain gray until they pick one.
export function BannerBand({ person, className }: { person: Pick<Person, 'uid' | 'banner'>; className: string }) {
  return (
    <div className={`${className} ${person.banner ? '' : 'is-empty'}`}>
      <Banner person={person} />
    </div>
  )
}
