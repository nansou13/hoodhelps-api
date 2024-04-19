import { GuidVersions } from "joi";

export interface FieldOptions {
  type:
    | "string"
    | "number"
    | "boolean"
    | "uuid"
    | "uri"
    | "array"
    | "object"
    | "match";
  min?: number;
  max?: number;
  email?: boolean;
  pattern?: string;
  version?: GuidVersions;
  items?: FieldOptions;
  properties?: Record<string, FieldOptions>;
  matches?: string;
  required?: boolean;
  allowEmpty?: boolean;
  default?: any;
}
