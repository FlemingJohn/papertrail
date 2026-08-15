import { z } from "zod";

const unsupportedKeywords = [
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minItems",
  "maxItems",
  "multipleOf",
  "pattern",
  "format",
  "default",
];

export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, {
    target: "draft-2020-12",
    io: "output",
    unrepresentable: "any",
  });

  return enforceStrictness(generated) as Record<string, unknown>;
}

function enforceStrictness(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(enforceStrictness);
  }

  if (node === null || typeof node !== "object") {
    return node;
  }

  const source = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (unsupportedKeywords.includes(key)) {
      continue;
    }
    if (key === "$schema") {
      continue;
    }
    result[key] = enforceStrictness(value);
  }

  if (result.type === "object" && typeof result.properties === "object") {
    const properties = result.properties as Record<string, unknown>;
    result.required = Object.keys(properties);
    result.additionalProperties = false;
  }

  return result;
}
