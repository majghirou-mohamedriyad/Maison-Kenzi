export type Gender = "Homme" | "Femme" | "Mixte";
export type OrderStatus = "en_attente" | "confirmee" | "livree" | "annulee";
export type Size = "5ml" | "10ml" | "full";
export type StockStatus = "actif" | "rupture";
export type SaleMode = "decant" | "full_bottle";

export type CollectionCategory = 'homme' | 'femme' | 'deodorants-stick' | 'packs';

export type Parfum = {
  id: string;
  name: string;
  maison: string;
  gender: Gender;
  category?: CollectionCategory;
  description: string;
  notes_tete: string[];
  notes_coeur: string[];
  notes_fond: string[];
  price_5ml: number;
  price_10ml: number;
  image_label: string;
  image_url: string | null;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  stock_status: StockStatus;
  // Full bottle mode / single item mode
  sale_mode?: SaleMode;
  full_bottle_volume_ml?: number | null;
  full_bottle_price?: number | null;
  full_bottle_stock?: number | null;
  full_bottle_limited?: boolean | null;
  stock_5ml?: number;
  stock_10ml?: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  parfum_id?: string;
  parfum_name?: string;
  name?: string;
  maison?: string;
  size?: Size | string;
  quantity: number;
  unit_price?: number;
  price?: number;
  subtotal?: number;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};
