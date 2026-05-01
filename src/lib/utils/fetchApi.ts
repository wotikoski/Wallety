/**
 * Typed fetch wrapper for client-side API calls.
 *
 * Throws an Error on non-2xx responses so React Query treats them as failures
 * and preserves the previous cached data instead of replacing it with the
 * error response body (which would render as zeroed-out UI values).
 */
export async function fetchApi<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}
