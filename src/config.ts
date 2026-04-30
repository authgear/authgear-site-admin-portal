type RuntimeConfig = {
  baseDomain: string;
  authgearEndpoint: string;
  authgearClientID: string;
  authgearRedirectURL: string;
  portalURL: string;
  siteadminAPIURL: string;
};

const firstNonEmpty = (...values: Array<string | undefined>): string | undefined =>
  values.find((value) => value != null && value !== "");

const runtimeConfig: RuntimeConfig | null = import.meta.env.DEV
  ? null
  : window.__config;

const baseDomain: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_BASE_DOMAIN : undefined,
    runtimeConfig?.baseDomain
  ) ?? "";

export const AUTHGEAR_ENDPOINT: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_AUTHGEAR_ENDPOINT : undefined,
    runtimeConfig?.authgearEndpoint
  ) ?? `https://accounts.portal.${baseDomain}`;

export const AUTHGEAR_CLIENT_ID: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_AUTHGEAR_CLIENT_ID : undefined,
    runtimeConfig?.authgearClientID
  ) ?? "siteadmin";

export const AUTHGEAR_REDIRECT_URL: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_AUTHGEAR_REDIRECT_URL : undefined,
    runtimeConfig?.authgearRedirectURL
  ) ?? `${window.location.origin}/auth-redirect`;

export const PORTAL_URL: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_PORTAL_URL : undefined,
    runtimeConfig?.portalURL
  ) ?? `portal.${baseDomain}`;

export const SITEADMIN_API_URL: string =
  firstNonEmpty(
    import.meta.env.DEV ? import.meta.env.VITE_SITEADMIN_API_URL : undefined,
    runtimeConfig?.siteadminAPIURL
  ) ?? `https://siteadmin.${baseDomain}`;

declare global {
  interface Window {
    __config: RuntimeConfig;
  }
}
