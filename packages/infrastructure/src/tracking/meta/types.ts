export type MetaStandardEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Search"
  | "CompleteRegistration";

export type MetaEventParameters = {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{
    id: string;
    item_price?: number;
    quantity?: number;
  }>;
  coupon?: string;
  currency?: string;
  num_items?: number;
  number_of_results?: number;
  order_id?: string;
  payment_type?: string;
  registration_method?: string;
  search_string?: string;
  shipping?: number;
  tax?: number;
  value?: number;
};

export type MetaCapiCustomerData = {
  city?: string;
  country?: string;
  email?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  postalCode?: string;
  state?: string;
};

export type MetaTrackingEvent = {
  customer?: MetaCapiCustomerData;
  eventId: string;
  eventName: MetaStandardEventName;
  eventSourceUrl?: string;
  parameters?: MetaEventParameters;
};

declare global {
  interface Window {
    _fbq?: Window["fbq"];

    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      loaded?: boolean;
      push?: (...args: unknown[]) => void;
      queue?: unknown[];
      version?: string;
    };
  }
}

export {};
