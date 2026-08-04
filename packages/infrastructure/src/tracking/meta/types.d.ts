export {};

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
