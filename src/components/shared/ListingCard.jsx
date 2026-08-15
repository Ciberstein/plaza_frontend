import ProductCard from './ProductCard'
import PropertyCard from './PropertyCard'

/**
 * A listing in a grid, whichever kind it is.
 *
 * Every grid on the site can hold more than one kind, and most of them do so
 * without meaning to: `/saved` holds whatever anybody saved, a shop's showcase
 * holds whatever that shop lists, and `/c/vivienda-apartamento` reaches the
 * home grid because a category slug is unique across all three trees. Each of
 * those was picking the goods card and drawing a flat as though it were a
 * shirt — no operation, no rooms, no neighbourhood.
 *
 * One dispatch, in one file, rather than the same conditional written into
 * three call sites and forgotten in the fourth.
 */
const ListingCard = (props) =>
  props.product?.kind === 'property' ? <PropertyCard {...props} /> : <ProductCard {...props} />

export default ListingCard
