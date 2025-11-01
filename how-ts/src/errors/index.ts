/**
 * Custom error classes for How-CLI
 */

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ContentError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
    Object.setPrototypeOf(this, ContentError.prototype);
  }
}

export class ApiTimeoutError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = 'ApiTimeoutError';
    Object.setPrototypeOf(this, ApiTimeoutError.prototype);
  }
}
