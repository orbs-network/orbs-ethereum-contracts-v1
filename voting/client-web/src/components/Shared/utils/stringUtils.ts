export function ensurePrefix(text: string, prefix: string): string {
  if (text.startsWith(prefix)) {
    return text;
  } else {
    return `${prefix}${text}`;
  }
}
