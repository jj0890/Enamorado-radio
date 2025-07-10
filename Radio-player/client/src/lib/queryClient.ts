import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

const QUERY_RETRY_COUNT = 3;
const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (context: QueryFunctionContext) => Promise<T> = ({ on401 }) => {
  return async ({ queryKey }) => {
    const [endpoint] = queryKey;
    try {
      const res = await apiRequest(endpoint as string);
      return await res.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        if (on401 === "returnNull") return null;
        throw error;
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      staleTime: QUERY_STALE_TIME,
      queryFn: getQueryFn({ on401: "throw" }),
    },
  },
});