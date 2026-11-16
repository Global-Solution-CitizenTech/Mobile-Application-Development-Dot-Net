import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../src/types/api.ts';
import { ApiError, getApiErrorMessage, getAuthErrorMessage, normalizeHttpError } from '../src/utils/apiError.ts';

function makeAxiosError(params: {
  status?: number;
  data?: ApiErrorResponse;
  code?: string;
  message?: string;
}): AxiosError<ApiErrorResponse> {
  const response =
    params.status !== undefined
      ? ({
          status: params.status,
          data: params.data ?? {},
          statusText: '',
          headers: {},
          config: {} as InternalAxiosRequestConfig,
        } as AxiosResponse<ApiErrorResponse>)
      : undefined;

  return new AxiosError<ApiErrorResponse>(
    params.message ?? 'Request failed',
    params.code,
    {} as InternalAxiosRequestConfig,
    undefined,
    response
  );
}

describe('apiError', () => {
  it('formats RFC 7807 Problem Details validation errors dictionary and campo/mensagem arrays', () => {
    const rfcErr = makeAxiosError({
      status: 400,
      data: {
        title: 'One or more validation errors occurred.',
        errors: {
          Titulo: ['O título é obrigatório.'],
          Cep: ['CEP inválido.'],
        },
      },
    });

    const normalizedRfc = normalizeHttpError(rfcErr);
    assert.equal(normalizedRfc.status, 400);
    assert.match(normalizedRfc.message, /Titulo: O título é obrigatório\./);
    assert.match(normalizedRfc.message, /Cep: CEP inválido\./);

    const err = makeAxiosError({
      status: 400,
      data: {
        erros: [
          { campo: 'titulo', mensagem: 'O título é obrigatório.' },
          { campo: 'cep', mensagem: 'CEP inválido.' },
        ],
      },
    });

    const normalized = normalizeHttpError(err);
    assert.equal(normalized.status, 400);
    assert.equal(normalized.code, 'VALIDATION_ERROR');
    assert.equal(normalized.message, 'titulo: O título é obrigatório.\ncep: CEP inválido.');
  });

  it('prefers explicit backend message or detail from ASP.NET Core ProblemDetails', () => {
    const dotNetErr = makeAxiosError({
      status: 404,
      data: { error: 'Not Found', message: 'Chamado #99 não encontrado.' },
    });

    const normalizedDotNet = normalizeHttpError(dotNetErr);
    assert.equal(normalizedDotNet.status, 404);
    assert.equal(normalizedDotNet.message, 'Chamado #99 não encontrado.');

    const detailErr = makeAxiosError({
      status: 503,
      data: { detail: 'Serviço temporariamente indisponível no cluster.' },
    });

    const normalizedDetail = normalizeHttpError(detailErr);
    assert.equal(normalizedDetail.status, 503);
    assert.equal(
      normalizedDetail.message,
      'Serviço temporariamente indisponível no cluster.'
    );
  });

  it('maps gateway cold start and empty-body HTTP statuses', () => {
    const coldStart = normalizeHttpError(makeAxiosError({ status: 502 }));
    assert.equal(coldStart.code, 'SERVER_STARTING');
    assert.equal(coldStart.status, 502);
    assert.match(coldStart.message, /inicializando/);

    const authErr = makeAxiosError({ status: 401 });
    assert.equal(getAuthErrorMessage(authErr), 'E-mail ou senha incorretos.');
    assert.equal(normalizeHttpError(authErr).code, 'UNAUTHORIZED');
  });

  it('handles timeout, network failure, and plain ApiError instances', () => {
    const timeout = normalizeHttpError(
      makeAxiosError({ code: 'ECONNABORTED', message: 'timeout of 40000ms exceeded' })
    );
    assert.equal(timeout.code, 'TIMEOUT');
    assert.equal(timeout.status, 408);

    const network = normalizeHttpError(makeAxiosError({ code: 'ERR_NETWORK' }));
    assert.equal(network.code, 'NETWORK_ERROR');
    assert.equal(network.status, 0);

    const existing = new ApiError('CUSTOM', 'Erro customizado', 409);
    assert.equal(getApiErrorMessage(existing), 'Erro customizado');
  });
});
