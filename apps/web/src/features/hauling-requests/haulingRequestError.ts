import axios from "axios";

/**
 * Turns an API failure into an Error carrying the server's message when it
 * sent one, so the modals and the table can show why a call was rejected
 * instead of a generic axios string. The original error is kept as `cause`
 * so the HTTP status stays available (the query client skips retries on 4xx).
 */
export function toHaulingRequestError(
  error: unknown,
  fallback: string,
): Error {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string } | undefined
    )?.message;

    if (message !== undefined && message !== "") {
      return new Error(message, { cause: error });
    }
  }

  return new Error(fallback, { cause: error });
}
