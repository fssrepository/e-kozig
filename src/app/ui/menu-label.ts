/** Remove the prototype menu marker without scanning each whitespace suffix. */
export function stripMenuItemSuffix(value: string): string {
  if (!value.toLowerCase().endsWith('menu item')) return value;
  const prefix = value.slice(0, -'menu item'.length);
  return /\s/u.test(prefix.at(-1) ?? '') ? prefix.trimEnd() : value;
}

/** Match the existing non-nested closing-parenthesis behavior in one pass. */
export function stripMenuLabel(value: string): string {
  const parts: string[] = [];
  let start = 0;
  let opening = -1;
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (/\r|\n|\u2028|\u2029/u.test(character)) {
      opening = -1;
    } else if (character === '(' && opening === -1) {
      opening = index;
    } else if (character === ')' && opening !== -1) {
      parts.push(value.slice(start, opening).trimEnd());
      index++;
      while (index < value.length && /\s/u.test(value[index])) index++;
      start = index;
      index--;
      opening = -1;
    }
  }
  parts.push(value.slice(start));
  return stripMenuItemSuffix(parts.join('')).trim();
}
