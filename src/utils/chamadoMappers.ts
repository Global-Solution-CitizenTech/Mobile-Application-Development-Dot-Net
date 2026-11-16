import { env } from '../config/env.ts';
import { CATEGORIA_CATALOG } from '../theme/semanticConfig.ts';
import type { StatusChamado } from '../types/categoria.ts';
import type { Chamado, ChamadoCreateRequest, ChamadoRequest, ChamadoResponse, HistoricoChamado } from '../types/chamado.ts';
import type { EnderecoFormInput, EnderecoRequest, EnderecoResponse } from '../types/endereco.ts';
import { onlyDigits } from './formatters.ts';
import type { ChamadoCreateFormData, ChamadoFormData } from '../types/form.ts';

export function buildApiAssetUrl(path?: string | null, baseUrl: string = env.apiUrl): string | undefined {
  if (!path || path.trim() === '') return undefined;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = baseUrl.replace(/\/+$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${normalizedPath}`;
}

export function buildEnderecoRequest(input: EnderecoFormInput): EnderecoRequest {
  const rua = input.rua?.trim().slice(0, 100);
  return {
    cep: onlyDigits(input.cep),
    numero: (input.numero.trim() || 'S/N').slice(0, 100),
    referencia: input.referencia.trim().slice(0, 50),
    ...(rua ? { rua } : {}),
  };
}

export function mapChamadoResponse(item: ChamadoResponse | Record<string, unknown>): Chamado {
  const raw = item as Record<string, unknown>;

  const idChamado = Number(raw.idChamado ?? raw.id ?? 0);
  const protocolo = (raw.protocolo as string) || `#${idChamado}`;
  const titulo = (raw.titulo as string) || '';
  const descricao = (raw.descricao as string) || '';
  const categoriaId = Number(raw.categoriaId ?? 0);
  const categoriaNome = (raw.categoriaNome as string) || (raw.categoria as string) || '';
  const prioridadeId = Number(raw.prioridadeId ?? 2);
  const prioridadeNome = (raw.prioridadeNome as string) || (raw.prioridade as string) || 'Média';
  const orgaoId = Number(raw.orgaoId ?? 1);
  const orgaoNome = (raw.orgaoNome as string) || (raw.orgao as string) || '';
  const usuarioId = Number(raw.usuarioId ?? raw.autorId ?? 0);
  const usuarioNome = (raw.usuarioNome as string) || (raw.autorNome as string) || '';
  const dtAbertura = (raw.dtAbertura as string) || (raw.dataAbertura as string) || new Date().toISOString();
  const status = (raw.status as StatusChamado) || 'PENDENTE';
  const totalVotos = Number(raw.totalVotos ?? raw.apoiosCount ?? 0);
  const apoiadoPorMim = Boolean(raw.apoiadoPorMim ?? raw.apoiadoPeloUsuario ?? false);

  let endereco: EnderecoResponse;
  if (raw.endereco && typeof raw.endereco === 'object') {
    const end = raw.endereco as Record<string, unknown>;
    endereco = {
      id: Number(end.id ?? 0),
      cep: String(end.cep || ''),
      rua: String(end.rua || ''),
      numero: String(end.numero || 'S/N'),
      bairro: String(end.bairro || ''),
      cidade: String(end.cidade || ''),
      estado: String(end.estado || ''),
      referencia: String(end.referencia || ''),
    };
  } else if (raw.localizacao && typeof raw.localizacao === 'object') {
    const loc = raw.localizacao as Record<string, unknown>;
    endereco = {
      id: 0,
      cep: String(loc.cep || ''),
      rua: String(loc.logradouro || loc.rua || ''),
      numero: String(loc.numero || 'S/N'),
      bairro: String(loc.bairro || ''),
      cidade: String(loc.cidade || ''),
      estado: String(loc.estado || ''),
      referencia: String(loc.pontoReferencia || loc.referencia || ''),
    };
  } else {
    endereco = {
      id: 0,
      cep: '',
      rua: '',
      numero: 'S/N',
      bairro: '',
      cidade: '',
      estado: '',
      referencia: '',
    };
  }

  let fotoUrl: string | undefined = undefined;
  const fotoBase64 = raw.fotoBase64 as string | undefined;
  const fotoContentType = (raw.fotoContentType as string | undefined) || 'image/jpeg';
  const rawFoto = (raw.foto as string | undefined) || undefined;

  if (fotoBase64 && fotoBase64.trim()) {
    const trimmed = fotoBase64.trim();
    fotoUrl = trimmed.startsWith('data:') ? trimmed : `data:${fotoContentType};base64,${trimmed}`;
  } else if (rawFoto && rawFoto.trim()) {
    const trimmed = rawFoto.trim();
    if (trimmed.startsWith('data:')) {
      fotoUrl = trimmed;
    } else if (/^https?:\/\//i.test(trimmed)) {
      fotoUrl = trimmed;
    } else {
      fotoUrl = buildApiAssetUrl(`${trimmed}?v=${encodeURIComponent(dtAbertura)}`);
    }
  }

  const rawHistorico = Array.isArray(raw.historico) ? raw.historico : [];
  const historico: HistoricoChamado[] = rawHistorico
    .map((h: Record<string, unknown>) => ({
      id: Number(h.id ?? 0),
      data: String(h.data || dtAbertura),
      status: (h.novoStatus || h.status || 'PENDENTE') as StatusChamado,
      observacao: String(h.observacao || h.observacoes || ''),
      autorNome: String(h.autorNome || ''),
    }))
    .sort((a, b) => {
      const timeA = new Date(a.data).getTime();
      const timeB = new Date(b.data).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      return b.id - a.id;
    });

  return {
    idChamado,
    protocolo,
    titulo,
    descricao,
    dtAbertura,
    categoriaId,
    categoriaNome,
    prioridadeId,
    prioridadeNome,
    orgaoId,
    orgaoNome,
    usuarioId,
    usuarioNome,
    endereco,
    status,
    totalVotos,
    apoiadoPorMim,
    historico,
    fotoUrl,
  };
}

export function toChamadoCreateRequest(form: ChamadoCreateFormData): ChamadoCreateRequest {
  const fotoBase64 = form.foto?.base64
    ? (form.foto.base64.startsWith('data:') ? form.foto.base64 : `data:${form.foto.type || 'image/jpeg'};base64,${form.foto.base64}`)
    : (form.foto?.uri ?? '');

  return {
    titulo: form.titulo?.trim() ?? '',
    descricao: form.descricao?.trim() ?? '',
    categoriaId: Number(form.categoriaId) || 0,
    cep: onlyDigits(form.cep),
    numero: (form.numero?.trim() || 'S/N').slice(0, 100),
    referencia: form.referencia ? form.referencia.trim().slice(0, 50) : undefined,
    fotoBase64,
    endereco: buildEnderecoRequest(form),
    foto: form.foto,
  };
}

export function toChamadoRequest(form: ChamadoFormData): ChamadoRequest {
  const categoria = CATEGORIA_CATALOG.find((c) => c.id === form.categoriaId)?.nome;
  if (!categoria) {
    throw new Error(`Categoria desconhecida: ${form.categoriaId}`);
  }
  return {
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    categoriaId: Number(form.categoriaId) || 0,
    cep: onlyDigits(form.cep),
    numero: (form.numero?.trim() || 'S/N').slice(0, 100),
    referencia: form.referencia ? form.referencia.trim().slice(0, 50) : undefined,
    categoria,
    endereco: buildEnderecoRequest(form),
  };
}
