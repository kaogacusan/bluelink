import type { ReactNode } from 'react'
import { Logo } from '../components/Logo'
import { LEGAL, RULES } from '../../shared/legal.js'
import { MEMBERSHIP, PLANS } from '../../shared/membership.js'

type Doc = 'privacy' | 'terms'
type Section = { title: string; body: ReactNode }

const NPC = (
  <a href="https://privacy.gov.ph" target="_blank" rel="noreferrer">
    National Privacy Commission
  </a>
)

// Written for people, not lawyers. Every promise here must match what the app really does.
const PRIVACY: Section[] = [
  {
    title: 'Who we are',
    body: (
      <>
        <p>
          BlueLink is run by {LEGAL.operator}. It is not an official Ateneo de Manila University service, and the university does not run or endorse it.
        </p>
        <p>
          Questions about your data go to our privacy contact (Data Protection Officer): {LEGAL.dpo}, at {LEGAL.contact}.
        </p>
      </>
    ),
  },
  {
    title: 'What we collect',
    body: (
      <ul>
        <li>
          <b>When you sign in:</b> your email, your name, and your Google photo if you use Google. We turn your email into a code and do not keep the email itself.
        </li>
        <li>
          <b>What you add:</b> your role (student, alumni, faculty or staff), course or department, year, headline, about, skills, what you are open to, photo, posts, comments, messages, and org details.
        </li>
        <li>
          <b>When you pay:</b> the GCash reference number, the amount, and the date. We never see your GCash PIN or balance.
        </li>
        <li>
          <b>For safety:</b> reports you make, reports about you, and the people you block.
        </li>
        <li>
          <b>On your device:</b> your browser keeps your sign-in and your theme. We use no ads and no tracking cookies.
        </li>
      </ul>
    ),
  },
  {
    title: 'Why we use it',
    body: (
      <ul>
        <li>To run your account and show your profile to other members. This is the service you join for.</li>
        <li>To check payments and keep records.</li>
        <li>To keep members safe: to act on reports and stop abuse.</li>
        <li>
          Your course and year are education details. The Data Privacy Act treats these as sensitive, so we ask for your clear consent when you join. You can take it back any time by
          deleting your account.
        </li>
      </ul>
    ),
  },
  {
    title: 'Who can see it',
    body: (
      <ul>
        <li>Members can see your profile, posts, and comments. People who are not members cannot.</li>
        <li>Messages are only shown to you and the other person. The admin page cannot show them, and we do not read them.</li>
        <li>Our admins see payments and reports. We only look at a post or comment when someone reports it.</li>
        <li>Your photo has a long link that is hard to guess, so it can show on your profile. Anyone who has that exact link can open the photo.</li>
        <li>We never show your email. We never sell your data, rent it, or use it for ads.</li>
      </ul>
    ),
  },
  {
    title: 'Other companies that handle it',
    body: (
      <ul>
        <li>Google, if you sign in with Google.</li>
        <li>GCash, when you pay. Their own privacy policy covers that.</li>
        <li>Our host, which stores the app and its data: {LEGAL.host}.</li>
      </ul>
    ),
  },
  {
    title: 'How long we keep it',
    body: (
      <>
        <p>
          We keep your data while you have an account. When you delete your account in Settings, we delete your profile, photo, posts, comments, messages, connections, and org
          memberships right away.
        </p>
        <p>We keep two things after that: payment records, for our accounts, and safety reports, so we can stop someone who comes back to harm people. Neither shows your name.</p>
      </>
    ),
  },
  {
    title: 'How we protect it',
    body: (
      <p>
        The app uses a secure connection. We keep a coded version of your email, not the email. Only a few admins can open the admin page. If a data breach could harm you, we will
        tell you and the {NPC} within 72 hours of finding it.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <>
        <p>
          Under the Data Privacy Act of 2012 (Republic Act 10173), you have the right to be told how your data is used, to see it, to correct it, to object, to have it deleted or
          blocked, to get a copy of it, and to be paid for damages.
        </p>
        <ul>
          <li>Correct your data: edit your profile.</li>
          <li>Get a copy: Settings, then Download my data.</li>
          <li>Delete everything: Settings, then Delete account.</li>
          <li>Anything else: write to {LEGAL.contact}. We answer within 15 days.</li>
        </ul>
        <p>If you think we broke the law, you can file a complaint with the {NPC}.</p>
      </>
    ),
  },
  {
    title: `Only for people ${LEGAL.minAge} and older`,
    body: <p>BlueLink is not for anyone under {LEGAL.minAge}. If we learn that a member is younger, we delete the account.</p>,
  },
  {
    title: 'Changes',
    body: <p>If we change this notice, we show the new date at the top and tell members in the app before the change starts.</p>,
  },
]

const TERMS: Section[] = [
  {
    title: 'What BlueLink is',
    body: (
      <p>
        BlueLink is a members-only network for Ateneans, run by {LEGAL.operator}. It is not an official Ateneo de Manila University service, and the university does not run or
        endorse it. By joining, you agree to these terms and to our <a href="#/privacy">Privacy Notice</a>.
      </p>
    ),
  },
  {
    title: 'Who can join',
    body: (
      <ul>
        <li>You are {LEGAL.minAge} or older.</li>
        <li>You are a current student, alumni, or faculty or staff of Ateneo.</li>
        <li>One account per person, under your real name.</li>
      </ul>
    ),
  },
  {
    title: 'Price',
    body: (
      <ul>
        <li>
          ₱{PLANS[0].price} gives you {PLANS[0].days} days. It does not renew by itself.
        </li>
        <li>₱{PLANS[1].price} gives you a lifetime membership. Lifetime means for as long as BlueLink runs. You pay one time.</li>
        <li>A voucher code gives the time printed on the card. A founding member code gives {MEMBERSHIP.codeDays} days.</li>
        <li>Everyone gets the same features. There is no premium tier.</li>
      </ul>
    ),
  },
  {
    title: 'Paying',
    body: (
      <p>
        Pay by GCash to the number shown in the app, or buy a voucher at our booth. You get in right away, and we check every payment. If a payment turns out not to be real, we
        take back the time it gave.
      </p>
    ),
  },
  {
    title: 'Refunds',
    body: (
      <ul>
        <li>
          Changed your mind? Ask within {LEGAL.refundDays} days of paying and we refund the full amount you paid. Write to {LEGAL.contact}.
        </li>
        <li>If BlueLink closes before your time runs out, we refund the unused part.</li>
        <li>If we remove you for breaking the rules, we do not refund you.</li>
      </ul>
    ),
  },
  {
    title: 'Community rules',
    body: (
      <ol className="legal-rules">
        {RULES.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
    ),
  },
  {
    title: 'What you post',
    body: (
      <p>
        You own what you post. You let us show it to members so BlueLink works. Only post what you have the right to share. You are responsible for what you post and for any deal
        you make with another member.
      </p>
    ),
  },
  {
    title: 'What we can do',
    body: (
      <p>
        We can remove posts, comments, or accounts that break these rules or the law, and we can report illegal content to the authorities. We can change or stop features. We
        tell members before big changes.
      </p>
    ),
  },
  {
    title: 'What we cannot promise',
    body: <p>BlueLink helps you meet people. We cannot promise replies, jobs, internships, or any result. We try to keep the app running, but it can go down.</p>,
  },
  {
    title: 'Law and questions',
    body: (
      <p>
        Philippine law applies to these terms. Questions or complaints go to {LEGAL.contact}. Report a member or a post with the report button on every profile and post.
      </p>
    ),
  },
]

const DOCS: Record<Doc, { title: string; sections: Section[] }> = {
  privacy: { title: 'Privacy Notice', sections: PRIVACY },
  terms: { title: 'Terms of Use', sections: TERMS },
}

export function Legal({ doc }: { doc: Doc }) {
  const { title, sections } = DOCS[doc]
  return (
    <div className="legal">
      <header className="legal-top">
        <a href="#/" aria-label="BlueLink home">
          <Logo size={26} />
        </a>
        <nav className="legal-tabs" aria-label="Legal pages">
          <a href="#/privacy" aria-current={doc === 'privacy' ? 'page' : undefined}>
            Privacy
          </a>
          <a href="#/terms" aria-current={doc === 'terms' ? 'page' : undefined}>
            Terms
          </a>
        </nav>
      </header>
      <article className="legal-body">
        <p className="legal-kicker">Updated {LEGAL.updated}</p>
        <h1>{title}</h1>
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s.title}
            </h2>
            {s.body}
          </section>
        ))}
        <a className="btn btn-outline legal-back" href="#/">
          Back to BlueLink
        </a>
      </article>
    </div>
  )
}
