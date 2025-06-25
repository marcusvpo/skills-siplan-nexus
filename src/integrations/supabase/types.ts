export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      acessos_cartorio: {
        Row: {
          ativo: boolean
          cartorio_id: string
          data_criacao: string
          data_expiracao: string
          email_contato: string | null
          id: string
          login_token: string
        }
        Insert: {
          ativo?: boolean
          cartorio_id: string
          data_criacao?: string
          data_expiracao: string
          email_contato?: string | null
          id?: string
          login_token: string
        }
        Update: {
          ativo?: boolean
          cartorio_id?: string
          data_criacao?: string
          data_expiracao?: string
          email_contato?: string | null
          id?: string
          login_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessos_cartorio_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          email: string
          id: string
          nome: string | null
        }
        Insert: {
          email: string
          id: string
          nome?: string | null
        }
        Update: {
          email?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      cartorios: {
        Row: {
          cnpj: string
          data_cadastro: string
          id: string
          nome: string
        }
        Insert: {
          cnpj: string
          data_cadastro?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string
          data_cadastro?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      favoritos_cartorio: {
        Row: {
          cartorio_id: string
          data_favoritado: string
          id: string
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          data_favoritado?: string
          id?: string
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          data_favoritado?: string
          id?: string
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_cartorio_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_cartorio_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          descricao: string | null
          id: string
          ordem: number | null
          produto_id: string
          tempo_estimado_min: number | null
          titulo: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          ordem?: number | null
          produto_id: string
          tempo_estimado_min?: number | null
          titulo: string
        }
        Update: {
          descricao?: string | null
          id?: string
          ordem?: number | null
          produto_id?: string
          tempo_estimado_min?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          sistema_id: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          sistema_id: string
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          sistema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_sistema_id_fkey"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "sistemas"
            referencedColumns: ["id"]
          },
        ]
      }
      sistemas: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      video_aulas: {
        Row: {
          descricao: string | null
          duracao_segundos: number | null
          id: string
          id_video_bunny: string
          modulo_id: string
          ordem: number | null
          tags_ia: string[] | null
          titulo: string
          transcricao_texto: string | null
          url_thumbnail: string | null
          url_video: string
        }
        Insert: {
          descricao?: string | null
          duracao_segundos?: number | null
          id?: string
          id_video_bunny: string
          modulo_id: string
          ordem?: number | null
          tags_ia?: string[] | null
          titulo: string
          transcricao_texto?: string | null
          url_thumbnail?: string | null
          url_video: string
        }
        Update: {
          descricao?: string | null
          duracao_segundos?: number | null
          id?: string
          id_video_bunny?: string
          modulo_id?: string
          ordem?: number | null
          tags_ia?: string[] | null
          titulo?: string
          transcricao_texto?: string | null
          url_thumbnail?: string | null
          url_video?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_embeddings: {
        Row: {
          chunk_index: number
          content: string
          embedding: string
          id: string
          timestamp_fim_segundos: number | null
          timestamp_inicio_segundos: number | null
          video_aula_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          embedding: string
          id?: string
          timestamp_fim_segundos?: number | null
          timestamp_inicio_segundos?: number | null
          video_aula_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          embedding?: string
          id?: string
          timestamp_fim_segundos?: number | null
          timestamp_inicio_segundos?: number | null
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_embeddings_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizacoes_cartorio: {
        Row: {
          cartorio_id: string
          completo: boolean
          id: string
          progresso_segundos: number
          ultima_visualizacao: string
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          completo?: boolean
          id?: string
          progresso_segundos?: number
          ultima_visualizacao?: string
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          completo?: boolean
          id?: string
          progresso_segundos?: number
          ultima_visualizacao?: string
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualizacoes_cartorio_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_cartorio_video_aula_id_fkey"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_cartorio_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
