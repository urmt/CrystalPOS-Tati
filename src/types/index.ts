// =============================================================================
// MARKETPOS TYPES
// Version: 2.0
// Date: May 2026
// =============================================================================

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'vendor_manager';
  full_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  display_order: number;
  is_active: boolean;
  subcategory_ids: string[]; // Array of subcategory IDs that apply to this category
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  name_es: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  description_es: string | null;
  pricing_type: 'per_gram' | 'fixed';
  price_crc: number;
  fixed_price_crc: number;
  current_weight_grams: number;
  min_threshold_grams: number;
  depletion_rate_grams_per_day: number;
  image_url: string | null;
  cost_per_gram: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_sold_at: string | null;
}

export interface CartItem {
  item: Item;
  quantity: number;
  subtotal: number;
  itemDiscount: number;
  manualPrice: number | null;
}

export interface Sale {
  id: string;
  sale_date: string;
  items_sold: { item_id: string; sku: string; name: string; qty_grams: number; price: number }[] | null;
  subtotal_crc: number;
  discount_crc: number;
  tax_crc: number;
  total_crc: number;
  payment_method: string | null;
  payment_status: string;
  lightning_invoice_id: string | null;
  notes: string | null;
  receipt_sent: boolean;
  receipt_email: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  device_id: string | null;
  created_by_user_id: string | null;
  created_at: string;
  synced_at: string | null;
  server_created_at: string;
  last_modified_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: object | null;
  new_values: object | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Todo {
  id: string;
  request_text: string;
  customer_name: string | null;
  customer_phone: string | null;
  created_by: string;
  status: string;
  folder: string;
  image_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Customer {
  id: string;
  phone: string;
  country_code: string;
  name: string | null;
  total_purchases: number;
  purchase_count: number;
  last_purchase: string | null;
  special_requests: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  setting_key: string;
  setting_value: {
    business_name?: string;
    business_name_size?: string;
    business_tagline?: string;
    business_email?: string;
    business_phone?: string;
    address?: string;
    cash_enabled?: boolean;
    sinpe_enabled?: boolean;
    card_enabled?: boolean;
    lightning_enabled?: boolean;
  };
  updated_at: string;
}

export interface DeviceRegistration {
  id: string;
  device_id: string;
  device_name: string;
  is_blocked: boolean;
  created_at: string;
}