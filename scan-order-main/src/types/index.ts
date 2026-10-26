export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: CategoryId;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  isBestseller?: boolean;
  spiceLevel?: 0 | 1 | 2 | 3;
}

export interface HotelTable {
  id: string;
  number: number;
  label: string;
  seats: number;
  area: string;
  isActive?: boolean;
}

export interface CartLine {
  itemId: string;
  quantity: number;
}

export type OrderStatus = "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";

export type PaymentMethod = "upi" | "card" | "counter";
export type PaymentStatus = "paid" | "unpaid";

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

export interface Order {
  id: string;
  tableId: string;
  tableLabel: string;
  customerName: string;
  phone?: string | undefined;
  instructions?: string | undefined;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef?: string | undefined;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
}

export interface HotelInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  /** GST percentage applied on the subtotal, e.g. 5 for 5%. */
  taxPercent: number;
  /** Optional base URL printed inside table QR codes (e.g. http://192.168.1.20:8080). Empty = current site. */
  qrBaseUrl: string;
}
