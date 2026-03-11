export type HasObjectKeyNarrow<TObject extends object, TKey extends string> =
Extract<TObject, Record<TKey, unknown>> extends never
  ? TObject & Record<TKey, unknown>
  : Extract<TObject, Record<TKey, unknown>>;