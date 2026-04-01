# Site Admin API Reference

Spec: https://raw.githubusercontent.com/authgear/authgear-server/refs/heads/main/docs/api/siteadmin-api.yaml

## Available Functions (`src/api/siteadmin.ts`)

### `listApps(params?)`
```ts
listApps(params?: { page?, page_size?, app_id?, owner_email? }): Promise<AppsListResponse>
```
Returns `{ apps: App[], total_count, page, page_size }`.

### `getApp(appId)`
```ts
getApp(appId: string): Promise<AppDetail>
```
Returns `App` fields plus `user_count: number`.

### `listAppCollaborators(appId)`
```ts
listAppCollaborators(appId: string): Promise<CollaboratorsListResponse>
```
Returns `{ collaborators: Collaborator[] }`.

### `addAppCollaborator(appId, userEmail)`
```ts
addAppCollaborator(appId: string, userEmail: string): Promise<Collaborator>
```
Always adds as `editor` role.

### `removeAppCollaborator(appId, collaboratorId)`
```ts
removeAppCollaborator(appId: string, collaboratorId: string): Promise<{}>
```

### `getAppMessagingUsage(appId, startDate, endDate)`
```ts
getAppMessagingUsage(appId: string, startDate: string, endDate: string): Promise<MessagingUsage>
// dates: YYYY-MM-DD
```
Returns SMS and WhatsApp counts for North America and other regions.

### `getAppMonthlyActiveUsers(appId, startYear, startMonth, endYear, endMonth)`
```ts
getAppMonthlyActiveUsers(appId, startYear, startMonth, endYear, endMonth): Promise<MonthlyActiveUsersUsage>
```
Returns `{ counts: { year, month, count }[] }`.

---

## Key Types (`src/api/types.ts`)

```ts
interface App {
  id: string;
  owner_email: string;
  plan: string;
  created_at: string; // RFC 3339
}

interface AppDetail extends App {
  user_count: number;
}

interface Collaborator {
  id: string;
  app_id: string;
  user_id: string;
  user_email: string;
  role: "owner" | "editor";
  created_at: string;
}

interface MessagingUsage {
  start_date: string;
  end_date: string;
  sms_north_america_count: number;
  sms_other_regions_count: number;
  whatsapp_north_america_count: number;
  whatsapp_other_regions_count: number;
}

interface MonthlyActiveUsersUsage {
  counts: { year: number; month: number; count: number }[];
}
```

## Error Type

```ts
class SiteAdminAPIError extends Error {
  errorName: string;  // e.g. "NotFound", "Forbidden"
  reason: string;
  code: number;       // HTTP status
  message: string;
  trackingId?: string;
}
```
