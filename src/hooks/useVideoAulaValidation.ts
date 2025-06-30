
import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

interface VideoAulaData {
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

export const useVideoAulaValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateVideoAulaData = useCallback(async (data: VideoAulaData): Promise<ValidationResult> => {
    setIsValidating(true);
    
    logger.info('🔍 [useVideoAulaValidation] Starting comprehensive validation', {
      dataSize: JSON.stringify(data).length,
      titulo: data.titulo.substring(0, 50) + '...',
      descricaoLength: data.descricao?.length || 0
    });

    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    try {
      // Validação de título
      if (!data.titulo || !data.titulo.trim()) {
        errors.titulo = 'Título é obrigatório';
      } else if (data.titulo.trim().length < 3) {
        errors.titulo = 'Título deve ter pelo menos 3 caracteres';
      } else if (data.titulo.length > 500) {
        errors.titulo = 'Título deve ter no máximo 500 caracteres';
      } else if (data.titulo.includes('\n') || data.titulo.includes('\r')) {
        errors.titulo = 'Título não pode conter quebras de linha';
      }

      // Validação de descrição
      if (data.descricao) {
        if (data.descricao.length > 5000) {
          errors.descricao = 'Descrição deve ter no máximo 5000 caracteres';
        } else if (data.descricao.length > 2000) {
          warnings.descricao = 'Descrição muito longa pode afetar a performance';
        }
      }

      // Validação de URL do vídeo
      if (data.url_video) {
        if (data.url_video.length > 2000) {
          errors.url_video = 'URL do vídeo muito longa';
        } else if (!isValidUrl(data.url_video)) {
          errors.url_video = 'URL do vídeo deve ser válida';
        } else if (!isSupportedVideoUrl(data.url_video)) {
          warnings.url_video = 'URL pode não ser de um provedor de vídeo suportado';
        }
      }

      // Validação de ID do Bunny.net
      if (data.id_video_bunny) {
        if (data.id_video_bunny.length > 100) {
          errors.id_video_bunny = 'ID do Bunny.net muito longo';
        } else if (!/^[a-zA-Z0-9\-_]+$/.test(data.id_video_bunny)) {
          errors.id_video_bunny = 'ID do Bunny.net deve conter apenas letras, números, hífens e underscores';
        }
      }

      // Validação de URL da thumbnail
      if (data.url_thumbnail) {
        if (data.url_thumbnail.length > 2000) {
          errors.url_thumbnail = 'URL da thumbnail muito longa';
        } else if (!isValidUrl(data.url_thumbnail)) {
          errors.url_thumbnail = 'URL da thumbnail deve ser válida';
        } else if (!isSupportedImageUrl(data.url_thumbnail)) {
          warnings.url_thumbnail = 'URL pode não ser de uma imagem suportada';
        }
      }

      // Validação de ordem
      if (data.ordem < 1 || data.ordem > 9999) {
        errors.ordem = 'Ordem deve estar entre 1 e 9999';
      }

      // Validação de produto_id
      if (!data.produto_id || !isValidUUID(data.produto_id)) {
        errors.produto_id = 'ID do produto inválido';
      }

      // Validações de tamanho total
      const totalSize = JSON.stringify(data).length;
      if (totalSize > 50000) { // 50KB limit
        errors.general = 'Dados da videoaula muito grandes. Reduza o tamanho da descrição ou URLs';
      } else if (totalSize > 25000) { // 25KB warning
        warnings.general = 'Dados da videoaula estão ficando grandes';
      }

      const isValid = Object.keys(errors).length === 0;

      logger.info(`${isValid ? '✅' : '❌'} [useVideoAulaValidation] Validation complete`, {
        isValid,
        errorsCount: Object.keys(errors).length,
        warningsCount: Object.keys(warnings).length,
        totalSize,
        errors: Object.keys(errors),
        warnings: Object.keys(warnings)
      });

      return {
        isValid,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('❌ [useVideoAulaValidation] Validation error', { error });
      
      return {
        isValid: false,
        errors: { general: 'Erro na validação dos dados' },
        warnings: {}
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const isValidUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const isSupportedVideoUrl = (url: string): boolean => {
    const supportedDomains = [
      'bunnycdn.com',
      'b-cdn.net',
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'wistia.com',
      'jwplatform.com'
    ];

    try {
      const parsedUrl = new URL(url);
      return supportedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  };

  const isSupportedImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.toLowerCase();
      return imageExtensions.some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  };

  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  return {
    validateVideoAulaData,
    isValidating
  };
};
