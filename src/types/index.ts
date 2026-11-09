export interface ProductFilters {
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  categoryId?: number;
  sortBy?: "price" | "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
  size?: string;
}

export interface OrderShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

export type OrderPaymentMethod = "PIX" | "CREDIT_CARD";

export interface CreateOrder {
  userId?: number;
  items: CreateOrderItem[];
  shippingAddress: OrderShippingAddress;
  paymentMethod: OrderPaymentMethod;
}

export interface UpdateOrder {
  shippingAddress?: Partial<OrderShippingAddress>;
  paymentMethod?: OrderPaymentMethod;
}

export interface CreateCategory {
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface UpdateCategory {
  name?: string;
  slug?: string;
  description?: string;
  active?: boolean;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  firstName: string;
  lastName: string;
  cpf?: string;
  dateOfBirth?: string;
  phone?: string;
  role?: "USER" | "ADMIN";
}

export interface CreateProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  slug: string;
  sizes?: string[];
  colors?: string[];
  images?: string[];
}

export interface UpdateProduct extends Partial<CreateProduct> {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  active?: boolean;
  slug?: string;
  categoryId?: number;
}
