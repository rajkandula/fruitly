export type Role = "customer" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  email_verified: number;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface Category {
  id: number; slug: string; name: string; description: string; emoji: string; sort_order: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  unit: string;
  stock: number;
  image_url: string;
  emoji: string;
  badge: string | null;
  origin: string | null;
  nutrition: string | null;
  is_featured: number;
  is_active: number;
  availability: Availability;
  created_at: string;
  updated_at: string;
}

/** Availability shown to customers in made-to-order mode. */
export type Availability = "available" | "limited" | "seasonal" | "unavailable";

/** Product plus internal sourcing fields — admin only, never returned by public endpoints. */
export interface AdminProduct extends Product {
  cost_cents: number | null;
  source_store: string | null;
  availability: Availability;
}

export interface Address {
  id: number; user_id: number; label: string; full_name: string; line1: string; line2: string | null;
  city: string; state: string; postal_code: string; country: string; phone: string | null; is_default: number; created_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "card" | "cod";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface Order {
  id: number; order_number: string; user_id: number | null; email: string; status: OrderStatus;
  payment_method: PaymentMethod; payment_status: PaymentStatus; payment_provider: string | null;
  payment_session_id: string | null; payment_url: string | null; payment_verified: number;
  subtotal_cents: number; shipping_cents: number; tax_cents: number; discount_cents: number; total_cents: number;
  currency: string; coupon_code: string | null;
  shipping_name: string; shipping_line1: string; shipping_line2: string | null; shipping_city: string; shipping_state: string;
  shipping_postal_code: string; shipping_country: string; shipping_phone: string | null; notes: string | null;
  paid_at: string | null; created_at: string; updated_at: string;
  fulfillment_method: "delivery" | "pickup"; delivery_slot: string | null;
  substitution_pref: "substitute" | "refund" | "contact"; service_fee_cents: number;
}

export interface OrderItem {
  id: number; order_id: number; product_id: number | null; name: string; unit: string; unit_price_cents: number;
  quantity: number; line_total_cents: number; image_url: string; emoji: string;
}

export interface OrderEvent { id: number; order_id: number; status: string; note: string | null; created_at: string }

export interface CartLine { productId: number; slug: string; name: string; unit: string; priceCents: number; imageUrl: string; emoji: string; quantity: number; stock: number }
