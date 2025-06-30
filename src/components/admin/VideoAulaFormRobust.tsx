
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateVideoAula, useUpdateVideoAula } from '@/hooks/useSupabaseDataFixed';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Save, X, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
  ordem: number;
  produto_id: string;
}

interface ValidationErrors {
  titulo?: string;
  descricao?: string;
  url_video?: string;
  id_video_bunny?: string;
  url_thumbnail?: string;
}

interface VideoAulaFormRobustProps {
  sistema: Sistema;
  produto: Produto;
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const VideoAulaFormRobust: React.FC<VideoAulaFormRobustProps> = ({
  sistema,
  produto,
  videoAula,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    id_video_bunny: '',
    url_thumbnail: '',
    ordem: 1
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

  const createVideoAula = useCreateVideoAula();
  const updateVideoAula = useUpdateVideoAula();

  const isLoading = createVideoAula.isPending || updateVideoAula.isPending;

  // Inicializar dados do formulário
  useEffect(() => {
    if (videoAula) {
      setFormData({
        titulo: videoAula.titulo || '',
        descricao: videoAula.descricao || '',
        url_video: videoAula.url_video || '',
        id_video_bunny: videoAula.id_video_bunny || '',
        url_thumbnail: videoAula.url_thumbnail || '',
        ordem: videoAula.ordem || 1
      });
      logger.info('🔧 [VideoAulaFormRobust] Form initialized with existing data', {
        videoAulaId: videoAula.id,
        titulo: videoAula.titulo
      });
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        url_video: '',
        id_video_bunny: '',
        url_thumbnail: '',
        ordem: 1
      });
      logger.info('🔧 [VideoAulaFormRobust] Form initialized for new videoaula');
    }
  }, [videoAula]);

  // Validação de dados em tempo real
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'titulo':
        if (!value.trim()) return 'Título é obrigatório';
        if (value.length > 500) return 'Título deve ter no máximo 500 caracteres';
        if (value.trim().length < 3) return 'Título deve ter pelo menos 3 caracteres';
        break;
      
      case 'descricao':
        if (value && value.length > 5000) return 'Descrição deve ter no máximo 5000 caracteres';
        break;
      
      case 'url_video':
        if (value && !isValidUrl(value)) return 'URL do vídeo deve ser válida';
        if (value && value.length > 2000) return 'URL do vídeo muito longa';
        break;
      
      case 'id_video_bunny':
        if (value && value.length > 100) return 'ID do Bunny.net muito longo';
        if (value && !/^[a-zA-Z0-9\-_]+$/.test(value)) return 'ID do Bunny.net contém caracteres inválidos';
        break;
      
      case 'url_thumbnail':
        if (value && !isValidUrl(value)) return 'URL da thumbnail deve ser válida';
        if (value && value.length > 2000) return 'URL da thumbnail muito longa';
        break;
    }
    return undefined;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    setIsValidating(true);
    setValidationStatus('validating');
    
    logger.info('🔍 [VideoAulaFormRobust] Starting form validation', {
      formData: {
        titulo: formData.titulo.substring(0, 50) + '...',
        descricaoLength: formData.descricao.length,
        url_video: formData.url_video.substring(0, 50) + '...',
        id_video_bunny: formData.id_video_bunny
      }
    });

    const errors: ValidationErrors = {};
    
    // Validar cada campo
    Object.keys(formData).forEach(field => {
      if (field !== 'ordem') {
        const error = validateField(field, formData[field as keyof typeof formData] as string);
        if (error) {
          errors[field as keyof ValidationErrors] = error;
        }
      }
    });

    // Validações específicas para campos obrigatórios
    if (!formData.titulo.trim()) {
      errors.titulo = 'Título é obrigatório';
    }

    setValidationErrors(errors);
    
    const isValid = Object.keys(errors).length === 0;
    setValidationStatus(isValid ? 'valid' : 'invalid');
    setIsValidating(false);

    logger.info(`${isValid ? '✅' : '❌'} [VideoAulaFormRobust] Form validation result`, {
      isValid,
      errors: Object.keys(errors),
      errorMessages: errors
    });

    return isValid;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo específico quando usuário começa a digitar
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Validação em tempo real para título (crítico)
    if (field === 'titulo' && typeof value === 'string') {
      const error = validateField(field, value);
      if (error) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: error
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    logger.info('📹 [VideoAulaFormRobust] Form submission started', {
      isEditing: !!videoAula,
      formData: {
        titulo: formData.titulo.substring(0, 100),
        descricaoLength: formData.descricao.length,
        url_videoLength: formData.url_video.length,
        id_video_bunny: formData.id_video_bunny,
        produtoId: produto.id
      }
    });

    // Validar antes de enviar
    if (!validateForm()) {
      toast({
        title: "Dados inválidos",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      const videoAulaData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        url_video: formData.url_video.trim() || '',
        id_video_bunny: formData.id_video_bunny.trim() || undefined,
        url_thumbnail: formData.url_thumbnail.trim() || undefined,
        ordem: formData.ordem,
        produto_id: produto.id
      };

      logger.info('📹 [VideoAulaFormRobust] Submitting validated data', {
        dataSize: JSON.stringify(videoAulaData).length,
        videoAulaData: {
          ...videoAulaData,
          titulo: videoAulaData.titulo.substring(0, 50) + '...',
          descricao: videoAulaData.descricao ? 
            videoAulaData.descricao.substring(0, 50) + `... (${videoAulaData.descricao.length} chars)` : 
            undefined
        }
      });

      if (videoAula) {
        await updateVideoAula.mutateAsync({
          id: videoAula.id,
          ...videoAulaData
        });
      } else {
        await createVideoAula.mutateAsync(videoAulaData);
      }

      logger.info('✅ [VideoAulaFormRobust] Form submitted successfully');
      
      setTimeout(() => {
        onSuccess();
      }, 500);
      
    } catch (error) {
      logger.error('❌ [VideoAulaFormRobust] Form submission failed', { 
        error,
        formDataSize: JSON.stringify(formData).length,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      toast({
        title: "Erro ao salvar videoaula",
        description: error instanceof Error ? error.message : "Erro desconhecido. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'validating': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'valid': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'invalid': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          {videoAula ? 'Editar Videoaula' : 'Nova Videoaula'}
          {getValidationIcon()}
        </CardTitle>
        <div className="text-sm text-gray-400">
          <p><strong>Sistema:</strong> {sistema.nome}</p>
          <p><strong>Produto:</strong> {produto.nome}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="titulo" className="text-gray-300">
              Título da Videoaula *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              className={`bg-gray-700 border-gray-600 text-white ${
                validationErrors.titulo ? 'border-red-500' : ''
              }`}
              placeholder="Digite o título da videoaula (máx. 500 caracteres)"
              disabled={isLoading}
              required
              maxLength={500}
            />
            {validationErrors.titulo && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.titulo}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.titulo.length}/500 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="descricao" className="text-gray-300">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className={`bg-gray-700 border-gray-600 text-white ${
                validationErrors.descricao ? 'border-red-500' : ''
              }`}
              placeholder="Descrição da videoaula (máx. 5000 caracteres)"
              rows={4}
              disabled={isLoading}
              maxLength={5000}
            />
            {validationErrors.descricao && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.descricao}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.descricao.length}/5000 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="url_video" className="text-gray-300">
              URL do Vídeo
            </Label>
            <Input
              id="url_video"
              value={formData.url_video}
              onChange={(e) => handleInputChange('url_video', e.target.value)}
              className={`bg-gray-700 border-gray-600 text-white ${
                validationErrors.url_video ? 'border-red-500' : ''
              }`}
              placeholder="https://exemplo.com/video.mp4"
              disabled={isLoading}
              maxLength={2000}
            />
            {validationErrors.url_video && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.url_video}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id_video_bunny" className="text-gray-300">
                ID Bunny.net
              </Label>
              <Input
                id="id_video_bunny"
                value={formData.id_video_bunny}
                onChange={(e) => handleInputChange('id_video_bunny', e.target.value)}
                className={`bg-gray-700 border-gray-600 text-white ${
                  validationErrors.id_video_bunny ? 'border-red-500' : ''
                }`}
                placeholder="abc123-def456 (apenas letras, números, - e _)"
                disabled={isLoading}
                maxLength={100}
              />
              {validationErrors.id_video_bunny && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.id_video_bunny}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ordem" className="text-gray-300">
                Ordem
              </Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => handleInputChange('ordem', parseInt(e.target.value) || 1)}
                className="bg-gray-700 border-gray-600 text-white"
                min="1"
                max="999"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url_thumbnail" className="text-gray-300">
              URL Thumbnail
            </Label>
            <Input
              id="url_thumbnail"
              value={formData.url_thumbnail}
              onChange={(e) => handleInputChange('url_thumbnail', e.target.value)}
              className={`bg-gray-700 border-gray-600 text-white ${
                validationErrors.url_thumbnail ? 'border-red-500' : ''
              }`}
              placeholder="https://exemplo.com/thumbnail.jpg"
              disabled={isLoading}
              maxLength={2000}
            />
            {validationErrors.url_thumbnail && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.url_thumbnail}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading || Object.keys(validationErrors).length > 0 || !formData.titulo.trim()}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {videoAula ? 'Atualizar' : 'Salvar'} Videoaula
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-gray-600 text-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          {/* Debug Information (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-900/50 rounded border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Debug Info</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Form data size: {JSON.stringify(formData).length} bytes</p>
                <p>Validation errors: {Object.keys(validationErrors).length}</p>
                <p>Status: {validationStatus}</p>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
