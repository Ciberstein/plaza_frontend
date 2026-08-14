import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

/**
 * One section of a long form, folded away with its answer showing.
 *
 * The summary is the point. A collapsed section that shows only its title makes
 * the person open every one to find out what is already filled in, which is
 * worse than the long form it was meant to shorten. Folded, it should read as a
 * receipt: "Price — $180.000". Open, it is the fields.
 *
 * `problem` marks a section holding something the form refused. Sections do not
 * open themselves — the caller remounts them by changing their key — but the
 * header has to say which one to look in, because a required field nobody can
 * see is a submit button that appears to do nothing.
 */
const Accordion = ({ title, summary, defaultOpen = false, problem = false, children }) => (
  <Disclosure defaultOpen={defaultOpen}>
    <div
      className={clsx(
        'overflow-hidden rounded-pz border bg-surface transition-colors',
        problem ? 'border-alert' : 'border-line',
      )}
    >
      <DisclosureButton className="group flex w-full cursor-pointer items-start gap-4 p-5 text-left transition-colors hover:bg-sunk">
        <span className="min-w-0 grow">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-semibold text-ink">{title}</span>
            {problem && (
              <span className="flex items-center gap-1 text-xs font-medium text-alert">
                <ExclamationCircleIcon className="size-4" />
                Needs attention
              </span>
            )}
          </span>

          {summary && (
            <span className="mt-1 block truncate text-sm text-muted">{summary}</span>
          )}
        </span>

        <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-link transition-transform duration-200 ease-pz group-data-open:rotate-180" />
      </DisclosureButton>

      <DisclosurePanel className="border-t border-line p-5">
        {children}
      </DisclosurePanel>
    </div>
  </Disclosure>
)

export default Accordion
