<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">Create Custom Table</h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <form @submit.prevent="submitForm" class="px-6 py-4 space-y-6">
        <!-- Table Name -->
        <div>
          <label for="tableName" class="block text-sm font-medium text-gray-700 mb-2">
            Table Name <span class="text-error-500">*</span>
          </label>
          <input
            id="tableName"
            v-model="formData.name"
            type="text"
            required
            class="input-field"
            placeholder="Enter table name..."
          >
        </div>

        <!-- Share With -->
        <div>
          <label for="shareWith" class="block text-sm font-medium text-gray-700 mb-2">
            Share with
          </label>
          <input
            id="shareWith"
            v-model="formData.sharedWith"
            type="text"
            class="input-field"
            placeholder="@team, user@example.com, etc."
          >
        </div>

        <!-- Selected Rows Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 class="font-medium text-blue-900 mb-2">Selected Entities</h3>
          <div class="text-sm text-blue-800">
            <p class="mb-2">{{ selectedRows.length }} entities selected</p>
            <div class="max-h-32 overflow-y-auto">
              <div v-for="rowId in selectedRows.slice(0, 5)" :key="rowId" class="font-mono text-xs">
                {{ rowId }}
              </div>
              <div v-if="selectedRows.length > 5" class="text-xs text-blue-600">
                ... and {{ selectedRows.length - 5 }} more
              </div>
            </div>
          </div>
        </div>

        <!-- Data Points Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Datapoints to Include <span class="text-error-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
            <label
              v-for="column in entityColumns"
              :key="column"
              class="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <input
                v-model="formData.datapoints"
                type="checkbox"
                :value="column"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              <span>{{ column }}</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Select at least one datapoint to include in your custom table
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="closeModal"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || loading"
            class="btn-primary"
          >
            <span v-if="loading">Creating...</span>
            <span v-else>Create Table</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Success Modal -->
  <div v-if="showSuccess" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="flex items-center justify-center mb-4">
        <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h3 class="text-lg font-medium text-gray-900 text-center mb-2">
        Table Created Successfully!
      </h3>
      <p class="text-sm text-gray-600 text-center mb-6">
        Your custom table "{{ createdTableName }}" has been created and is ready to use.
      </p>
      <div class="flex justify-center">
        <button @click="closeSuccessModal" class="btn-primary">
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { CreateTableRequest } from '../services/api';

const props = defineProps<{
  isOpen: boolean;
  selectedRows: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  'close': [];
  'create': [request: CreateTableRequest];
}>();

const entityColumns = [
  'Registration ID', 'Legal Name', 'Status', 'Address', 'Last Scan',
  'Type Of Capital', 'Share Capital', 'Denomination', 'Contribution Type',
  'Contribution Percentage', 'Incorporation Date', 'Duration',
  'Duration End Date', 'First Financial Period From', 'First Financial Period To',
  'Fiscal Year From', 'Fiscal Year To', 'Liquidation Decision Date',
  'Liquidator General Powers', 'Declared Email'
];

const formData = ref<{
  name: string;
  sharedWith: string;
  datapoints: string[];
}>({
  name: '',
  sharedWith: '',
  datapoints: ['Registration ID', 'Legal Name', 'Status', 'Address'] // Default selection
});

const showSuccess = ref(false);
const createdTableName = ref('');

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.datapoints.length > 0;
});

const closeModal = () => {
  formData.value = {
    name: '',
    sharedWith: '',
    datapoints: ['Registration ID', 'Legal Name', 'Status', 'Address']
  };
  emit('close');
};

const submitForm = () => {
  if (!isFormValid.value) return;

  const request: CreateTableRequest = {
    name: formData.value.name,
    src_table: 'entities',
    rows: props.selectedRows,
    datapoints: formData.value.datapoints,
    columns: [
      { name: 'Column ID', type: 'Linked by default' }
    ],
    sharedWith: formData.value.sharedWith || ''
  };

  createdTableName.value = formData.value.name;
  emit('create', request);
};

const closeSuccessModal = () => {
  showSuccess.value = false;
  closeModal();
};

// Watch for successful creation
const showSuccessModal = () => {
  showSuccess.value = true;
};

defineExpose({
  showSuccessModal
});
</script>