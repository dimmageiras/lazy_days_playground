const castAsType = <TType>(value: unknown): TType => {
  return value as TType;
};

const TypeHelper = Object.freeze({
  castAsType,
} as const);

export { TypeHelper };
