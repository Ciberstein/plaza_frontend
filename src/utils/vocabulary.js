import { CATEGORY_LABELS } from './categoryLabels'

// Condition, delivery and shop-shipping are interface copy, not database
// content: `/public/meta` sends only the raw value plaza's forms validate
// against, and these maps turn each one into the translated key that says it
// in the shopper's words.
const CONDITION_KEY = {
  new: 'New',
  like_new: 'LikeNew',
  good: 'Good',
  acceptable: 'Acceptable',
  for_parts: 'ForParts',
}

const DELIVERY_KEY = {
  shipping: 'Shipping',
  door_delivery: 'DoorDelivery',
  door_pickup: 'DoorPickup',
  public_meetup: 'PublicMeetup',
}

const SHOP_SHIPPING_KEY = {
  seller: 'Seller',
  plaza: 'Plaza',
  pickup: 'Pickup',
}

const withLabels = (t, options, namespace, keyOf) =>
  options.map(option => ({
    ...option,
    label: t(`Vocabulary.${namespace}.${keyOf[option.value]}.Label`),
    subtitle: t(`Vocabulary.${namespace}.${keyOf[option.value]}.Subtitle`),
  }))

export const withConditionLabels = (t, options) => withLabels(t, options, 'Condition', CONDITION_KEY)
export const withDeliveryLabels = (t, options) => withLabels(t, options, 'Delivery', DELIVERY_KEY)
export const withShopShippingLabels = (t, options) => withLabels(t, options, 'ShopShipping', SHOP_SHIPPING_KEY)

// Categories are real database content, sent by `/public/meta` in Spanish —
// the language they were seeded in. `CATEGORY_LABELS` is a frontend lookup
// keyed by the same `slug` the backend already sends, so Spanish keeps coming
// straight from the API (it needs no translation, being the source language)
// and only English/Portuguese are looked up. A category with no entry there
// — anything added to the seeder after this file was last updated — simply
// keeps showing its Spanish name, which is what everyone sees today anyway.
const categoryLabel = (language, category) =>
  (language === 'es' ? category.label : CATEGORY_LABELS[category.slug]?.[language]) ?? category.label

export const withCategoryLabels = (language, categories) =>
  categories.map(parent => ({
    ...parent,
    label: categoryLabel(language, parent),
    children: (parent.children ?? []).map(child => ({
      ...child,
      label: categoryLabel(language, child),
    })),
  }))
