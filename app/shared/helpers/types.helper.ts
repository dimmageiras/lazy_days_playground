const castAsType = <TType>(value: unknown): TType => {
  return value as TType;
};

const TypesHelper = Object.freeze({
  castAsType,
} as const);

export { TypesHelper };
