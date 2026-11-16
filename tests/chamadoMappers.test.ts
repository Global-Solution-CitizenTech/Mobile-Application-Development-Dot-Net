import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ChamadoResponse, FotoUpload } from '../src/types/chamado.ts';
import { buildApiAssetUrl, buildEnderecoRequest, mapChamadoResponse, toChamadoCreateRequest, toChamadoRequest } from '../src/utils/chamadoMappers.ts';

describe('chamadoMappers', () => {
  describe('buildApiAssetUrl', () => {
    it('returns undefined for empty, null or undefined input', () => {
      assert.equal(buildApiAssetUrl(null), undefined);
      assert.equal(buildApiAssetUrl(undefined), undefined);
      assert.equal(buildApiAssetUrl('   '), undefined);
    });

    it('preserves absolute URLs', () => {
      const url = 'https://blob.core.windows.net/zelafix/image.jpg';
      assert.equal(buildApiAssetUrl(url), url);
      assert.equal(buildApiAssetUrl('http://insecure.site/test.png'), 'http://insecure.site/test.png');
    });

    it('resolves relative paths with custom or default baseUrl', () => {
      const customBase = 'https://api.zelafix.sp.gov.br';
      assert.equal(
        buildApiAssetUrl('/uploads/foto-123.jpg', customBase),
        'https://api.zelafix.sp.gov.br/uploads/foto-123.jpg'
      );
      assert.equal(
        buildApiAssetUrl('uploads/foto-123.jpg', customBase),
        'https://api.zelafix.sp.gov.br/uploads/foto-123.jpg'
      );
      assert.equal(
        buildApiAssetUrl('/uploads/foto-123.jpg', 'https://api.zelafix.sp.gov.br/'),
        'https://api.zelafix.sp.gov.br/uploads/foto-123.jpg'
      );
    });
  });

  describe('buildEnderecoRequest', () => {
    it('normalizes CEP to digits only and provides S/N fallback for empty number', () => {
      const result = buildEnderecoRequest({
        cep: '01310-100',
        numero: '',
        referencia: 'Próximo ao metrô Trianon',
      });

      assert.equal(result.cep, '01310100');
      assert.equal(result.numero, 'S/N');
      assert.equal(result.referencia, 'Próximo ao metrô Trianon');
      assert.equal(result.rua, undefined);
    });

    it('trims rua and includes it when present', () => {
      const result = buildEnderecoRequest({
        cep: '04571-010',
        rua: '  Avenida das Nações Unidas  ',
        numero: '  12901  ',
        referencia: 'Torre Oeste',
      });

      assert.equal(result.cep, '04571010');
      assert.equal(result.rua, 'Avenida das Nações Unidas');
      assert.equal(result.numero, '12901');
      assert.equal(result.referencia, 'Torre Oeste');
    });

    it('truncates excessive characters according to database constraints', () => {
      const longStreet = 'A'.repeat(150);
      const longRef = 'B'.repeat(80);
      const longNum = '1'.repeat(120);

      const result = buildEnderecoRequest({
        cep: '01001-000',
        rua: longStreet,
        numero: longNum,
        referencia: longRef,
      });

      assert.equal(result.rua?.length, 100);
      assert.equal(result.numero.length, 100);
      assert.equal(result.referencia.length, 50);
    });
  });

  describe('mapChamadoResponse', () => {
    it('maps response and appends cache-busting timestamp to fotoUrl', () => {
      const mockResponse: ChamadoResponse = {
        idChamado: 42,
        titulo: 'Buraco perigoso na via',
        descricao: 'Buraco de grandes proporções causando acidentes.',
        categoriaId: 2,
        categoriaNome: 'Buraco no Asfalto',
        prioridadeId: 1,
        prioridadeNome: 'Alta',
        orgaoId: 1,
        orgaoNome: 'Secretaria Municipal de Obras',
        dtAbertura: '2026-11-14T10:00:00Z',
        foto: '/api/v1/chamados/42/foto',
        usuarioId: 7,
        usuarioNome: 'Enzo Okuizumi',
        status: 'EM_ANALISE',
        totalVotos: 12,
        apoiadoPorMim: true,
        historico: [],
        endereco: {
          id: 1,
          cep: '01310100',
          rua: 'Avenida Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          referencia: 'Em frente ao shopping',
        },
      };

      const mapped = mapChamadoResponse(mockResponse);

      assert.equal(mapped.idChamado, 42);
      assert.equal(mapped.titulo, 'Buraco perigoso na via');
      assert.ok(mapped.fotoUrl?.includes('/api/v1/chamados/42/foto?v=2026-11-14T10%3A00%3A00Z'));
    });

    it('sets fotoUrl to undefined when response has no foto', () => {
      const mockResponse: ChamadoResponse = {
        idChamado: 43,
        titulo: 'Semáforo apagado',
        descricao: 'Cruzamento perigoso sem sinalização luminosa.',
        categoriaId: 3,
        categoriaNome: 'Semáforo com Defeito',
        prioridadeId: 2,
        prioridadeNome: 'Média',
        orgaoId: 2,
        orgaoNome: 'CET',
        status: 'PENDENTE',
        totalVotos: 0,
        apoiadoPorMim: false,
        historico: [],
        dtAbertura: '2026-11-14T11:00:00Z',
        foto: null as unknown as string,
        usuarioId: 7,
        usuarioNome: 'Enzo Okuizumi',
        endereco: {
          id: 2,
          cep: '01310100',
          rua: 'Rua Augusta',
          numero: 'S/N',
          bairro: 'Consolação',
          cidade: 'São Paulo',
          estado: 'SP',
          referencia: 'Cruzamento',
        },
      };

      const mapped = mapChamadoResponse(mockResponse);
      assert.equal(mapped.fotoUrl, undefined);
    });

    it('maps DotNet CriarChamadoResponse with localizacao, fotoBase64, and .NET property names', () => {
      const dotNetResponse = {
        id: 101,
        protocolo: 'ZEL-2026-0101',
        titulo: 'Vazamento na via pública',
        descricao: 'Vazamento contínuo de água limpa na sarjeta.',
        categoriaId: 3,
        categoria: 'DRENAGEM_E_ESGOTO',
        status: 'PENDENTE',
        prioridadeId: 2,
        prioridade: 'MEDIA',
        orgaoId: 1,
        orgao: 'Secretaria Municipal das Subprefeituras',
        apoiosCount: 15,
        apoiadoPeloUsuario: true,
        localizacao: {
          cep: '01310100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          pontoReferencia: 'Próximo ao MASP',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
        },
        fotoBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII=',
        fotoContentType: 'image/png',
        dataAbertura: '2026-11-15T14:30:00Z',
        dataAtualizacao: '2026-11-15T14:30:00Z',
        autorId: 99,
        autorNome: 'Cidadão Paulistano',
        historico: [
          {
            id: 1,
            data: '2026-11-15T14:30:00Z',
            statusAnterior: null,
            novoStatus: 'PENDENTE',
            observacao: 'Abertura de chamado pelo app móvel.',
            autorNome: 'Cidadão Paulistano',
          },
        ],
      };

      const mapped = mapChamadoResponse(dotNetResponse);

      assert.equal(mapped.idChamado, 101);
      assert.equal(mapped.protocolo, 'ZEL-2026-0101');
      assert.equal(mapped.categoriaNome, 'DRENAGEM_E_ESGOTO');
      assert.equal(mapped.prioridadeNome, 'MEDIA');
      assert.equal(mapped.usuarioId, 99);
      assert.equal(mapped.usuarioNome, 'Cidadão Paulistano');
      assert.equal(mapped.totalVotos, 15);
      assert.equal(mapped.apoiadoPorMim, true);
      assert.equal(mapped.endereco.rua, 'Avenida Paulista');
      assert.equal(mapped.endereco.referencia, 'Próximo ao MASP');
      assert.equal(mapped.endereco.bairro, 'Bela Vista');
      assert.equal(
        mapped.fotoUrl,
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY44YAAAAASUVORK5CYII='
      );
      assert.equal(mapped.historico.length, 1);
      assert.equal(mapped.historico[0]?.status, 'PENDENTE');
    });

    it('maps already formatted data: URI fotoBase64 without duplicating prefix', () => {
      const dotNetResponse = {
        id: 102,
        titulo: 'Lâmpada piscando',
        descricao: 'Poste em frente à residência.',
        categoriaId: 1,
        fotoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD',
      };

      const mapped = mapChamadoResponse(dotNetResponse);
      assert.equal(mapped.fotoUrl, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD');
    });
  });

  describe('toChamadoCreateRequest', () => {
    it('converts create form data with address and photo', () => {
      const mockPhoto: FotoUpload = {
        uri: 'file:///data/user/0/app/cache/camera.jpg',
        name: 'camera.jpg',
        type: 'image/jpeg',
      };

      const request = toChamadoCreateRequest({
        titulo: 'Buraco na calçada',
        descricao: 'Buraco que dificulta passagem de pedestres',
        categoriaId: 2,
        cep: '01310-100',
        rua: 'Av Paulista',
        numero: '500',
        referencia: 'Em frente ao museu',
        foto: mockPhoto,
      });

      assert.equal(request.endereco.cep, '01310100');
      assert.equal(request.endereco.numero, '500');
      assert.equal(request.foto, mockPhoto);
    });

    it('aligns create payload with .NET CriarChamadoRequest (titulo, descricao, categoriaId, cep, numero, referencia, fotoBase64)', () => {
      const mockPhoto: FotoUpload = {
        uri: 'file:///photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
        base64: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=',
      };

      const request = toChamadoCreateRequest({
        titulo: 'Árvore com galho quebrado',
        descricao: 'Risco iminente de queda de galho de grande porte sobre a fiação elétrica.',
        categoriaId: 5,
        cep: '04571-010',
        numero: '123',
        referencia: 'Em frente ao colégio',
        foto: mockPhoto,
      });

      assert.equal(request.titulo, 'Árvore com galho quebrado');
      assert.equal(request.descricao, 'Risco iminente de queda de galho de grande porte sobre a fiação elétrica.');
      assert.equal(request.categoriaId, 5);
      assert.equal(request.cep, '04571010');
      assert.equal(request.numero, '123');
      assert.equal(request.referencia, 'Em frente ao colégio');
      assert.equal(
        request.fotoBase64,
        'data:image/jpeg;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA='
      );
    });
  });

  describe('toChamadoRequest', () => {
    it('converts edit form data mapping categoriaId to canonical category name', () => {
      const request = toChamadoRequest({
        titulo: '  Poste com fiação exposta  ',
        descricao: '  Fios caídos no chão oferecendo risco de choque elétrico aos pedestres.  ',
        categoriaId: 1, // ILUMINACAO_PUBLICA in catalog
        cep: '01310-100',
        numero: '120',
        referencia: 'Próximo à padaria',
      });

      assert.equal(request.titulo, 'Poste com fiação exposta');
      assert.equal(request.descricao, 'Fios caídos no chão oferecendo risco de choque elétrico aos pedestres.');
      assert.equal(request.categoria, 'ILUMINACAO_PUBLICA');
      assert.equal(request.endereco.cep, '01310100');
    });

    it('throws error when categoriaId is unknown', () => {
      assert.throws(
        () =>
          toChamadoRequest({
            titulo: 'Título válido',
            descricao: 'Descrição longa o bastante para passar no formulário.',
            categoriaId: 99999,
            cep: '01310-100',
            numero: '10',
            referencia: 'Esquina',
          }),
        /Categoria desconhecida: 99999/
      );
    });
  });
});
