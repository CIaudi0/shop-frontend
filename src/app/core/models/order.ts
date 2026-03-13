import { Product } from './product';

export interface Order {
  customer: any;
  address: any;
  items: Product[];
  total: number;
  createdAt: string;
}