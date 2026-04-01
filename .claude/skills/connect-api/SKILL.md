---
name: connect-api
description: Wire a frontend page in the Authgear Site Admin Portal to the real Site Admin API, replacing mock data from src/data/. Use this skill when asked to connect a page to the API, replace dummy/mock data with live data, implement an API call on a screen, or fetch real data for any page in this project.
---

# Connect API to Page

## Infrastructure

All plumbing is already in `src/api/`:

| File | Purpose |
|---|---|
| `types.ts` | TypeScript interfaces matching every schema in the API spec |
| `client.ts` | `apiRequest<T>(path, init?)` — uses `authgear.fetch()`, throws `SiteAdminAPIError` on non-2xx |
| `siteadmin.ts` | One typed function per operation (see `references/api.md` for full list) |

Base URL: `VITE_SITEADMIN_API_URL` env var (set to `https://siteadmin.authgear-staging.com`).

## Steps

1. **Read the page** — understand what mock data it uses and which fields it renders.

2. **Find the operation** — check `references/api.md` for the matching function. If missing from `siteadmin.ts`, add it following the existing pattern.

3. **Add async state** to the component:
   ```tsx
   const [data, setData] = useState<T | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<SiteAdminAPIError | null>(null);
   ```

4. **Fetch in useEffect**:
   ```tsx
   useEffect(() => {
     setLoading(true);
     someApiFunction(params)
       .then(setData)
       .catch((err: SiteAdminAPIError) => setError(err))
       .finally(() => setLoading(false));
   }, [deps]);
   ```

5. **Map API shape to UI** — API uses `snake_case`; map inside the effect or via `useMemo`. Never rename fields in `src/api/`.

6. **Wire shimmer** — pass `enableShimmer={loading}` to `ShimmeredDetailsList`.

7. **Show errors** — render `<MessageBar messageBarType={MessageBarType.error}>` when `error !== null`.

8. **Remove mock data** — delete the import from `src/data/`. If the data file is now unused, delete it.

## Notes

- `authgear.fetch()` auto-refreshes the access token — no manual retry needed.
- `listApps` is paginated server-side; do not slice results client-side.
- `SiteAdminAPIError` has `.code`, `.errorName`, `.reason`, `.message` fields.

## References

See `references/api.md` for the full list of available API operations and response types.
