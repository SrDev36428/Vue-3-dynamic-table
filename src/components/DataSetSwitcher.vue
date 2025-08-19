<template>
  <div class="bg-white border-b border-gray-200 px-6 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <!-- View Toggle -->
        <div class="flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-l-md border transition-colors',
              currentView === 'entities'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
            @click="$emit('view-changed', 'entities')"
          >
            Entities
          </button>
          <button
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border transition-colors',
              currentView === 'custom'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
            @click="$emit('view-changed', 'custom')"
          >
            Custom Table
          </button>
        </div>

        <!-- Custom Table Selector -->
        <div v-if="currentView === 'custom'" class="flex items-center space-x-3">
          <select
            :value="selectedConfigId"
            @change="$emit('config-changed', parseInt(($event.target as HTMLSelectElement).value))"
            class="input-field w-64"
            :disabled="loading"
          >
            <option value="">Select a custom table...</option>
            <option 
              v-for="config in customConfigs" 
              :key="config.id" 
              :value="config.id"
            >
              {{ config.name }}
            </option>
          </select>          
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-3">
        <div v-if="currentView === 'entities' && selectedCount > 0" class="text-sm text-gray-600">
          {{ selectedCount }} selected
        </div>
        
        <button
          v-if="currentView === 'entities'"
          @click="$emit('create-table')"
          :disabled="selectedCount === 0"
          class="btn-primary"
        >
          Create Custom Table
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CustomTableConfig } from '../services/api';

defineProps<{
  currentView: 'entities' | 'custom';
  customConfigs: CustomTableConfig[];
  selectedConfigId: number | null;
  selectedCount: number;
  loading: boolean;
}>();

defineEmits<{
  'view-changed': [view: 'entities' | 'custom'];
  'config-changed': [configId: number];
  'create-table': [];
  'refresh-configs': [];
}>();

</script>