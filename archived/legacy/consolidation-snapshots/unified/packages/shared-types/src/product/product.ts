export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  stock: number
  images: string[]
  category: string
  brand: string
  createdAt: Date
}