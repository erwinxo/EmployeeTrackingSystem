export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const asyncHandler = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
  return (...args: Parameters<T>): void => {
    const next = args[args.length - 1] as (error?: any) => void;
    Promise.resolve(fn(...args)).catch(next);
  };
};
