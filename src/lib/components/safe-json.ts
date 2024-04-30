// https://hackernoon.com/mastering-type-safe-json-serialization-in-typescript
export type JsonPrimitive = string | number | boolean | null | undefined;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type JsonCompatible<T> = unknown extends T
  ? never
  : {
      [P in keyof T]: T[P] extends JsonValue
        ? T[P]
        : T[P] extends NotAssignableToJson
          ? never
          : JsonCompatible<T[P]>;
    };

export type NotAssignableToJson =
  | bigint
  | symbol
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function;

export function safeJsonStringify<T>(data: JsonCompatible<T>) {
  return JSON.stringify(data);
}

export function toJsonValue<T>(value: JsonCompatible<T>): JsonValue {
  return value;
}
