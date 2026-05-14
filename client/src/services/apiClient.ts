const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

type ApiClientOptions = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, unknown> | null;
};

type ApiErrorResponse = {
  message?: string;
};

export async function apiClient<TResponse>(path: string, options: ApiClientOptions = {}): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const body = options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
    ? JSON.stringify(options.body)
    : options.body;

  if (body && typeof body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const errorBody = await response.json() as ApiErrorResponse;
      message = errorBody.message ?? message;
    } catch {
      // Keep the status-based fallback when the response body is empty or not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<TResponse>;
}
