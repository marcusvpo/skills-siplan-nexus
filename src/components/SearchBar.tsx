
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, FileText, Video, Package } from 'lucide-react';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSelectResult?: (tipo: string, id: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectResult,
  placeholder = "Buscar sistemas, produtos ou videoaulas...",
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { search, clearSearch, isSearching, searchResults } = useAdvancedSearch();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm);
        setIsOpen(true);
      } else {
        clearSearch();
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, search, clearSearch]);

  const handleResultClick = (result: any) => {
    setSearchTerm(result.titulo);
    setIsOpen(false);
    if (onSelectResult) {
      onSelectResult(result.tipo, result.id);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    clearSearch();
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'sistema':
        return <Package className="h-4 w-4 text-primary" />;
      case 'produto':
        return <FileText className="h-4 w-4 text-success" />;
      case 'video_aula':
        return <Video className="h-4 w-4 text-destructive" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'sistema':
        return 'Sistema';
      case 'produto':
        return 'Produto';
      case 'video_aula':
        return 'Videoaula';
      default:
        return tipo;
    }
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 rounded-xl"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (searchResults.length > 0 || isSearching) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-card/70 backdrop-blur-md border-border/50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {isSearching && (
              <div className="p-3 text-center text-muted-foreground">
                <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                <span>Buscando...</span>
              </div>
            )}
            
            {!isSearching && searchResults.length === 0 && (
              <div className="p-3 text-center text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}

            {!isSearching && searchResults.map((result, index) => (
              <div
                key={`${result.tipo}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                className="p-3 hover:bg-accent/50 cursor-pointer border-b border-border/50 last:border-b-0"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  {getIcon(result.tipo)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-foreground font-medium truncate">
                        {result.titulo}
                      </span>
                      <Badge variant="secondary" className="shrink-0">
                        {getTypeLabel(result.tipo)}
                      </Badge>
                    </div>
                    {result.descricao && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {result.descricao}
                      </p>
                    )}
                    {result.similaridade && result.similaridade > 0.5 && (
                      <div className="mt-1">
                        <span className="text-xs text-success">
                          {Math.round(result.similaridade * 100)}% de similaridade
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
