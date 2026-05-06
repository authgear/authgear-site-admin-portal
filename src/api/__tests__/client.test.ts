import authgear from "@authgear/web";
import { apiRequest, SiteAdminAPIError } from "../client";

jest.mock("@authgear/web");
jest.mock("../../config", () => ({
  SITEADMIN_API_URL: "https://api.example.com",
}));

const mockAuthgear = authgear as jest.Mocked<typeof authgear>;

describe("apiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should make a successful API request", async () => {
    const mockData = { id: "app1", name: "Test App" };
    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await apiRequest("/api/v1/apps/app1");

    expect(result).toEqual(mockData);
    expect(mockAuthgear.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/apps/app1",
      undefined
    );
  });

  it("should pass RequestInit options to fetch", async () => {
    const mockData = { success: true };
    const requestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    };

    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    await apiRequest("/api/v1/apps", requestInit);

    expect(mockAuthgear.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/apps",
      requestInit
    );
  });

  it("should throw SiteAdminAPIError on non-2xx response", async () => {
    const errorResponse = {
      error: {
        name: "AppNotFound",
        reason: "app_not_found",
        message: "The specified app does not exist.",
        code: 404,
        tracking_id: "track-123",
      },
    };

    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(errorResponse),
    });

    await expect(apiRequest("/api/v1/apps/nonexistent")).rejects.toThrow(
      SiteAdminAPIError
    );
  });

  it("should populate SiteAdminAPIError with correct details", async () => {
    const errorResponse = {
      error: {
        name: "UnauthorizedError",
        reason: "unauthorized",
        message: "You do not have permission.",
        code: 403,
        tracking_id: "track-456",
        info: { scope: "admin" },
      },
    };

    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(errorResponse),
    });

    try {
      await apiRequest("/api/v1/apps");
      fail("Should have thrown");
    } catch (e) {
      const error = e as SiteAdminAPIError;
      expect(error).toBeInstanceOf(SiteAdminAPIError);
      expect(error.errorName).toBe("UnauthorizedError");
      expect(error.reason).toBe("unauthorized");
      expect(error.message).toBe("You do not have permission.");
      expect(error.code).toBe(403);
      expect(error.trackingId).toBe("track-456");
      expect(error.info).toEqual({ scope: "admin" });
    }
  });

  it("should handle error response without optional fields", async () => {
    const errorResponse = {
      error: {
        name: "InternalError",
        reason: "internal_error",
        message: "An internal error occurred.",
        code: 500,
      },
    };

    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue(errorResponse),
    });

    try {
      await apiRequest("/api/v1/apps");
      fail("Should have thrown");
    } catch (e) {
      const error = e as SiteAdminAPIError;
      expect(error.trackingId).toBeUndefined();
      expect(error.info).toBeUndefined();
    }
  });

  it("should construct correct URL with path parameter", async () => {
    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await apiRequest("/api/v1/apps/my-app-id");

    expect(mockAuthgear.fetch as jest.Mock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/apps/my-app-id",
      undefined
    );
  });
});

describe("SiteAdminAPIError", () => {
  it("should extend Error class", () => {
    const error = new SiteAdminAPIError(
      "TestError",
      "test_error",
      400,
      "Test message"
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SiteAdminAPIError");
  });

  it("should store all properties", () => {
    const error = new SiteAdminAPIError(
      "AuthError",
      "auth_failed",
      401,
      "Auth failed",
      "track-789",
      { detail: "invalid_token" }
    );

    expect(error.errorName).toBe("AuthError");
    expect(error.reason).toBe("auth_failed");
    expect(error.code).toBe(401);
    expect(error.message).toBe("Auth failed");
    expect(error.trackingId).toBe("track-789");
    expect(error.info).toEqual({ detail: "invalid_token" });
  });
});
