export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  sale: boolean;
  stock: number;
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
}
