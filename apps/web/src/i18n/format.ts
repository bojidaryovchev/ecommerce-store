/**
 * Number format for prices stored in cents. Use with next-intl's formatter so the locale is applied:
 *   const format = useFormatter();            // client components
 *   const format = await getFormatter();      // server components
 *   format.number(price.unitAmount / 100, priceFormat(price.currency))
 */
export const priceFormat = (currency: string) =>
  ({ style: "currency", currency: currency.toUpperCase() }) as const satisfies Intl.NumberFormatOptions;
