const castAsType = <TType>(value: unknown): TType => {
  return value as TType;
};

export const TypeHelper = {
  castAsType,
};
