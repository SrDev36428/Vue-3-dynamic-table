const API_BASE = 'https://srv03.nopcoders.com';

export interface Entity {
  [key: string]: any;
  'Registration ID': string;
  'Legal Name': string;
  'Status': string;
  'Address': string;
  'Last Scan': string;
}

export interface CustomTableConfig {
  id: number;
  user_id: number;
  name: string;
  internal_table: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
  columns?: string[];
}

export interface ApiFilters {
  [key: string]: string;
}

export interface FetchParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  global?: string;
  filters?: ApiFilters;
}

export interface CreateTableRequest {
  name: string;
  src_table: string;
  rows: string[];
  datapoints: string[];
  columns: Array<{ name: string; type: string }>;
  sharedWith: string;
}

export interface CreateTableResponse {
  config_id: number;
  name: string;
  debug_internal_table: string;
}

class ApiService {
  private async fetchWithParams(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${API_BASE}${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'filters' && typeof value === 'object') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue) {
              url.searchParams.append(`filters[${filterKey}]`, filterValue as string);
            }
          });
        } else {
          url.searchParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCustomTableConfigs(): Promise<CustomTableConfig[]> {
    return this.fetchWithParams('/dtables/list');
  }

  async fetchCustomTable(configId: number, params: FetchParams = {}): Promise<PaginatedResponse<any>> {
    return this.fetchWithParams('/dtables/fetch', {
      config_id: configId,
      ...params,
    });
  }

  async fetchEntities(params: FetchParams = {}): Promise<PaginatedResponse<Entity>> {
    return this.fetchWithParams('/entities', params);
  }

  async createCustomTable(data: CreateTableRequest): Promise<CreateTableResponse> {
    const response = await fetch(`${API_BASE}/dtables/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create custom table: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();