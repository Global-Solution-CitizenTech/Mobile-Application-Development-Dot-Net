import type { InfiniteData } from '@tanstack/react-query';
import type { PageResponse } from '@/types/api';
import type { StatusChamado } from '@/types/categoria';
import type { EnderecoRequest, EnderecoResponse } from '@/types/endereco';
import type { ChamadoFormData } from '@/types/form';

export interface HistoricoChamado {
  id: number;
  data: string;
  status: StatusChamado;
  observacao: string;
  autorNome: string;
}

export interface ChamadoResponse {
  idChamado?: number;
  id?: number;
  protocolo?: string;
  titulo: string;
  descricao: string;
  dtAbertura?: string;
  dataAbertura?: string;
  dataAtualizacao?: string;
  categoriaId: number;
  categoriaNome?: string;
  categoria?: string;
  prioridadeId?: number;
  prioridadeNome?: string;
  prioridade?: string;
  orgaoId?: number;
  orgaoNome?: string;
  orgao?: string;
  usuarioId?: number;
  autorId?: number;
  usuarioNome?: string;
  autorNome?: string;
  endereco?: EnderecoResponse;
  localizacao?: {
    cep: string;
    logradouro?: string;
    rua?: string;
    numero: string;
    pontoReferencia?: string | null;
    referencia?: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  };
  foto?: string | null;
  fotoBase64?: string | null;
  fotoContentType?: string | null;
  status: StatusChamado;
  totalVotos?: number;
  apoiosCount?: number;
  apoiadoPorMim?: boolean;
  apoiadoPeloUsuario?: boolean;
  historico?: {
    id: number;
    data: string;
    statusAnterior?: string | null;
    novoStatus?: StatusChamado;
    status?: StatusChamado;
    observacao?: string;
    observacoes?: string;
    autorNome: string;
  }[];
}

export interface Chamado {
  idChamado: number;
  protocolo?: string;
  titulo: string;
  descricao: string;
  dtAbertura: string;
  categoriaId: number;
  categoriaNome: string;
  prioridadeId: number;
  prioridadeNome: string;
  orgaoId: number;
  orgaoNome: string;
  usuarioId: number;
  usuarioNome: string;
  endereco: EnderecoResponse;
  status: StatusChamado;
  totalVotos: number;
  apoiadoPorMim: boolean;
  historico: HistoricoChamado[];
  fotoUrl?: string;
}

export interface FotoUpload {
  uri: string;
  name: string;
  type: string;
  base64?: string;
}

export interface ChamadoCreateRequest {
  titulo: string;
  descricao: string;
  categoriaId: number;
  cep: string;
  numero: string;
  referencia?: string;
  fotoBase64: string;
  prioridadeId?: number;
  orgaoGovernoId?: number;
  endereco: EnderecoRequest;
  foto?: FotoUpload;
}

export interface ChamadoRequest {
  titulo: string;
  descricao: string;
  categoria: string;
  endereco: EnderecoRequest;
}

export interface ChamadoStatusRequest {
  status: StatusChamado;
  observacao: string;
}

export interface EstatisticasChamados {
  total: number;
  abertos: number;
  emAndamento: number;
  resolvidos: number;
  rejeitados: number;
  totalApoios: number;
}

export type ChamadoFormState = ChamadoFormData & { foto?: FotoUpload };

export type UseChamadoFormOptions =
  | { mode: 'create' }
  | { mode: 'edit'; chamadoId: number };

export type ChamadoListCache =
  | PageResponse<Chamado>
  | InfiniteData<PageResponse<Chamado>>
  | undefined;
