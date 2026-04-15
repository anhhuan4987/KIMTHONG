export interface Product {
  name: string;
  price: number;
  quantity: number;
}

export type SessionType = '1h' | '5h' | '10h' | 'flexible';
export type SessionStatus = 'active' | 'completed';

export interface FishingSession {
  id?: string;
  customerName: string;
  phoneNumber?: string;
  numPeople: number;
  startTime: any; // Firestore Timestamp
  endTime?: any; // Firestore Timestamp
  sessionType: SessionType;
  status: SessionStatus;
  items: Product[];
  fishWeight?: number;
  fishPricePerKg?: number;
  hourlyRate: number;
  totalAmount?: number;
}

export interface Customer {
  id?: string;
  name: string;
  phoneNumber: string;
  totalSpent: number;
  visitCount: number;
}

export interface FishingPackage {
  id: string;
  name: string;
  duration: number; // in hours
  price: number;
  isFlexible?: boolean;
}

export interface AppSettings {
  packages: FishingPackage[];
  products: { id: string; name: string; price: number }[];
  fishBuybackPrice: number;
  hourlyRate: number;
}
