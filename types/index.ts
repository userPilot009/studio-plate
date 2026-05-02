export interface FormData {
  restaurantName: string;
  location: string;
  cuisine: string;
  goal: string;
  vibeWords: string[];
  pricePoint: string;
  targetCustomer: string;
  dish1: string;
  dish2: string;
  dish3: string;
  differentFrom: string;
  hours: string;
  phone: string;
  address: string;
  palette: string;
  specialRequests: string;
}

export type Tier = "signature" | "triple";

export interface Generation {
  id: string;
  form_data: FormData;
  html: string[];
  tier: Tier | null;
  email: string | null;
  paid: boolean;
  download_token: string | null;
  download_token_expires_at: string | null;
  download_count: number;
  confirmation_email_sent_at: string | null;
  created_at: string;
}
