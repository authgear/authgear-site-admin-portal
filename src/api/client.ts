/**
 * Base HTTP client for the Site Admin API.
 *
 * Uses `authgear.fetch()` which automatically injects the Bearer access token
 * from the current Authgear session — no manual token handling required.
 */
import authgear from "@authgear/web";
import type { ErrorEnvelope } from "./types";
import { SITEADMIN_API_URL } from "../config";

const BASE_URL: string = SITEADMIN_API_URL;

export class SiteAdminAPIError extends Error {
  constructor(
    public readonly errorName: string,
    public readonly reason: string,
    public readonly code: number,
    message: string,
    public readonly trackingId?: string,
    public readonly info?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SiteAdminAPIError";
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await authgear.fetch(url, init);

  if (!response.ok) {
    const envelope: ErrorEnvelope = await response.json();
    const { name, reason, message, code, tracking_id, info } = envelope.error;
    throw new SiteAdminAPIError(name, reason, code, message, tracking_id, info);
  }

  return response.json() as Promise<T>;
}
