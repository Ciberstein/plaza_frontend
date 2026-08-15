import { useTranslation } from 'react-i18next'
import { CheckIcon } from '@heroicons/react/20/solid'
import { MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { withFeatureLabels } from '../../utils/vocabulary'
import { formatMoney } from '../../utils/money'

/**
 * What a property is, in numbers, on its own page.
 *
 * A definition list rather than prose. Somebody comparing three flats is
 * reading the same eight rows in the same order in three tabs, and a
 * paragraph — "62 square metres, three bedrooms and two bathrooms on the
 * fourth floor" — makes that job harder for the sake of reading nicely once.
 *
 * Rows with no answer are absent rather than empty. A lot has no bedrooms and
 * a studio has no separate one; printing "Habitaciones: 0" invites the reader
 * to wonder whether it is a fact or a form somebody skipped.
 */
const Spec = ({ label, value }) =>
  value === null || value === undefined || value === '' ? null : (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="tabular text-sm font-medium text-ink">{value}</dd>
    </div>
  )

const PropertySpecs = ({ product }) => {
  const { t } = useTranslation()
  const property = product.property

  if (!property) return null

  const area = (value) =>
    value ? t('Vocabulary.Property.Area', { area: Math.round(Number(value)) }) : null

  // Zero is a real answer and so is nothing, and they are told apart here
  // rather than by a truthiness check that would hide "no parking" as though
  // the seller had not said.
  const count = (value) => (value === null || value === undefined ? null : String(value))

  const features = withFeatureLabels(t, (property.features ?? []).map(value => ({ value })))

  // The barrio is always public; how much of the street shows is the owner's
  // choice, already applied by the server. What arrives is what may be shown.
  const where = [property.address, property.neighborhood, product.city?.name]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">
          {t('Property.Specs.Title')}
        </h2>

        <dl className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <Spec
            label={t('Property.Specs.Condition')}
            value={property.condition
              ? t(`Vocabulary.PropertyCondition.${
                  { new: 'New', used: 'Used', off_plan: 'OffPlan' }[property.condition]
                }.Label`)
              : null}
          />
          <Spec label={t('Property.Specs.BuiltArea')} value={area(property.builtArea)} />
          <Spec label={t('Property.Specs.PrivateArea')} value={area(property.privateArea)} />
          <Spec label={t('Property.Specs.LotArea')} value={area(property.lotArea)} />
          <Spec label={t('Property.Specs.Bedrooms')} value={count(property.bedrooms)} />
          <Spec label={t('Property.Specs.Bathrooms')} value={count(property.bathrooms)} />
          <Spec
            label={t('Property.Specs.HalfBaths')}
            value={property.halfBaths > 0 ? String(property.halfBaths) : null}
          />
          <Spec label={t('Property.Specs.Parking')} value={count(property.parking)} />
          <Spec
            label={t('Property.Specs.Stratum')}
            value={property.stratum ? String(property.stratum) : null}
          />
          <Spec
            label={t('Property.Specs.Floor')}
            // Zero is the ground floor, which has a name, and "Piso 0" is not
            // it in any of the three languages.
            value={
              property.floor === null || property.floor === undefined
                ? null
                : property.floor === 0
                  ? t('Property.Specs.GroundFloor')
                  : String(property.floor)
            }
          />
          <Spec
            label={t('Property.Specs.BuiltYear')}
            value={property.builtYear ? String(property.builtYear) : null}
          />
          <Spec
            label={t('Property.Specs.AdminFee')}
            value={
              property.adminFee > 0
                ? property.adminIncluded
                  ? t('Property.Specs.AdminIncluded')
                  : t('Property.Specs.AdminMonthly', {
                      amount: formatMoney(property.adminFee, product.currency),
                    })
                : null
            }
          />
        </dl>
      </section>

      {features.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">
            {t('Property.Features.Title')}
          </h2>

          <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <li key={feature.value} className="flex items-center gap-2 text-sm text-ink">
                <CheckIcon className="size-4 shrink-0 text-good" />
                {feature.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">
          {t('Property.Location.Title')}
        </h2>

        <p className="mt-3 flex items-start gap-2 text-sm text-ink">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted" />
          {where}
        </p>

        {/* Said plainly rather than left as an absence. Somebody who cannot
            find the address should know it is being withheld on purpose and
            what opens it, not wonder whether the seller forgot. */}
        {!property.address && (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('Property.Location.Hidden')}
          </p>
        )}
      </section>

      {/* Only when the owner asked for it. The server sends null otherwise, so
          there is nothing here to hide. */}
      {property.phone && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">
            {t('Property.Contact.Phone')}
          </h2>
          <p className="mt-3">
            <a
              href={`tel:${property.phone}`}
              className="tabular inline-flex items-center gap-2 text-sm font-medium text-link hover:underline"
            >
              <PhoneIcon className="size-4" />
              {property.phone}
            </a>
          </p>
        </section>
      )}
    </div>
  )
}

export default PropertySpecs
