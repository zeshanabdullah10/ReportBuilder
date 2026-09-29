/** Read a dotted path (`dut.serial`) out of JSON data; undefined when any step is missing. */
export function getPathValue(data: unknown, path: string): unknown {
  let cur: unknown = data
  for (const seg of path.split('.')) {
    if (cur && typeof cur === 'object' && !Array.isArray(cur) && seg in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[seg]
    else return undefined
  }
  return cur
}
