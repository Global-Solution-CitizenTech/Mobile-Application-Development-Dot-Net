export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageInfo;
  totalElements?: number;
  totalPages?: number;
  pageNumber?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}


export interface ApiFieldError {
  campo: string;
  mensagem: string;
}

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]> | ApiFieldError[];
  erros?: ApiFieldError[];
  path?: string;
  traceId?: string;
}

export interface ActionCallbacks<TData = void> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

export type UnauthorizedCallback = () => void;
