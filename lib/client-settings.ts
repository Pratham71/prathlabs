import type { Settings } from "@/lib/settings";

// The admin settings, as the layout inlined them into the page (window.__site). Browser only.
declare global {
  interface Window {
    __site?: Settings;
  }
}

export const clientSettings = (): Partial<Settings> => (typeof window === "undefined" ? {} : (window.__site ?? {}));
