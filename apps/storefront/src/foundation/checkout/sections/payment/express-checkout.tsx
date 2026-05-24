"use client";

import { type SVGProps } from "react";

import { Button } from "@nimara/ui/components/button";
import { cn } from "@nimara/ui/lib/utils";

/**
 * Apple Pay mark icon.
 * Official Apple Pay brand asset.
 */
function ApplePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="24 26 122 56" fill="currentColor" {...props}>
      {/* Apple logo */}
      <path d="M45.19,35.64c1.42-1.77,2.38-4.15,2.13-6.59c-2.07.1-4.61,1.37-6.07,3.14c-1.32,1.52-2.48,4-2.18,6.33c2.33.2,4.66-1.17,6.12-2.88" />
      <path d="M47.29,38.98c-3.38-.2-6.26,1.92-7.87,1.92c-1.62,0-4.09-1.82-6.76-1.77c-3.48.05-6.71,2.02-8.48,5.15c-3.63,6.26-.96,15.55,2.57,20.66c1.72,2.52,3.78,5.3,6.51,5.2c2.57-.1,3.58-1.67,6.71-1.67c3.13,0,4.04,1.67,6.76,1.62c2.83-.05,4.59-2.53,6.31-5.05c1.97-2.88,2.77-5.65,2.83-5.81c-.05-.05-5.45-2.12-5.5-8.33c-.05-5.2,4.24-7.67,4.44-7.83c-2.44-3.6-6.22-4-7.54-4.1" />
      {/* "Pay" text */}
      <path d="M76.73,31.94c7.35,0,12.47,5.07,12.47,12.44c0,7.4-5.22,12.5-12.65,12.5h-8.14v12.94h-5.88V31.94h14.2zm-8.32,20h6.75c5.12,0,8.03-2.76,8.03-7.53c0-4.78-2.91-7.51-8.01-7.51h-6.77v15.04z" />
      <path d="M90.74,61.98c0-4.83,3.7-7.8,10.27-8.17l7.56-.45v-2.13c0-3.07-2.07-4.91-5.54-4.91c-3.28,0-5.33,1.57-5.83,4.04h-5.36c.31-4.99,4.57-8.66,11.39-8.66c6.69,0,10.97,3.54,10.97,9.08v19.03h-5.43v-4.54h-.13c-1.6,3.07-5.09,5.01-8.72,5.01c-5.41,0-9.19-3.36-9.19-8.33zm17.83-2.49v-2.18l-6.8.42c-3.39.24-5.3,1.73-5.3,4.1c0,2.41,2,3.99,5.04,3.99c3.96,0,7.06-2.73,7.06-6.33z" />
      <path d="M119.34,79.99v-4.59c.42.1,1.36.1,1.84.1c2.63,0,4.04-1.1,4.91-3.94c0-.05.5-1.68.5-1.71l-9.98-27.65h6.14l6.98,22.47h.1l6.98-22.47h5.99l-10.34,29.06c-2.36,6.7-5.09,8.85-10.82,8.85c-.47,0-1.89-.05-2.31-.13z" />
    </svg>
  );
}

function GooglePayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="280 280 535 230" fill="none" {...props}>
      {/* G Mark */}
      <path
        fill="#4285F4"
        d="M452.93,372c0-6.26-0.56-12.25-1.6-18.01h-80.48v33L417.2,387c-1.88,10.98-7.93,20.34-17.2,26.58v21.41h27.59C443.7,420.08,452.93,398.04,452.93,372z"
      />
      <path
        fill="#34A853"
        d="M400.01,413.58c-7.68,5.18-17.57,8.21-29.14,8.21c-22.35,0-41.31-15.06-48.1-35.36h-28.46v22.08c14.1,27.98,43.08,47.18,76.56,47.18c23.14,0,42.58-7.61,56.73-20.71L400.01,413.58z"
      />
      <path
        fill="#FABB05"
        d="M320.09,370.05c0-5.7,0.95-11.21,2.68-16.39v-22.08h-28.46c-5.83,11.57-9.11,24.63-9.11,38.47s3.29,26.9,9.11,38.47l28.46-22.08C321.04,381.26,320.09,375.75,320.09,370.05z"
      />
      <path
        fill="#E94235"
        d="M370.87,318.3c12.63,0,23.94,4.35,32.87,12.85l24.45-24.43c-14.85-13.83-34.21-22.32-57.32-22.32c-33.47,0-62.46,19.2-76.56,47.18l28.46,22.08C329.56,333.36,348.52,318.3,370.87,318.3z"
      />
      {/* Pay Typeface */}
      <path
        fill="#3C4043"
        d="M529.3,384.2v60.5h-19.2V295.3H561c12.9,0,23.9,4.3,32.9,12.9c9.2,8.6,13.8,19.1,13.8,31.5c0,12.7-4.6,23.2-13.8,31.7c-8.9,8.5-19.9,12.7-32.9,12.7h-31.7V384.2z M529.3,313.7v52.1h32.1c7.6,0,14-2.6,19-7.7c5.1-5.1,7.7-11.3,7.7-18.3c0-6.9-2.6-13-7.7-18.1c-5-5.3-11.3-7.9-19-7.9h-32.1V313.7z"
      />
      <path
        fill="#3C4043"
        d="M657.9,339.1c14.2,0,25.4,3.8,33.6,11.4c8.2,7.6,12.3,18,12.3,31.2v63h-18.3v-14.2h-0.8c-7.9,11.7-18.5,17.5-31.7,17.5c-11.3,0-20.7-3.3-28.3-10s-11.4-15-11.4-25c0-10.6,4-19,12-25.2c8-6.3,18.7-9.4,32-9.4c11.4,0,20.8,2.1,28.1,6.3v-4.4c0-6.7-2.6-12.3-7.9-17c-5.3-4.7-11.5-7-18.6-7c-10.7,0-19.2,4.5-25.4,13.6l-16.9-10.6C625.9,345.8,639.7,339.1,657.9,339.1z M633.1,413.3c0,5,2.1,9.2,6.4,12.5c4.2,3.3,9.2,5,14.9,5c8.1,0,15.3-3,21.6-9s9.5-13,9.5-21.1c-6-4.7-14.3-7.1-25-7.1c-7.8,0-14.3,1.9-19.5,5.6C635.7,403.1,633.1,407.8,633.1,413.3z"
      />
      <path
        fill="#3C4043"
        d="M808.2,342.4l-64,147.2h-19.8l23.8-51.5L706,342.4h20.9l30.4,73.4h0.4l29.6-73.4H808.2z"
      />
    </svg>
  );
}

interface ExpressCheckoutProps {
  /** Custom class name */
  className?: string;
  /** Callback when Apple Pay is clicked */
  onApplePay?: () => void;
  /** Callback when Google Pay is clicked */
  onGooglePay?: () => void;
}

/**
 * Express checkout section with Apple Pay and Google Pay buttons.
 *
 * Currently decorative - signals that express checkout is possible.
 * Future implementation would use Stripe's PaymentRequestButton or
 * ExpressCheckoutElement to handle actual wallet payments.
 */
export function ExpressCheckout({
  onApplePay,
  onGooglePay,
  className,
}: ExpressCheckoutProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Top divider with label */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 font-medium text-muted-foreground">
            Express checkout
          </span>
        </div>
      </div>

      {/* Payment buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Apple Pay - Black button with white logo */}
        <Button
          variant="outline"
          onClick={onApplePay}
          className="h-12 border-black bg-black text-white hover:bg-black/90 focus-visible:ring-offset-0"
          aria-label="Pay with Apple Pay"
        >
          <ApplePayIcon className="h-5 w-auto" />
        </Button>

        {/* Google Pay - White button with colored logo */}
        <Button
          variant="outline"
          onClick={onGooglePay}
          className="h-12 border border-neutral-300 bg-white hover:bg-neutral-50"
          aria-label="Pay with Google Pay"
        >
          <GooglePayIcon className="h-5 w-auto" />
        </Button>
      </div>

      {/* Bottom divider with label */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-4 font-medium text-muted-foreground">
            Or continue below
          </span>
        </div>
      </div>
    </div>
  );
}
