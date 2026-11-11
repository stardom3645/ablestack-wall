/** Native strict JSON parsing; syntax validity is not panel/schema validity. Offsets are UTF-16. */
export function inspectJsonSyntax(text: string): { value?: unknown; error?: string; line?: number; column?: number } {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON을 해석할 수 없습니다.';
    const location = /line (\d+) column (\d+)/i.exec(message);
    if (location) {
      return { error: message, line: Number(location[1]), column: Number(location[2]) };
    }
    const position = /position (\d+)/i.exec(message);
    const offset = position ? Number(position[1]) : /end of JSON/i.test(message) ? text.length : undefined;
    if (offset !== undefined) {
      const lines = text.slice(0, offset).split(/\r\n|\r|\n/);
      return { error: message, line: lines.length, column: lines[lines.length - 1].length + 1 };
    }
    return { error: message };
  }
}
