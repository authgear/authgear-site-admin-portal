/**
 * Resolved runtime configuration.
 *
 * Set VITE_BASE_DOMAIN (e.g. authgear-staging.com) and the three service URLs
 * are derived automatically:
 *   endpoint  → https://accounts.portal.<base>
 *   portalUrl → portal.<base>
 *   apiUrl    → https://siteadmin.<base>
 *
 * Any of the three can be overridden individually via their own VITE_* var.
 */

const base: string = import.meta.env.VITE_BASE_DOMAIN ?? "";

export const AUTHGEAR_ENDPOINT: string =
  import.meta.env.VITE_AUTHGEAR_ENDPOINT ?? `https://accounts.portal.${base}`;

export const AUTHGEAR_CLIENT_ID: string =
  import.meta.env.VITE_AUTHGEAR_CLIENT_ID ?? "siteadmin";

export const AUTHGEAR_REDIRECT_URL: string =
  import.meta.env.VITE_AUTHGEAR_REDIRECT_URL ?? `${window.location.origin}/auth-redirect`;

export const PORTAL_URL: string =
  import.meta.env.VITE_PORTAL_URL ?? `portal.${base}`;

export const SITEADMIN_API_URL: string =
  import.meta.env.VITE_SITEADMIN_API_URL ?? `https://siteadmin.${base}`;
