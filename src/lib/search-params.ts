/** The first value of a query parameter, trimmed; repeated parameters keep the first. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}
