export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  videoUrl?: string;
  description:string;
  category: string;
  stock: number;
  status: 'active' | 'archived' | 'deleted';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  password: string; // NOTE: In a real app, this should be a securely stored hash
  firstName: string;
  lastName: string;
  role: string | 'admin' | 'user';
}

export interface Order {
  id: string;
  _id?: string;
  customer: {
    firstName: string;
    lastName:string;
    phone: string;
    address: string;
    email?: string;
  };
  items: CartItem[];
  total: number;
  userId: string | null;
  status: string;
  date: string;
  handledBy?: string;
  handledByName?: string;
}

export interface LoginResponse {
  token: string; // The JWT token
  user: User; // The logged-in user object
}

export interface Reservation {
  id?: string;
  productId: string;
  userId?: string;
  guestEmail?: string;
  notificationMethod?: 'whatsapp' | 'email';
  createdAt?: string;
  date?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  date: string;
  productId: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
