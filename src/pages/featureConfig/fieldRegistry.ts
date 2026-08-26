/**
 * Declarative table-view field list for the Feature Config tab.
 *
 * Adding another feature-config field to the table means adding one entry
 * here — the table-rendering component (`FeatureConfigTableView.tsx`) is a
 * single generic loop over this array, dispatching to a control component per
 * `control` kind. It never branches on individual field names. Extend the
 * `FieldControlKind` union only when a genuinely new UI widget is needed.
 *
 * `jsonPointer` is an RFC 6901 pointer into the `FeatureConfig` object,
 * verified against the Go struct tags in
 * `authgear-server/pkg/lib/config/feature_*.go`.
 */

export type FieldControlKind =
  | "boolean"
  | "number"
  | "countryList"
  | "usageLimitList";

export interface FieldDef {
  jsonPointer: string;
  label: string;
  /**
   * One plain-English sentence on what the setting actually controls for the
   * project — the resulting behavior, not a restatement of the label.
   */
  description: string;
  control: FieldControlKind;
  /** Display-only grouping used to render section header rows in the table view. */
  section?: string;
}

/**
 * Optional one-line note rendered under a section header row, for behavior
 * shared by every field in the section (instead of repeating it per field).
 */
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  "Usage Limit":
    "Block: stops further usage until the period resets. " +
    "Alert: notify only; usage continues. " +
    "Crossing either kind of rule sends an email to the recipients in the " +
    "project's usage.alerts config, and fires a usage.alert-triggered event " +
    "to the project's webhooks plus any usage.hooks webhooks in " +
    "authgear.features.yaml.",
};

// Section order: most frequently adjusted settings first (per project owner).
export const FIELD_REGISTRY: FieldDef[] = [
  {
    jsonPointer: "/ui/white_labeling/disabled",
    label: "Disable white labeling",
    description:
      "Yes: the project cannot turn off the Authgear watermark on login pages.",
    control: "boolean",
    section: "UI",
  },
  {
    jsonPointer: "/oauth/client/custom_ui_enabled",
    label: "Custom UI enabled",
    description:
      "Yes: the project can replace the built-in login pages with its own custom auth UI.",
    control: "boolean",
    section: "OAuth Client",
  },
  {
    jsonPointer: "/oauth/client/app2app_enabled",
    label: "App2App enabled",
    description:
      "Yes: the project can turn on App2App login for its applications.",
    control: "boolean",
    section: "OAuth Client",
  },
  {
    jsonPointer: "/oauth/client/soft_maximum",
    label: "Soft maximum OAuth clients",
    description:
      "Soft limit: shows a banner on the Applications page when this cap is met.",
    control: "number",
    section: "OAuth Client",
  },
  {
    jsonPointer: "/oauth/client/maximum",
    label: "Maximum OAuth clients",
    description: "Hard cap on the number of applications the project can have.",
    control: "number",
    section: "OAuth Client",
  },
  {
    jsonPointer: "/ui/phone_input/allowlist",
    label: "Phone input country allowlist",
    description: "Countries the project may offer in the phone number input.",
    control: "countryList",
    section: "Phone Input",
  },
  {
    jsonPointer: "/usage/limits/email",
    label: "Email usage limit",
    description: "Caps how many emails the project can send per period.",
    control: "usageLimitList",
    section: "Usage Limit",
  },
  {
    jsonPointer: "/usage/limits/sms",
    label: "SMS usage limit",
    description: "Caps how many SMS the project can send per period.",
    control: "usageLimitList",
    section: "Usage Limit",
  },
  {
    jsonPointer: "/usage/limits/whatsapp",
    label: "WhatsApp usage limit",
    description:
      "Caps how many WhatsApp messages the project can send per period.",
    control: "usageLimitList",
    section: "Usage Limit",
  },
  {
    jsonPointer: "/usage/limits/user_export",
    label: "User export usage limit",
    description:
      "Caps how many user-export jobs the project can start per period.",
    control: "usageLimitList",
    section: "Usage Limit",
  },
  {
    jsonPointer: "/usage/limits/user_import",
    label: "User import usage limit",
    description:
      "Caps how many user records the project can import per period.",
    control: "usageLimitList",
    section: "Usage Limit",
  },
  {
    jsonPointer: "/fraud_protection/is_modifiable",
    label: "Fraud protection is modifiable",
    description: "Yes: the project can change fraud protection settings.",
    control: "boolean",
    section: "Fraud Protection",
  },
  {
    jsonPointer: "/messaging/custom_sms_provider_disabled",
    label: "Disable custom SMS provider",
    description:
      "Yes: the project cannot use its own SMS gateway and must send through the deployment-wide provider.",
    control: "boolean",
    section: "Messaging",
  },
  {
    jsonPointer: "/messaging/custom_smtp_disabled",
    label: "Disable custom SMTP",
    description:
      "Yes: the project cannot use its own SMTP server and must send through the deployment-wide email sender.",
    control: "boolean",
    section: "Messaging",
  },
  {
    jsonPointer: "/messaging/template_customization_disabled",
    label: "Disable template customization",
    description:
      "Yes: the project cannot customize email and SMS message templates.",
    control: "boolean",
    section: "Messaging",
  },
  {
    jsonPointer: "/audit_log/retrieval_days",
    label: "Audit log retrieval days",
    description:
      "How many days back the project can query audit logs; -1 means unlimited.",
    control: "number",
    section: "Audit Log",
  },
  {
    jsonPointer: "/hook/blocking_handler/maximum",
    label: "Maximum blocking hook handlers",
    description:
      "Max number of blocking event hooks the project can configure.",
    control: "number",
    section: "Hook",
  },
  {
    jsonPointer: "/hook/non_blocking_handler/maximum",
    label: "Maximum non-blocking hook handlers",
    description:
      "Max number of non-blocking event hooks the project can configure.",
    control: "number",
    section: "Hook",
  },
];
