<template>
  <div class="min-h-screen bg-gray-50">
    <TopBar />
    
    <DataSetSwitcher
      :current-view="currentView"
      :custom-configs="customConfigs"
      :selected-config-id="selectedConfigId"
      :selected-count="selectedCount"
      :loading="loading"
      @view-changed="handleViewChange"
      @config-changed="handleConfigChange"
      @create-table="openTableBuilder"
      @refresh-configs="loadCustomConfigs"
    />

    <main class="max-w-full mx-auto px-6 py-6">
      <DataGrid
        :data="tableData"
        :loading="loading"
        :error="error"
        :show-selection="currentView === 'entities'"
        :current-sort="tableState.sort"
        :global-filter="tableState.filters.global"
        :column-filters="tableState.filters.columnFilters"
        :selected-rows="tableState.selectedRows"
        :pinned-columns="tableState.pinnedColumns"
        :pinned-row-ids="pinnedRowIds"
        :page-size="tableState.pageSize"
        @sort="handleSort"
        @page-changed="handlePageChange"
        @page-size-changed="handlePageSizeChange"
        @global-filter="handleGlobalFilter"
        @column-filter="handleColumnFilter"
        @row-selected="handleRowSelection"
        @toggle-all="handleToggleAll"
        @row-pinned="handleRowPin"
        @clear-pinned-rows="handleClearPinnedRows"
        @column-pinned="handleColumnPin"
        @retry="loadData"
      />
    </main>

    <TableBuilderModal
      :is-open="showTableBuilder"
      :selected-rows="selectedRowIds"
      :loading="creatingTable"
      @close="closeTableBuilder"
      @create="handleCreateTable"
      ref="tableBuilderModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import TopBar from './components/TopBar.vue';
import DataSetSwitcher from './components/DataSetSwitcher.vue';
import DataGrid from './components/DataGrid.vue';
import TableBuilderModal from './components/TableBuilderModal.vue';
import { apiService } from './services/api';
import { useTableState } from './composables/useTableState';
import type { CustomTableConfig, CreateTableRequest, FetchParams, PaginatedResponse } from './services/api';
import type { PinnedColumn } from './types';

// State management
const currentView = ref<'entities' | 'custom'>('entities');
const selectedConfigId = ref<number | null>(null);
const customConfigs = ref<CustomTableConfig[]>([]);
const tableData = ref<PaginatedResponse<any> | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const creatingTable = ref(false);
const showTableBuilder = ref(false);
const tableBuilderModal = ref<InstanceType<typeof TableBuilderModal>>();

// Use table state composable
const {
  state: tableState,
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
} = useTableState();

// Data loading
const loadData = async () => {
  if (loading.value) return;

  loading.value = true;
  error.value = null;

  try {
    const params: FetchParams = {
      page: tableState.page,
      page_size: tableState.pageSize,
      global: tableState.filters.global || undefined,
      filters: Object.keys(tableState.filters.columnFilters).length > 0 
        ? tableState.filters.columnFilters 
        : undefined,
    };

    // Add sorting if active
    if (tableState.sort.column && tableState.sort.direction) {
      params.sort_by = tableState.sort.column;
      params.sort_dir = tableState.sort.direction;
    }

    if (currentView.value === 'entities') {
      tableData.value = await apiService.fetchEntities(params);
    } else if (selectedConfigId.value) {
      tableData.value = await apiService.fetchCustomTable(selectedConfigId.value, params);
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error loading data:', err);
    
    // If sort failed, try again without sorting
    if (tableState.sort.column && err instanceof Error && err.message.includes('sort')) {
      resetSort();
      // Retry without sort
      setTimeout(() => loadData(), 100);
    }
  } finally {
    loading.value = false;
  }
};

const loadCustomConfigs = async () => {
  try {
    customConfigs.value = await apiService.getCustomTableConfigs();
  } catch (err) {
    console.error('Error loading custom configs:', err);
  }
};

// Event handlers
const handleViewChange = (view: 'entities' | 'custom') => {
  currentView.value = view;
  clearSelection();
  clearPinnedRows();
  resetFilters();
  resetSort();
  tableState.page = 1;
};

const handleConfigChange = (configId: number) => {
  selectedConfigId.value = configId;
  clearSelection();
  clearPinnedRows();
  resetFilters();
  resetSort();
  tableState.page = 1;
};

const handleSort = (column: string) => {
  setSort(column);
};

const handlePageChange = (page: number) => {
  tableState.page = page;
};

const handlePageSizeChange = (size: number) => {
  tableState.pageSize = size;
  tableState.page = 1; // Reset to first page
};

const handleGlobalFilter = (filter: string) => {
  tableState.filters.global = filter;
  tableState.page = 1; // Reset to first page when filtering
};

const handleColumnFilter = (column: string, filter: string) => {
  if (filter === '') {
    delete tableState.filters.columnFilters[column];
  } else {
    tableState.filters.columnFilters[column] = filter;
  }
  tableState.page = 1; // Reset to first page when filtering
};

const handleRowSelection = (rowId: string) => {
  toggleRowSelection(rowId);
};

const handleToggleAll = (allRowIds: string[]) => {
  toggleAllRows(allRowIds);
};

const handleRowPin = (rowId: string) => {
  toggleRowPin(rowId);
};

const handleClearPinnedRows = () => {
  clearPinnedRows();
};

const handleColumnPin = (column: string, side: 'left' | 'right') => {
  const existingIndex = tableState.pinnedColumns.findIndex(p => p.name === column);
  
  if (existingIndex !== -1) {
    // Remove existing pin
    tableState.pinnedColumns.splice(existingIndex, 1);
  } else {
    // Add new pin - calculate offset based on existing pinned columns
    let offset = 0;
    const sameSidePins = tableState.pinnedColumns.filter(p => p.side === side);
    
    if (side === 'left') {
      // Include selection column width if present
      offset = currentView.value === 'entities' ? 80 : 0;
      // Add widths of existing left-pinned columns
      offset += sameSidePins.length * 150; // Approximate column width
    } else {
      // Calculate from right edge
      offset = sameSidePins.length * 150;
    }

    const newPin: PinnedColumn = { name: column, side, offset };
    tableState.pinnedColumns.push(newPin);
  }
  
  // Recalculate offsets for all pinned columns
  recalculatePinnedOffsets();
};

const recalculatePinnedOffsets = () => {
  // Recalculate left pins
  const leftPins = tableState.pinnedColumns.filter(p => p.side === 'left');
  let leftOffset = currentView.value === 'entities' ? 80 : 0; // Selection column width
  
  leftPins.forEach((pin) => {
    pin.offset = leftOffset;
    leftOffset += 150; // Approximate column width
  });
  
  // Recalculate right pins
  const rightPins = tableState.pinnedColumns.filter(p => p.side === 'right');
  let rightOffset = 0;
  
  rightPins.forEach((pin) => {
    pin.offset = rightOffset;
    rightOffset += 150; // Approximate column width
  });
};

// Table builder
const openTableBuilder = () => {
  if (selectedCount.value === 0) return;
  showTableBuilder.value = true;
};

const closeTableBuilder = () => {
  showTableBuilder.value = false;
};

const handleCreateTable = async (request: CreateTableRequest) => {
  creatingTable.value = true;
  
  try {
    const response = await apiService.createCustomTable(request);
    
    // Show success modal
    tableBuilderModal.value?.showSuccessModal();
    
    // Refresh configs and switch to the new table
    await loadCustomConfigs();
    selectedConfigId.value = response.config_id;
    currentView.value = 'custom';
    
    // Clear selection since we've used it
    clearSelection();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create table';
    console.error('Error creating table:', err);
  } finally {
    creatingTable.value = false;
  }
};

// Watch for changes that require data reload
watch([currentView, selectedConfigId], () => {
  if (currentView.value === 'custom' && !selectedConfigId.value) {
    tableData.value = null;
    return;
  }
  loadData();
});

watch([
  () => tableState.page,
  () => tableState.pageSize,
  () => tableState.sort,
  () => tableState.filters.global,
  () => tableState.filters.columnFilters,
], () => {
  if (currentView.value === 'custom' && !selectedConfigId.value) {
    return;
  }
  loadData();
}, { deep: true });

// Initialize
onMounted(async () => {
  await loadCustomConfigs();
  loadData();
});
</script>