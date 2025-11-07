
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, RefreshCw, Trash2, Users, Shield, Edit, Calendar, MapPin, Copy, Eye, EyeOff, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { useCartoriosAdminFixed } from '@/hooks/useCartoriosAdminFixed';
import { useCartorioSessions } from '@/hooks/useCartorioSessions';
import { toast } from '@/hooks/use-toast';
import { CartorioUserManager } from './CartorioUserManager';
import { CartorioEditor } from './CartorioEditor';
import { CartorioFormDialog } from './CartorioFormDialog';
import { CartorioPermissionsManager } from './CartorioPermissionsManager';
import { CartorioCard } from './CartorioCard';

const CartorioManagerRestored: React.FC = () => {
  const [isNewCartorioOpen, setIsNewCartorioOpen] = useState(false);
  const [selectedCartorioForUsers, setSelectedCartorioForUsers] = useState<any>(null);
  const [selectedCartorioForEdit, setSelectedCartorioForEdit] = useState<any>(null);
  const [selectedCartorioForPermissions, setSelectedCartorioForPermissions] = useState<any>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSistema, setFilterSistema] = useState<string>("all");
  const [filterProduto, setFilterProduto] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "alpha">("alpha");
  const [sistemas, setSistemas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [cartorioPermissions, setCartorioPermissions] = useState<Map<string, any[]>>(new Map());

  const { cartorios, isLoading, error, refetch, deleteCartorio } = useCartoriosAdminFixed();
  const sessions = useCartorioSessions();

  // Carregar sistemas e produtos
  React.useEffect(() => {
    const loadData = async () => {
      const { data: sistemasData } = await supabase.from('sistemas').select('*').order('nome');
      const { data: produtosData } = await supabase.from('produtos').select('*').order('nome');
      const { data: permissionsData } = await supabase.from('cartorio_acesso_conteudo').select('*');
      
      if (sistemasData) setSistemas(sistemasData);
      if (produtosData) setProdutos(produtosData);
      
      // Organizar permissões por cartório
      if (permissionsData) {
        const permMap = new Map();
        permissionsData.forEach(perm => {
          if (!permMap.has(perm.cartorio_id)) {
            permMap.set(perm.cartorio_id, []);
          }
          permMap.get(perm.cartorio_id).push(perm);
        });
        setCartorioPermissions(permMap);
      }
    };
    loadData();
  }, []);

  // Filtrar e ordenar cartórios
  const filteredCartorios = cartorios
    .filter(cartorio => {
      // Filtro de busca por nome
      if (searchTerm && !cartorio.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      const permissions = cartorioPermissions.get(cartorio.id) || [];
      
      // Filtro por Sistema
      if (filterSistema !== "all") {
        const hasSystemAccess = permissions.some(perm => 
          perm.ativo && (perm.sistema_id === filterSistema && !perm.produto_id)
        );
        const hasProductInSystem = permissions.some(perm => {
          if (!perm.ativo || !perm.produto_id) return false;
          const produto = produtos.find(p => p.id === perm.produto_id);
          return produto && produto.sistema_id === filterSistema;
        });
        if (!hasSystemAccess && !hasProductInSystem) return false;
      }
      
      // Filtro por Produto
      if (filterProduto !== "all") {
        const hasProductAccess = permissions.some(perm => 
          perm.ativo && perm.produto_id === filterProduto
        );
        if (!hasProductAccess) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "alpha") {
        return a.nome.localeCompare(b.nome);
      }
      const dateA = new Date(a.data_cadastro || 0).getTime();
      const dateB = new Date(b.data_cadastro || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const handleDeleteCartorio = async (cartorio: any) => {
    if (!window.confirm(`Tem certeza que deseja deletar o cartório "${cartorio.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteCartorio(cartorio.id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast({
        title: "Token copiado!",
        description: "O token foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o token.",
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando cartórios...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-400 text-center mb-4">{error}</p>
          <Button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Cartórios</h2>
          <p className="text-gray-400">Gerencie cartórios, usuários e permissões de acesso</p>
        </div>
        <Button 
          onClick={() => setIsNewCartorioOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartório
        </Button>
      </div>

      {/* Filtros avançados */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-300">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar cartório por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Sistema</Label>
              <Select value={filterSistema} onValueChange={(v: any) => setFilterSistema(v)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Sistemas</SelectItem>
                  {sistemas.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Produto</Label>
              <Select value={filterProduto} onValueChange={(v: any) => setFilterProduto(v)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {produtos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Ordenar</Label>
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Ordem Alfabética</SelectItem>
                  <SelectItem value="asc">Mais Antigos</SelectItem>
                  <SelectItem value="desc">Mais Recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cartórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCartorios.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchTerm ? 'Nenhum cartório encontrado' : 'Nenhum cartório cadastrado'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? 'Tente buscar por outro nome' : 'Comece criando seu primeiro cartório'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsNewCartorioOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Cartório
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCartorios.map((cartorio, index) => {
            const sessionData = sessions.get(cartorio.id);
            return (
              <CartorioCard
                key={cartorio.id}
                numero={index + 1}
                cartorio={cartorio}
                sessionData={sessionData || null}
                onEditCartorio={(c) => setSelectedCartorioForEdit(c)}
                onManageUsers={(c) => setSelectedCartorioForUsers(c)}
                onManageAccess={(c) => setSelectedCartorioForPermissions(c)}
              />
            );
          })
        )}
      </div>

      {/* Modals */}
      <CartorioFormDialog
        isOpen={isNewCartorioOpen}
        onClose={() => setIsNewCartorioOpen(false)}
        onSuccess={() => refetch()}
      />

      {selectedCartorioForUsers && (
        <CartorioUserManager
          cartorioId={selectedCartorioForUsers.id}
          cartorioName={selectedCartorioForUsers.nome}
          isOpen={!!selectedCartorioForUsers}
          onClose={() => setSelectedCartorioForUsers(null)}
        />
      )}

      {selectedCartorioForEdit && (
        <CartorioEditor
          cartorio={selectedCartorioForEdit}
          isOpen={!!selectedCartorioForEdit}
          onClose={() => setSelectedCartorioForEdit(null)}
          onUpdate={() => {
            refetch();
            setSelectedCartorioForEdit(null);
          }}
        />
      )}

      {selectedCartorioForPermissions && (
        <CartorioPermissionsManager
          cartorio={selectedCartorioForPermissions}
          isOpen={!!selectedCartorioForPermissions}
          onClose={() => setSelectedCartorioForPermissions(null)}
          onUpdate={() => refetch()}
        />
      )}
    </div>
  );
};

export default CartorioManagerRestored;
