export type FormatCurrencyOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  notation?: "standard" | "compact"
}

/** Format a numeric amount in Indian Rupees (₹). */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    notation = "standard",
  } = options

  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  })

  return `₹${formatted}`
}

/** Format a signed currency delta, e.g. "Total +₹2,400" or "Total −₹500". */
export function formatCurrencyDelta(delta: number): string {
  if (delta === 0) return formatCurrency(0)
  const sign = delta > 0 ? "+" : "−"
  return `${sign}${formatCurrency(Math.abs(delta))}`
}
