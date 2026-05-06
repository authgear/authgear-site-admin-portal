---
name: write-api-tests
description: Write unit tests for API integration code. Required for all changes to src/api/
---

# Write Unit Tests for API Integration Code

## Requirement

**All changes to `src/api/` MUST include unit tests.** This is mandatory, not optional.

When you add or modify API integration code (functions in `src/api/siteadmin.ts` or `src/api/client.ts`), you **must** write corresponding tests.

## Quick Start

```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode during development
npm run test -- path/to/file.test.ts  # Run specific test file
```

## Where to Put Tests

- Create test file next to or in `__tests__` folder
- Examples:
  - `src/api/__tests__/client.test.ts`
  - `src/api/__tests__/siteadmin.test.ts`

## Mocking Setup

Use these mocks for API tests:

```typescript
jest.mock("@authgear/web");
jest.mock("../../config", () => ({
  SITEADMIN_API_URL: "https://api.example.com",
}));

const mockAuthgear = authgear as jest.Mocked<typeof authgear>;
```

The `@authgear/web` mock is already in `src/__mocks__/@authgear/web.ts`.

## What to Test

For each API function, write tests covering:

1. **Happy path** — Successful request returns expected data
2. **URL construction** — Correct path, query params, URL encoding
3. **Request method** — GET vs POST vs DELETE
4. **Request body** — POST/PATCH body has correct structure
5. **Error handling** — Non-2xx responses throw `SiteAdminAPIError`
6. **Error details** — Verify error object has name, reason, code, trackingId, info

## Example Test

```typescript
import { apiRequest, SiteAdminAPIError } from "../client";

jest.mock("@authgear/web");
jest.mock("../../config", () => ({
  SITEADMIN_API_URL: "https://api.example.com",
}));

const mockAuthgear = authgear as jest.Mocked<typeof authgear>;

describe("getApp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch app by ID with URL encoding", async () => {
    const mockData = {
      id: "app-123",
      owner_email: "owner@example.com",
      plan: "pro",
      created_at: "2024-01-01T00:00:00Z",
      last_month_mau: 1000,
      user_count: 5000,
    };

    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await apiRequest("/api/v1/apps/app-123");

    expect(result).toEqual(mockData);
    expect(mockAuthgear.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/apps/app-123",
      undefined
    );
  });

  it("should throw SiteAdminAPIError on 404", async () => {
    (mockAuthgear.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: {
          name: "AppNotFound",
          reason: "app_not_found",
          message: "App not found.",
          code: 404,
          tracking_id: "track-123",
        },
      }),
    });

    await expect(apiRequest("/api/v1/apps/invalid")).rejects.toThrow(
      SiteAdminAPIError
    );
  });
});
```

## Test Examples to Reference

- **`src/api/__tests__/client.test.ts`** — 8 tests for base `apiRequest()` function
- **`src/api/__tests__/siteadmin.test.ts`** — 25 tests for all siteadmin API functions

See these files for real-world examples covering URL encoding, query parameters, POST bodies, error handling, etc.

## CI Integration

Tests run in the CI pipeline:

```bash
make ci  # Runs: typecheck → lint → format:check → test
```

All tests must pass before code can be merged.

## Test Configuration

- **`jest.config.js`** — Jest setup with ts-jest and jsdom
- **`src/setupTests.ts`** — jest-dom matchers initialization
- **`src/__mocks__/@authgear/web.ts`** — authgear module mock

## Running Tests During Development

```bash
# Run all tests
npm run test

# Watch mode (rerun on file changes)
npm run test -- --watch

# Run specific test file
npm run test -- src/api/__tests__/client.test.ts

# Run with coverage
npm run test -- --coverage
```
