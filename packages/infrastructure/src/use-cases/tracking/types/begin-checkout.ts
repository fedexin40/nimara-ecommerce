import type { Checkout } from "@nimara/domain/objects/Checkout";
import type { User } from "@nimara/domain/objects/User";

import type { TrackingProvider } from "./provider";

export type TrackBeginCheckoutInput = {
  checkout: Checkout;
  user?: User | null;
};

export type TrackBeginCheckoutProvider =
  TrackingProvider<TrackBeginCheckoutInput>;
