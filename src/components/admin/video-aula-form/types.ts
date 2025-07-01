
export interface Sistema {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  sistema_id: string;
  ordem: number;
}

export interface VideoAula {
  id: string;
  titulo: string;
  descricao?: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
  produto_id: string;
}

export interface VideoAulaFormProps {
  sistema: Sistema;
  produto: Produto;
  videoAula?: VideoAula | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface VideoAulaFormData {
  titulo: string;
  descricao: string;
  url_video: string;
  id_video_bunny: string;
  ordem: number;
}
