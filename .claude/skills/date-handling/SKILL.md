---
name: date-handling
description: Rules for writing correct date code in this project. The server stores all data in UTC — all date arithmetic, comparisons, and state must use UTC methods, never local time methods.
---

# Date Handling

## Rule

The server stores all data in UTC. **Always use UTC methods. Never use local date methods.**

| Use | Avoid |
|-----|-------|
| `getUTCFullYear()` | `getFullYear()` |
| `getUTCMonth()` | `getMonth()` |
| `getUTCDate()` | `getDate()` |
| `setUTCDate()` | `setDate()` |
| `setUTCFullYear()` | `setFullYear()` |
| `Date.UTC(y, m, d)` | `new Date(y, m, d)` |

## Converting a Date to an API string

`toISOString().slice(0, 10)` is correct only when `d` is already a UTC midnight date:

```ts
const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
```

## Constructing "today" as UTC midnight

```ts
const now = new Date(); // current moment — UTC methods give the correct UTC date
```

When building a range that needs UTC midnight explicitly:

```ts
new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
```

## Display (`toLocaleDateString`)

Always pass `timeZone: "UTC"` so the displayed date matches the stored UTC date:

```ts
d.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
```

## Exception: Fluent UI Calendar widget

`Calendar` interprets its `value` prop as **local** time. This is the only place local date methods are allowed.

**Reading from Calendar (`onSelectDate`)** — normalize to UTC midnight immediately:

```ts
onSelectDate={(date) => {
  setDate(
    new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  );
}}
```

**Writing to Calendar (`value`)** — convert UTC midnight back to local midnight so the widget highlights the correct day:

```ts
value={
  utcDate
    ? new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    : undefined
}
```
