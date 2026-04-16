// =============================================================================
// ADMIN PORTAL TYPES
// Version: 1.0
// Date: April 15, 2026
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
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  subcategory_id: string | null;
  description: string | null;
  price_crc: number;
  current_weight_grams: number;
  min_threshold_grams: number;
  depletion_rate_grams_per_day: number;
  image_url: string | null;
  cost_per_gram: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Sale {
  id: string;
  sale_date: string;
  items_sold: { item_id: string; sku: string; name: string; qty_grams: number; price: number }[] | null;
  subtotal_crc: number;
  tax_crc: number;
  total_crc: number;
  payment_method: string | null;
  payment_status: string;
  lightning_invoice_id: string | null;
  notes: string | null;
  receipt_sent: boolean;
  receipt_email: string | null;
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