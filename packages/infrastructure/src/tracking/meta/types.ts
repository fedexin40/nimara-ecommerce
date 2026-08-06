export type MetaStandardEventName =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Search"
  | "CompleteRegistration";

export type MetaEventParameters = {
  currency?: string;
  value?: number;
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  contents?: Array<{
    id: string;
    quantity?: number;
    item_price?: number;
  }>;
  search_string?: string;
  coupon?: string;
  order_id?: string;
  num_items?: number;
  shipping?: number;
  tax?: number;
  payment_type?: string;
  registration_method?: string;
  number_of_results?: number;
};

export type MetaCapiCustomerData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type MetaTrackingEvent = {
  eventName: MetaStandardEventName;
  eventId: string;
  eventSourceUrl?: string;
  parameters?: MetaEventParameters;
  customer?: MetaCapiCustomerData;
};

declare global {
  interface Window {
    fbq?: {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      push?: (...args: unknown[]) => void;
      loaded?: boolean;
      version?: string;
    };

    _fbq?: Window["fbq"];
  }
}

export {};
