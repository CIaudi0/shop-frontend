export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  sale: boolean;
  thumbnail?: string;
  tags?: string[];
  createdAt: string;
}