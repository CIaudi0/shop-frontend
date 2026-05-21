import { CartItem } from '../services/cart';

export interface Order {
  customer: any;
  address: any;
  items: CartItem[];
  total: number;
  createdAt: string;
}