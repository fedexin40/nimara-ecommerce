import { type Metadata } from "./Metadata";

export interface User {
  checkoutIds: string[];
  city?: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  metadata: Metadata;
  phone?: string;
  postalCode?: string;
  state?: string;
}

export interface RefreshToken {
  refreshToken: string;
}
