import { api } from "./api";
import type { CartItem, Coupon, PayoutMethod } from "../types";

export type PayableType = "certificate" | "course" | "book" | "project";

export async function fetchStripeConfig() {
  const { data } = await api.get("/payments/config");
  return data as { mock: boolean; publishable_key: string | null };
}

export async function createIntent(type: PayableType, refId: string, couponCode?: string) {
  const { data } = await api.post("/payments/create-intent", {
    type,
    ref_id: refId,
    coupon_code: couponCode,
  });
  return data as { payment_id: string; client_secret: string; amount: number; currency: string; mock: boolean };
}

export async function confirmPayment(paymentId: string) {
  const { data } = await api.post("/payments/confirm", { payment_id: paymentId });
  return data;
}

export async function fetchMyPayments() {
  const { data } = await api.get("/payments/me");
  return data;
}

export async function fetchCart() {
  const { data } = await api.get("/payments/cart");
  return data as { items: CartItem[]; total: number };
}
export async function addToCart(itemType: string, itemId: string) {
  await api.post("/payments/cart", { item_type: itemType, item_id: itemId });
}
export async function removeFromCart(itemId: string) {
  await api.delete(`/payments/cart/${itemId}`);
}
export async function checkoutCart(couponCode?: string) {
  const { data } = await api.post("/payments/cart-checkout", { coupon_code: couponCode });
  return data as { payment_ids: string[]; client_secret: string; amount: number; mock: boolean };
}
export async function confirmCart(paymentIds: string[]) {
  const { data } = await api.post("/payments/cart-confirm", { payment_ids: paymentIds });
  return data;
}

export async function fetchWishlist() {
  const { data } = await api.get("/payments/wishlist");
  return data;
}
export async function addToWishlist(itemType: string, itemId: string) {
  await api.post("/payments/wishlist", { item_type: itemType, item_id: itemId });
}
export async function removeFromWishlist(itemId: string) {
  await api.delete(`/payments/wishlist/${itemId}`);
}

// ---- Admin ----
export async function fetchPayoutMethods() {
  const { data } = await api.get("/payments/payout-methods");
  return data as PayoutMethod[];
}
export async function createPayoutMethod(payload: Partial<PayoutMethod>) {
  const { data } = await api.post("/payments/payout-methods", payload);
  return data as PayoutMethod;
}
export async function updatePayoutMethod(id: string, payload: Partial<PayoutMethod>) {
  const { data } = await api.put(`/payments/payout-methods/${id}`, payload);
  return data as PayoutMethod;
}
export async function deletePayoutMethod(id: string) {
  await api.delete(`/payments/payout-methods/${id}`);
}

export async function fetchCoupons() {
  const { data } = await api.get("/payments/coupons");
  return data as Coupon[];
}
export async function createCoupon(payload: Partial<Coupon>) {
  const { data } = await api.post("/payments/coupons", payload);
  return data as Coupon;
}
export async function updateCoupon(id: string, payload: Partial<Coupon>) {
  const { data } = await api.put(`/payments/coupons/${id}`, payload);
  return data as Coupon;
}
export async function deleteCoupon(id: string) {
  await api.delete(`/payments/coupons/${id}`);
}
