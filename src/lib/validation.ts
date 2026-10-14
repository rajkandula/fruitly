import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);
export const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
export const nameSchema = z.string().trim().min(2, "Enter your name").max(80);

export const signupSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password").max(128) });
export const verifyEmailSchema = z.object({ email: emailSchema, code: otpSchema });
export const otpRequestSchema = z.object({ email: emailSchema, purpose: z.enum(["verify_email", "login", "reset_password"]) });
export const otpLoginSchema = z.object({ email: emailSchema, code: otpSchema });
export const resetPasswordSchema = z.object({ email: emailSchema, code: otpSchema, password: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });
export const profileSchema = z.object({ name: nameSchema, phone: z.string().trim().max(30).optional().nullable() });

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional().default("Home"),
  full_name: z.string().trim().min(2, "Enter the recipient name").max(80),
  line1: z.string().trim().min(3, "Enter a street address").max(120),
  line2: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().min(1, "Enter a city").max(80),
  state: z.string().trim().max(80).optional().default(""),
  postal_code: z.string().trim().min(3, "Enter a postal code").max(20),
  country: z.string().trim().min(2).max(2).toUpperCase().optional().default("US"),
  phone: z.string().trim().max(30).optional().nullable(),
  is_default: z.boolean().optional(),
});

export const cartItemSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(99) });
export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  fulfillment: z.enum(["delivery", "pickup"]).optional().default("delivery"),
  slot: z.string().trim().max(40).optional().nullable(),
  contactName: z.string().trim().min(2).max(80).optional(),
  contactPhone: z.string().trim().max(30).optional().nullable(),
  substitutionPref: z.enum(["substitute", "refund", "contact"]).optional().default("contact"),
  addressId: z.number().int().positive().optional(),
  address: addressSchema.optional(),
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(["card", "cod"]),
  couponCode: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});
export const couponCheckSchema = z.object({ code: z.string().trim().min(1).max(40), subtotalCents: z.number().int().nonnegative() });

export const productUnit = z.enum(["each", "kg", "lb", "pack", "box", "bunch", "basket"]);
export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only").max(80).optional(),
  description: z.string().trim().max(4000).optional().default(""),
  category_id: z.number().int().positive().nullable().optional(),
  price_cents: z.number().int().nonnegative(),
  compare_at_cents: z.number().int().nonnegative().nullable().optional(),
  unit: productUnit.optional().default("each"),
  stock: z.number().int().nonnegative().optional().default(0),
  image_url: z.string().trim().max(1000).optional().default(""),
  emoji: z.string().trim().max(8).optional().default(""),
  badge: z.string().trim().max(30).nullable().optional(),
  origin: z.string().trim().max(80).nullable().optional(),
  nutrition: z.string().trim().max(2000).nullable().optional(),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  // Internal sourcing — admin only, never shown to customers.
  cost_cents: z.number().int().nonnegative().nullable().optional(),
  source_store: z.string().trim().max(60).nullable().optional(),
  availability: z.enum(["available", "limited", "seasonal", "unavailable"]).optional(),
});
export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "failed", "refunded"]).optional(),
  note: z.string().trim().max(500).optional().nullable(),
  notify: z.boolean().optional().default(true),
});
export const newsletterSchema = z.object({ email: emailSchema });
