// ✅ Tipos baseados no schema real do banco
export interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  produtos?: Produto[];
}

export interface Produto {
  id: string;
  sistema_id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  video_aulas?: VideoAula[];
}

export interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  id_video_bunny?: string;
  url_video: string;
  url_thumbnail?: string; // ✅ EXISTE no banco
  produto_id?: string;
  transcricao_completa_texto?: string;
}

export interface VideoAulaDetalhada extends VideoAula {
  produtos?: (Produto & {
    sistemas?: Sistema;
  });
}

export interface Cartorio {
  id: string;
  nome: string;
  data_cadastro: string;
  cidade?: string;
  estado?: string;
  is_active?: boolean;
  observacoes?: string;
}

export interface CartorioUsuario {
  id: string;
  cartorio_id: string;
  username: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
  user_id?: string;
  auth_user_id?: string;
  updated_at?: string;
}

export interface VisualizacaoCartorio {
  id: string;
  cartorio_id: string;
  video_aula_id: string;
  completo: boolean;
  data_conclusao?: string;
  concluida?: boolean;
  user_id?: string;
}

export interface Admin {
  id: string;
  email: string;
  nome?: string;
}

export interface ProgressoGeral {
  [productId: string]: {
    total: number;
    completas: number;
    percentual: number;
  };
}
