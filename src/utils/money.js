// Money arrives from the API as a decimal string so that no amount ever passes
// through a float. Number() is applied only here, at the point of display.
const FORMATTERS = new Map()

const formatterFor = (currency) => {
  if (!FORMATTERS.has(currency)) {
    FORMATTERS.set(
      currency,
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
        // The peso has no cents in everyday use; showing ",00" on every price
        // in a grid adds four characters of noise per card and no information.
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
      }),
    )
  }
  return FORMATTERS.get(currency)
}

export const formatMoney = (amount, currency = 'COP') => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  return formatterFor(currency).format(value)
}
