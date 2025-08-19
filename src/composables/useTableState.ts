import { ref, reactive, computed } from 'vue';
import type { TableState, SortState, FilterState } from '../types';

export function useTableState() {
  const state = reactive<TableState>({
    page: 1,
    pageSize: 25,
    sort: { column: null, direction: null },
    filters: { global: '', columnFilters: {} },
    selectedRows: new Set<string>(),
    pinnedColumns: [],
    pinnedRows: new Set<string>(),
    loading: false,
    error: null,
  });

  const resetFilters = () => {
    state.filters.global = '';
    state.filters.columnFilters = {};
    state.page = 1;
  };

  const resetSort = () => {
    state.sort.column = null;
    state.sort.direction = null;
  };

  const setSort = (column: string) => {
    if (state.sort.column === column) {
      // Cycle through: asc -> desc -> none
      if (state.sort.direction === 'asc') {
        state.sort.direction = 'desc';
      } else if (state.sort.direction === 'desc') {
        resetSort();
      } else {
        state.sort.direction = 'asc';
      }
    } else {
      state.sort.column = column;
      state.sort.direction = 'asc';
    }
    state.page = 1;
  };

  const toggleRowSelection = (rowId: string) => {
    if (state.selectedRows.has(rowId)) {
      state.selectedRows.delete(rowId);
    } else {
      state.selectedRows.add(rowId);
    }
  };

  const toggleAllRows = (allRowIds: string[]) => {
    const allSelected = allRowIds.every(id => state.selectedRows.has(id));
    if (allSelected) {
      allRowIds.forEach(id => state.selectedRows.delete(id));
    } else {
      allRowIds.forEach(id => state.selectedRows.add(id));
    }
  };

  const clearSelection = () => {
    state.selectedRows.clear();
  };

  const toggleRowPin = (rowId: string) => {
    if (state.pinnedRows.has(rowId)) {
      state.pinnedRows.delete(rowId);
    } else {
      state.pinnedRows.add(rowId);
    }
  };

  const clearPinnedRows = () => {
    state.pinnedRows.clear();
  };

  const selectedRowIds = computed(() => Array.from(state.selectedRows));
  const pinnedRowIds = computed(() => Array.from(state.pinnedRows));
  const selectedCount = computed(() => state.selectedRows.size);

  return {
    state,
    resetFilters,
    resetSort,
    setSort,
    toggleRowSelection,
    toggleAllRows,
    clearSelection,
    toggleRowPin,
    clearPinnedRows,
    selectedRowIds,
    pinnedRowIds,
    selectedCount,
  };
}