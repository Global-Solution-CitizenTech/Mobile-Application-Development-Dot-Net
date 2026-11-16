import { api } from '@/services/api';
import { CATEGORIA_CATALOG } from '@/theme/semanticConfig';
import type { PageInfo, PageResponse } from '@/types/api';
import type { Chamado, ChamadoCreateRequest, ChamadoRequest, ChamadoResponse, ChamadoStatusRequest, EstatisticasChamados } from '@/types/chamado';
import type { FiltroChamados } from '@/types/filters';
import { mapChamadoResponse } from '@/utils/chamadoMappers';

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const ROTA_CHAMADOS = '/chamados';

export const chamadoService = {
  async listar(filtros?: FiltroChamados): Promise<PageResponse<Chamado>> {
    const resolvedCategoriaId =
      filtros?.categoriaId ??
      (filtros?.categoria
        ? CATEGORIA_CATALOG.find((c) => c.nome === filtros.categoria?.trim().toUpperCase())?.id
        : undefined);

    const { data } = await api.get<PageResponse<ChamadoResponse>>(ROTA_CHAMADOS, {
      params: {
        status: filtros?.status || undefined,
        categoria: filtros?.categoria || undefined,
        categoriaId: resolvedCategoriaId ?? undefined,
        busca: filtros?.busca?.trim() || undefined,
        apenasMeus: filtros?.apenasMeus ?? undefined,
        cidade: filtros?.cidade?.trim() || undefined,
        bairro: filtros?.bairro?.trim() || undefined,
        estado: filtros?.estado?.trim() || undefined,
        page: filtros?.page ?? 0,
        size: filtros?.size ?? 10,
        sort: filtros?.sort ?? 'dtAbertura,desc',
        incluirFoto: true,
      },
    });

    const raw = data as unknown as Record<string, unknown>;
    const pageObj = raw.page as Record<string, unknown> | undefined;
    const pageInfo: PageInfo = {
      size: Number(pageObj?.size ?? raw.size ?? raw.pageSize ?? 10),
      number: Number(pageObj?.number ?? raw.number ?? raw.pageNumber ?? 0),
      totalElements: Number(pageObj?.totalElements ?? raw.totalElements ?? 0),
      totalPages: Number(pageObj?.totalPages ?? raw.totalPages ?? 0),
    };

    return {
      content: (data.content ?? []).map(mapChamadoResponse),
      page: pageInfo,
    };
  },

  async buscarPorId(id: number): Promise<Chamado> {
    const { data } = await api.get<ChamadoResponse>(`${ROTA_CHAMADOS}/${id}`);
    return mapChamadoResponse(data);
  },

  async criar(payload: ChamadoCreateRequest): Promise<Chamado> {
    const idempotencyKey = generateIdempotencyKey();
    const body = {
      titulo: payload.titulo,
      descricao: payload.descricao,
      categoriaId: payload.categoriaId,
      cep: payload.cep,
      numero: payload.numero,
      referencia: payload.referencia || undefined,
      prioridadeId: payload.prioridadeId ?? undefined,
      orgaoGovernoId: payload.orgaoGovernoId ?? undefined,
      fotoBase64: payload.fotoBase64,
    };

    const { data } = await api.post<ChamadoResponse>(ROTA_CHAMADOS, body, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return mapChamadoResponse(data);
  },

  async atualizar(id: number, payload: ChamadoRequest): Promise<Chamado> {
    const { data } = await api.put<ChamadoResponse>(`${ROTA_CHAMADOS}/${id}`, payload);
    return mapChamadoResponse(data);
  },

  async alterarStatus(id: number, payload: ChamadoStatusRequest): Promise<Chamado> {
    const idempotencyKey = generateIdempotencyKey();
    const { data } = await api.patch<ChamadoResponse>(`${ROTA_CHAMADOS}/${id}/status`, payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return mapChamadoResponse(data);
  },

  async apoiar(id: number, remover = false): Promise<Chamado> {
    const { data } = remover
      ? await api.delete<ChamadoResponse>(`${ROTA_CHAMADOS}/${id}/apoiar`)
      : await api.post<ChamadoResponse>(`${ROTA_CHAMADOS}/${id}/apoiar`);
    return mapChamadoResponse(data);
  },

  async deletar(id: number): Promise<void> {
    await api.delete(`${ROTA_CHAMADOS}/${id}`);
  },

  async obterEstatisticas(): Promise<EstatisticasChamados> {
    const { data } = await api.get<EstatisticasChamados>(`${ROTA_CHAMADOS}/estatisticas`);
    return data;
  },
};
