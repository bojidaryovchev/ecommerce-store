export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Array<infer U>
      ? Serialized<U>[]
      : T[K] extends object | null
        ? T[K] extends null
          ? null
          : Serialized<T[K]>
        : T[K];
};
