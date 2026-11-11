/** Error display only: never serialize request/config/secure datasource fields. */
export function safeQueryError(message: string) {
  return message
    .replace(/([a-z][a-z\d+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .replace(
      /(["']?(?:password|passwd|secret|token|api[_-]?key|access[_-]?key)["']?\s*[=:]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1[REDACTED]'
    )
    .replace(/(authorization\s*[=:]\s*)(?:Bearer\s+|Basic\s+)?[^\r\n,;]+/gi, '$1[REDACTED]');
}
