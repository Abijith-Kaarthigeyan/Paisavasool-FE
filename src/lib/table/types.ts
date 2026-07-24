export type SortDirection = "asc" | "desc"

export type SortState = {
  id: string
  direction: SortDirection
} | null

export type FilterType = "text" | "select" | "date-range" | "number-range"

export type TextFilterValue = string

export type SelectFilterValue = string

export type DateRangeFilterValue = {
  from?: string
  to?: string
}

export type NumberRangeFilterValue = {
  min?: number
  max?: number
}

export type ColumnFilterValue =
  | TextFilterValue
  | SelectFilterValue
  | DateRangeFilterValue
  | NumberRangeFilterValue

export type FilterValues = Record<string, ColumnFilterValue | undefined>

export type AccessorFn<T> = (row: T) => unknown

export type Accessor<T> = string | AccessorFn<T>

export interface SelectOption {
  value: string
  label: string
}

export interface ColumnFilterConfig<T = unknown> {
  type: FilterType
  /** Defaults to column accessor / id when omitted */
  accessor?: Accessor<T>
  options?: SelectOption[]
  placeholder?: string
}

export interface ColumnDef<T> {
  id: string
  label: string
  sortable?: boolean
  /** Value used for sort (and default filter accessor). Defaults to `id`. */
  accessor?: Accessor<T>
  filter?: ColumnFilterConfig<T>
  align?: "left" | "center" | "right"
  className?: string
  /** First-click sort direction when activating this column. Default: asc */
  defaultSortDirection?: SortDirection
}

export interface ActiveFilterChip {
  id: string
  label: string
  valueLabel: string
}
