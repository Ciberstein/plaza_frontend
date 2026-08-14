import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'

/**
 * How to reach the other person, once an order has been agreed.
 *
 * The email is always here, because everyone has one to sign up at all. The
 * phone is only there for people who added one in their settings, so this
 * block has to read as complete with one line and not look broken with it.
 *
 * Both are real links: on a phone, a number you cannot press is a number you
 * have to copy by hand while reading it off a screen.
 */
const Contact = ({ who, email, phone }) => {
  if (!email && !phone) return null

  return (
    <div className="mt-4 rounded-pz-sm border border-line bg-sunk px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">
        Reach the {who}
      </p>

      <ul className="mt-2 flex flex-col gap-1.5">
        {email && (
          <li className="flex items-center gap-2 text-sm">
            <EnvelopeIcon className="size-4 shrink-0 text-faint" />
            <a href={`mailto:${email}`} className="truncate font-medium text-link hover:underline">
              {email}
            </a>
          </li>
        )}

        {phone && (
          <li className="flex items-center gap-2 text-sm">
            <PhoneIcon className="size-4 shrink-0 text-faint" />
            <a href={`tel:${phone}`} className="tabular font-medium text-link hover:underline">
              {phone}
            </a>
          </li>
        )}
      </ul>
    </div>
  )
}

export default Contact
