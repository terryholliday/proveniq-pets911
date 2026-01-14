import type { JsonValue } from './canonical-json';

export type JsonSchema = {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: JsonValue[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  const?: JsonValue;
};

export function validateAgainstSchema(schema: JsonSchema, data: unknown, path: string = '$'): void {
  switch (schema.type) {
    case 'object': {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error(`${path} must be object`);
      }
      const obj = data as Record<string, unknown>;
      const required = schema.required ?? [];
      for (const key of required) {
        if (!(key in obj)) throw new Error(`${path}.${key} is required`);
      }
      if (schema.const !== undefined) {
        if (JSON.stringify(data) !== JSON.stringify(schema.const)) {
          throw new Error(`${path} must equal const`);
        }
      }
      if (schema.properties) {
        for (const [k, childSchema] of Object.entries(schema.properties)) {
          if (k in obj) validateAgainstSchema(childSchema, obj[k], `${path}.${k}`);
        }
      }
      if (schema.additionalProperties === false && schema.properties) {
        for (const k of Object.keys(obj)) {
          if (!(k in schema.properties)) throw new Error(`${path}.${k} is not allowed`);
        }
      }
      return;
    }
    case 'array': {
      if (!Array.isArray(data)) throw new Error(`${path} must be array`);
      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          validateAgainstSchema(schema.items, data[i], `${path}[${i}]`);
        }
      }
      return;
    }
    case 'string': {
      if (typeof data !== 'string') throw new Error(`${path} must be string`);
      if (schema.enum && !schema.enum.includes(data)) throw new Error(`${path} must be one of enum`);
      if (schema.const !== undefined && data !== schema.const) throw new Error(`${path} must equal const`);
      return;
    }
    case 'number': {
      if (typeof data !== 'number') throw new Error(`${path} must be number`);
      if (schema.enum && !schema.enum.includes(data)) throw new Error(`${path} must be one of enum`);
      if (schema.const !== undefined && data !== schema.const) throw new Error(`${path} must equal const`);
      return;
    }
    case 'integer': {
      if (typeof data !== 'number' || !Number.isInteger(data)) throw new Error(`${path} must be integer`);
      if (schema.enum && !schema.enum.includes(data)) throw new Error(`${path} must be one of enum`);
      if (schema.const !== undefined && data !== schema.const) throw new Error(`${path} must equal const`);
      return;
    }
    case 'boolean': {
      if (typeof data !== 'boolean') throw new Error(`${path} must be boolean`);
      if (schema.enum && !schema.enum.includes(data)) throw new Error(`${path} must be one of enum`);
      if (schema.const !== undefined && data !== schema.const) throw new Error(`${path} must equal const`);
      return;
    }
    default: {
      const _exhaustive: never = schema.type;
      return _exhaustive;
    }
  }
}
