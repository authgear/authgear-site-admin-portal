import { formatValidationCauses, mapCausesToFields } from "../errorMapping";
import type { ValidationErrorCause } from "../../../api/types";
import type { FieldDef } from "../fieldRegistry";

const REGISTRY: FieldDef[] = [
  {
    jsonPointer: "/oauth/client/maximum",
    label: "Maximum",
    description: "Hard cap on the number of applications.",
    control: "number",
  },
  {
    jsonPointer: "/usage/limits/email",
    label: "Email usage limit",
    description: "Caps how many emails the project can send per period.",
    control: "usageLimitList",
  },
];

test("formats a single cause as 'Invalid input at <location>: <kind>'", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/authentication/lockout/password/enabled", kind: "type" },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /authentication/lockout/password/enabled: type"
  );
});

test("concatenates multiple causes together", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/oauth/client/maximum", kind: "type" },
    { location: "/collaborator/maximum", kind: "minimum" },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /oauth/client/maximum: type; Invalid input at /collaborator/maximum: minimum"
  );
});

test("substitutes a readable label for the document-root location", () => {
  const causes: ValidationErrorCause[] = [{ location: "", kind: "required" }];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at the document: required"
  );
});

test("ignores details, only location and kind are shown", () => {
  const causes: ValidationErrorCause[] = [
    {
      location: "/oauth/client/maximum",
      kind: "type",
      details: { actual: "string", expected: "integer" },
    },
  ];
  expect(formatValidationCauses(causes)).toBe(
    "Invalid input at /oauth/client/maximum: type"
  );
});

test("mapCausesToFields: exact location match", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/oauth/client/maximum", kind: "type" },
  ];
  const result = mapCausesToFields(causes, REGISTRY);
  expect(result.get("/oauth/client/maximum")).toEqual(causes);
});

test("mapCausesToFields: cause on an ancestor object flags every field beneath it", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/oauth/client", kind: "required" },
  ];
  const result = mapCausesToFields(causes, REGISTRY);
  expect(result.get("/oauth/client/maximum")).toEqual(causes);
});

test("mapCausesToFields: cause on a nested list item flags the list-valued field", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/usage/limits/email/0/quota", kind: "minimum" },
  ];
  const result = mapCausesToFields(causes, REGISTRY);
  expect(result.get("/usage/limits/email")).toEqual(causes);
});

test("mapCausesToFields: document-root location matches nothing", () => {
  const causes: ValidationErrorCause[] = [{ location: "", kind: "required" }];
  const result = mapCausesToFields(causes, REGISTRY);
  expect(result.size).toBe(0);
});

test("mapCausesToFields: unrelated location matches nothing", () => {
  const causes: ValidationErrorCause[] = [
    { location: "/collaborator/maximum", kind: "type" },
  ];
  const result = mapCausesToFields(causes, REGISTRY);
  expect(result.size).toBe(0);
});
