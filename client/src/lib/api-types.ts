export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; code?: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export class ErrorWithCode extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ErrorWithCode';
  }
}

// Helper function for handling API responses
export async function handleApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'An unknown error occurred',
        code: data.code || 'UNKNOWN'
      };
    }
    
    return {
      ok: true,
      data: data as T
    };
  } catch (e) {
    return {
      ok: false,
      error: 'Failed to parse response',
      code: 'PARSE_ERROR'
    };
  }
}
