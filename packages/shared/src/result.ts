export type Result<T> =
  | { kind: "Ok"; value: T }
  | { kind: "Error"; error: string };
