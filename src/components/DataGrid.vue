<template>
  <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <!-- Controls Bar -->
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Global Search -->
          <div class="relative">
            <input
              v-model="globalSearchInput"
              type="text"
              placeholder="Global search..."
              class="input-field w-64 pl-9"
            >
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <!-- Clear Filters -->
          <button
            v-if="hasActiveFilters"
            @click="clearAllFilters"
            class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear filters
          </button>
        </div>

        <!-- Pin Controls -->
        <div class="flex items-center space-x-2">
          <button
            v-if="pinnedRowIds.length > 0"
            @click="clearPinnedRows"
            class="btn-danger text-xs"
          >
            Clear pinned rows ({{ pinnedRowIds.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-8 text-center">
      <div class="text-error-600 mb-4">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium">Error loading data</h3>
        <p class="text-sm text-gray-600 mt-2">{{ error }}</p>
      </div>
      <button @click="$emit('retry')" class="btn-primary">
        Try Again
      </button>
    </div>

    <!-- Table -->
    <div v-else-if="data && data.results" class="relative">
      <div class="overflow-auto max-h-[600px]">
        <table class="min-w-full">
          <!-- Header -->
          <thead class="sticky-header">
            <tr class="bg-gray-50">
              <!-- Selection column (entities only) -->
              <th v-if="showSelection" class="sticky-column left-0 table-cell bg-gray-50 z-30">
                <div class="flex items-center justify-center">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleAllRowsHandler"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  >
                </div>
              </th>
              
              <!-- Data columns -->
              <th
                v-for="(column, index) in displayColumns"
                :key="column"
                :class="getColumnClasses(column, index)"
                :style="getColumnStyles(column)"
              >
                <div class="flex flex-col space-y-2">
                  <!-- Column header with sort -->
                  <div class="flex items-center justify-between min-h-[2rem]">
                    <button
                      @click="handleSort(column)"
                      class="flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-primary-600 transition-colors group"
                    >
                      <span class="truncate">{{ column }}</span>
                      <div class="flex flex-col">
                        <svg 
                          :class="[
                            'w-3 h-3 transition-colors',
                            currentSort.column === column && currentSort.direction === 'asc'
                              ? 'text-primary-600' 
                              : 'text-gray-400 group-hover:text-gray-600'
                          ]" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        <svg 
                          :class="[
                            'w-3 h-3 transition-colors -mt-1',
                            currentSort.column === column && currentSort.direction === 'desc'
                              ? 'text-primary-600'
                              : 'text-gray-400 group-hover:text-gray-600'
                          ]" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </button>
                    
                    <!-- Pin button -->
                    <div class="flex items-center space-x-1">
                      <button
                        @click="toggleColumnPin(column, 'left')"
                        :class="[
                          'p-1 rounded hover:bg-gray-200 transition-colors',
                          isColumnPinned(column, 'left') ? 'text-primary-600' : 'text-gray-400'
                        ]"
                        title="Pin to left"
                      >
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <button
                        @click="toggleColumnPin(column, 'right')"
                        :class="[
                          'p-1 rounded hover:bg-gray-200 transition-colors',
                          isColumnPinned(column, 'right') ? 'text-primary-600' : 'text-gray-400'
                        ]"
                        title="Pin to right"
                      >
                        <svg class="w-3 h-3 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Column filter -->
                  <input
                    :value="columnFilters[column] || ''"
                    @input="updateColumnFilter(column, ($event.target as HTMLInputElement).value)"
                    type="text"
                    :placeholder="`Filter ${column}...`"
                    class="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:border-primary-500 focus:ring-primary-500"
                  >
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <!-- Pinned Rows -->
            <template v-if="pinnedRows.length > 0">
              <tr
                v-for="row in pinnedRows"
                :key="`pinned-${getRowId(row)}`"
                class="pinned-row border-b border-gray-200"
              >
                <!-- Selection column -->
                <td v-if="showSelection" class="sticky-column left-0 table-cell bg-blue-50 z-10">
                  <div class="flex items-center justify-center">
                    <button
                      @click="toggleRowPin(getRowId(row))"
                      class="p-1 text-primary-600 hover:text-primary-800 transition-colors"
                      title="Unpin row"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>

                <!-- Data columns -->
                <td
                  v-for="(column, colIndex) in displayColumns"
                  :key="`pinned-${column}-${colIndex}`"
                  :class="getColumnClasses(column, colIndex, true)"
                  :style="getColumnStyles(column)"
                  class="bg-blue-50"
                >
                  <div 
                    class="highlighted-text truncate max-w-xs" 
                    :title="String(row[column] || '')"
                    v-html="highlightMatches(String(row[column] || ''))"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- Regular Rows -->
            <tr
              v-for="row in visibleRows"
              :key="getRowId(row)"
              :class="[
                'hover:bg-gray-50 border-b border-gray-200',
                selectedRows.has(getRowId(row)) ? 'bg-primary-50' : ''
              ]"
            >
              <!-- Selection/Pin column -->
              <td v-if="showSelection" class="sticky-column left-0 table-cell bg-white z-10">
                <div class="flex items-center justify-center space-x-2">
                  <input
                    type="checkbox"
                    :checked="selectedRows.has(getRowId(row))"
                    @change="toggleRowSelection(getRowId(row))"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  >
                  <button
                    @click="toggleRowPin(getRowId(row))"
                    :class="[
                      'p-1 rounded hover:bg-gray-200 transition-colors',
                      pinnedRowIds.includes(getRowId(row)) ? 'text-primary-600' : 'text-gray-400'
                    ]"
                    title="Pin/Unpin row"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                    </svg>
                  </button>
                </div>
              </td>

              <!-- Data columns -->
              <td
                v-for="(column, colIndex) in displayColumns"
                :key="`${column}-${colIndex}`"
                :class="getColumnClasses(column, colIndex, false, showSelection ? colIndex + 1 : colIndex)"
                :style="getColumnStyles(column)"
              >
                <div 
                  class="highlighted-text truncate max-w-xs" 
                  :title="String(row[column] || '')"
                  v-html="highlightMatches(String(row[column] || ''))"
                ></div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="data.results.length === 0" class="border-b border-gray-200">
              <td :colspan="displayColumns.length + (showSelection ? 1 : 0)" class="text-center py-8 text-gray-500">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-3m0 0h-3m3 0v-3" />
                  </svg>
                  <p class="text-lg font-medium">No data found</p>
                  <p class="text-sm">Try adjusting your search or filters</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="data && data.results" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-700">
            Showing {{ ((data.page - 1) * data.page_size) + 1 }} to 
            {{ Math.min(data.page * data.page_size, data.total) }} of 
            {{ data.total }} results
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Page size selector -->
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-700">Per page:</label>
            <select
              :value="pageSize"
              @change="handlePageSizeChange($event)"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:border-primary-500 focus:ring-primary-500"
            >
              <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>

          <!-- Pagination controls -->
          <div class="flex items-center space-x-1">
            <button
              @click="goToPage(1)"
              :disabled="data.page <= 1"
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              @click="goToPage(data.page - 1)"
              :disabled="data.page <= 1"
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            
            <span class="px-3 py-1 text-sm">{{ data.page }}</span>
            
            <button
              @click="goToPage(data.page + 1)"
              :disabled="data.page >= Math.ceil(data.total / data.page_size)"
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              @click="goToPage(Math.ceil(data.total / data.page_size))"
              :disabled="data.page >= Math.ceil(data.total / data.page_size)"
              class="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { debounce } from '../utils/debounce';
import { highlightText } from '../utils/highlight';
import type { SortState, PinnedColumn } from '../types';

const props = defineProps<{
  data: any;
  loading: boolean;
  error: string | null;
  showSelection?: boolean;
  currentSort: SortState;
  globalFilter: string;
  columnFilters: Record<string, string>;
  selectedRows: Set<string>;
  pinnedColumns: PinnedColumn[];
  pinnedRowIds: string[];
  pageSize: number;
}>();

const emit = defineEmits<{
  'sort': [column: string];
  'page-changed': [page: number];
  'page-size-changed': [size: number];
  'global-filter': [filter: string];
  'column-filter': [column: string, filter: string];
  'row-selected': [rowId: string];
  'toggle-all': [allIds: string[]];
  'row-pinned': [rowId: string];
  'clear-pinned-rows': [];
  'column-pinned': [column: string, side: 'left' | 'right'];
  'retry': [];
}>();

const globalSearchInput = ref(props.globalFilter);
const pageSizes = [25, 100, 500, 1000];

// Watch global search input with debounce
const debouncedGlobalSearch = debounce((value: string) => {
  emit('global-filter', value);
}, 300);

watch(globalSearchInput, (newValue) => {
  debouncedGlobalSearch(newValue);
});

// Debounced column filter update
const debouncedColumnFilter = debounce((column: string, value: string) => {
  emit('column-filter', column, value);
}, 300);

const updateColumnFilter = (column: string, value: string) => {
  debouncedColumnFilter(column, value);
};

// Column management
const displayColumns = computed(() => {
  if (props.data?.columns) {
    return props.data.columns;
  }
  // Default columns for entities
  return ['Registration ID', 'Legal Name', 'Status', 'Address', 'Last Scan'];
});

// Row management
const getRowId = (row: any): string => {
  return row['Registration ID'] || row.id || String(Math.random());
};

const visibleRows = computed(() => {
  if (!props.data?.results) return [];
  
  // Filter out pinned rows from regular display
  return props.data.results.filter((row: any) => {
    const rowId = getRowId(row);
    return !props.pinnedRowIds.includes(rowId);
  });
});

const pinnedRows = computed(() => {
  if (!props.data?.results || props.pinnedRowIds.length === 0) return [];
  
  return props.data.results.filter((row: any) => {
    const rowId = getRowId(row);
    return props.pinnedRowIds.includes(rowId);
  });
});

// Selection management
const isAllSelected = computed(() => {
  if (!props.data?.results || props.data.results.length === 0) return false;
  return props.data.results.every((row: any) => props.selectedRows.has(getRowId(row)));
});

const toggleAllRowsHandler = () => {
  if (!props.data?.results) return;
  const allIds = props.data.results.map((row: any) => getRowId(row));
  emit('toggle-all', allIds);
};

const toggleRowSelection = (rowId: string) => {
  emit('row-selected', rowId);
};

// Pin management
const toggleRowPin = (rowId: string) => {
  emit('row-pinned', rowId);
};

const clearPinnedRows = () => {
  emit('clear-pinned-rows');
};

const toggleColumnPin = (column: string, side: 'left' | 'right') => {
  emit('column-pinned', column, side);
};

const isColumnPinned = (column: string, side: 'left' | 'right'): boolean => {
  return props.pinnedColumns.some(p => p.name === column && p.side === side);
};

// Styling helpers
const getColumnClasses = (column: string, index: number, isPinnedRow = false, absoluteIndex?: number): string => {
  const classes = ['table-cell'];
  
  const pinnedCol = props.pinnedColumns.find(p => p.name === column);
  if (pinnedCol) {
    classes.push('sticky-column', 'z-10');
    if (!isPinnedRow) {
      classes.push('shadow-sm');
    }
  }

  // First column sticky by default (if no selection column)
  if (!props.showSelection && index === 0 && !pinnedCol) {
    classes.push('sticky-column', 'left-0', 'z-10', 'shadow-sm');
  }

  // Selection column makes first data column index 1
  if (props.showSelection && absoluteIndex === 1 && !pinnedCol) {
    classes.push('sticky-column', 'z-10', 'shadow-sm');
  }

  return classes.join(' ');
};

const getColumnStyles = (column: string): Record<string, string> => {
  const pinnedCol = props.pinnedColumns.find(p => p.name === column);
  if (pinnedCol) {
    return {
      [pinnedCol.side]: `${pinnedCol.offset}px`,
    };
  }

  // Handle default sticky first column
  const isFirstDataColumn = displayColumns.value.indexOf(column) === 0;
    
  if (isFirstDataColumn && !pinnedCol) {
    const offset = props.showSelection ? 60 : 0; // Assume selection column width
    return { left: `${offset}px` };
  }

  return {};
};

// Filtering and highlighting
const hasActiveFilters = computed(() => {
  return props.globalFilter !== '' || Object.values(props.columnFilters).some(filter => filter !== '');
});

const clearAllFilters = () => {
  globalSearchInput.value = '';
  emit('global-filter', '');
  
  // Clear all column filters
  displayColumns.value.forEach((column: string) => {
    emit('column-filter', column, '');
  });
};

const getHighlightTerms = (): string[] => {
  const terms: string[] = [];
  
  if (props.globalFilter.trim()) {
    terms.push(props.globalFilter.trim());
  }
  
  Object.values(props.columnFilters).forEach(filter => {
    if (filter.trim()) {
      terms.push(filter.trim());
    }
  });
  
  return terms;
};

const highlightMatches = (text: string): string => {
  return highlightText(text, getHighlightTerms());
};

// Event handlers
const handleSort = (column: string) => {
  emit('sort', column);
};

const goToPage = (page: number) => {
  emit('page-changed', page);
};

const handlePageSizeChange = (event: Event) => {
  const size = parseInt((event.target as HTMLSelectElement).value);
  emit('page-size-changed', size);
};
</script>