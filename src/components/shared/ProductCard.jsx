import { Link } from 'react-router-dom'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { formatMoney } from '../../utils/money'

// Said in the shopper's words, not the seller's. "like_new" is a database value.
const CONDITION = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good condition',
  acceptable: 'Used',
  for_parts: 'For parts',
}

/**
 * One listing in a grid.
 *
 * The photograph is most of the card and the price is the second thing read,
 * which is the order a shopper actually looks in. Everything else is one line:
 * who is selling it, and how worn it is.
 *
 * A listing carries a shop or it carries a person, never both, so the line
 * below the price says which without the shopper working it out.
 */
const ProductCard = ({ product, index = 0 }) => {
  const seller = product.shop?.name ?? product.seller?.username
  const condition = CONDITION[product.condition]

  return (
    <Link
      to={`/p/${product.id}`}
      style={{ '--i': index }}
      className="rise-in group flex flex-col overflow-hidden rounded-pz border border-line bg-surface transition-[transform,border-color] duration-200 ease-pz hover:-translate-y-0.5 hover:border-line-strong"
    >
      {product.cover ? (
        <img
          src={product.cover}
          alt=""
          loading="lazy"
          className="aspect-square w-full bg-sunk object-cover"
        />
      ) : (
        // Nothing published should reach this, since a photo is required to
        // publish. It exists because a Cloudinary asset can still go missing,
        // and a broken image icon is a worse answer than an empty frame.
        <span className="flex aspect-square w-full items-center justify-center bg-sunk text-faint">
          <PhotoIcon className="size-8" />
        </span>
      )}

      <span className="flex grow flex-col gap-1 p-3">
        <span className="tabular font-display text-lg leading-none font-semibold text-ink">
          {formatMoney(product.price, product.currency)}
        </span>

        <span className="line-clamp-2 text-sm leading-snug text-ink">{product.title}</span>

        <span className="mt-auto pt-1.5 text-xs text-faint">
          {[seller, condition].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  )
}

export default ProductCard
