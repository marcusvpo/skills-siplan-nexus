
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SyncDetail {
  username: string;
  email: string;
  status: 'created' | 'exists' | 'error' | 'skipped';
  message?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    totalFound: number;
    created: number;
    alreadyExists: number;
    errors: number;
    skippedNoEmail: number;
  };
  details: SyncDetail[];
}

export const CartorioUserSync: React.FC = () => {
  const [dummyPassword, setDummyPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    if (!dummyPassword.trim()) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, forneça a senha genérica para criar os usuários.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSyncResult(null);

    try {
      const response = await fetch('/functions/v1/sync-cartorio-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dummyPassword }),
      });

      const result: SyncResult = await response.json();

      if (response.ok) {
        setSyncResult(result);
        toast({
          title: "Sincronização concluída",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
      } else {
        throw new Error(result.message || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'exists':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge className="bg-green-600 text-white">Criado</Badge>;
      case 'exists':
        return <Badge className="bg-yellow-600 text-white">Já Existe</Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white">Erro</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-500" />
            Sincronização de Usuários de Cartório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-gray-300">
              Esta operação criará usuários no sistema de autenticação do Supabase para todos os usuários de cartório que possuem e-mail válido.
              Uma senha genérica será utilizada para todos os usuários criados.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-gray-300">Senha Genérica para Usuários</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={dummyPassword}
                onChange={(e) => setDummyPassword(e.target.value)}
                placeholder="Digite uma senha forte (ex: SiplanUserPassword!2024)"
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSync}
            disabled={isLoading || !dummyPassword.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Iniciar Sincronização
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {syncResult && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Resultado da Sincronização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{syncResult.stats.totalFound}</div>
                <div className="text-sm text-gray-400">Total Encontrados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{syncResult.stats.created}</div>
                <div className="text-sm text-gray-400">Criados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{syncResult.stats.alreadyExists}</div>
                <div className="text-sm text-gray-400">Já Existiam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{syncResult.stats.errors}</div>
                <div className="text-sm text-gray-400">Erros</div>
              </div>
            </div>

            {syncResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Detalhes por Usuário:</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {syncResult.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(detail.status)}
                        <div>
                          <div className="text-white font-medium">{detail.username}</div>
                          <div className="text-gray-400 text-sm">{detail.email}</div>
                          {detail.message && (
                            <div className="text-gray-500 text-xs mt-1">{detail.message}</div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(detail.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
