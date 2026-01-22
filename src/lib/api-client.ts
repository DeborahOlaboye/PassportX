/**
 * Standardized API client for the frontend
 */

import { APIErrorResponse, APISuccessResponse } from './api-responses';

export class APIClientError extends Error {
  constructor(
    public message: string,
    public code: string = 'UNKNOWN_ERROR',
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

/**
 * Enhanced fetch wrapper that standardizes error handling
 */
export async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    // Handle our new standardized error format
    if (data && data.success === false && data.error) {
      throw new APIClientError(
        data.error.message,
        data.error.code,
        response.status,
        data.error.details
      );
    }

    // Handle legacy/other error formats
    const errorMessage = data?.error || data?.message || response.statusText || 'An unknown error occurred';
    const errorCode = data?.code || 'API_ERROR';
    
    throw new APIClientError(errorMessage, errorCode, response.status, data);
  }

  // Handle our new standardized success format
  if (data && data.success === true && 'data' in data) {
    return data.data as T;
  }

  // Handle direct data return (legacy)
  return data as T;
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => 
    request<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, body: any, options?: RequestInit) => 
    request<T>(url, { 
      ...options, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body) 
    }),
  
  put: <T>(url: string, body: any, options?: RequestInit) => 
    request<T>(url, { 
      ...options, 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body) 
    }),
  
  delete: <T>(url: string, options?: RequestInit) => 
    request<T>(url, { ...options, method: 'DELETE' }),
};
