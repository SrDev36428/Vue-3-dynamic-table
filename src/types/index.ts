export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface FilterState {
  global: string;
  columnFilters: Record<string, string>;
}

export interface PinnedColumn {
  name: string;
  side: 'left' | 'right';
  offset: number;
}

export interface TableState {
  page: number;
  pageSize: number;
  sort: SortState;
  filters: FilterState;
  selectedRows: Set<string>;
  pinnedColumns: PinnedColumn[];
  pinnedRows: Set<string>;
  loading: boolean;
  error: string | null;
}