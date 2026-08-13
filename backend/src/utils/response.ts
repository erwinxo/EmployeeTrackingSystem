export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export const successResponse = <T>(message: string, data: T): ApiResponse<T> => ({
  success: true,
  message,
  data,
  errors: [],
});

export const errorResponse = <T>(message: string, data: T | null = null, errors: string[] = []): ApiResponse<T | null> => ({
  success: false,
  message,
  data,
  errors,
});
