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
          {
            foreignKeyName: "fk_acessos_cartorio"
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
      cartorio_usuarios: {
        Row: {
          cartorio_id: string
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          username: string
        }
        Insert: {
          cartorio_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          username: string
        }
        Update: {
          cartorio_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartorio_usuarios_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cartorio_usuarios_cartorio"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
        ]
      }
      cartorios: {
        Row: {
          cidade: string | null
          data_cadastro: string
          estado: string | null
          id: string
          is_active: boolean | null
          nome: string
          observacoes: string | null
        }
        Insert: {
          cidade?: string | null
          data_cadastro?: string
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          observacoes?: string | null
        }
        Update: {
          cidade?: string | null
          data_cadastro?: string
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          observacoes?: string | null
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
          {
            foreignKeyName: "fk_favoritos_cartorio"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_favoritos_video_aula"
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
          ordem: number
          produto_id: string
          tempo_estimado_min: number | null
          titulo: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          ordem?: number
          produto_id: string
          tempo_estimado_min?: number | null
          titulo: string
        }
        Update: {
          descricao?: string | null
          id?: string
          ordem?: number
          produto_id?: string
          tempo_estimado_min?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_modulos_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
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
          ordem: number
          sistema_id: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          sistema_id: string
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          sistema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produtos_sistema"
            columns: ["sistema_id"]
            isOneToOne: false
            referencedRelation: "sistemas"
            referencedColumns: ["id"]
          },
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
          ordem: number
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      video_aulas: {
        Row: {
          descricao: string | null
          id: string
          id_video_bunny: string | null
          ordem: number
          produto_id: string | null
          titulo: string
          url_thumbnail: string | null
          url_video: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          id_video_bunny?: string | null
          ordem?: number
          produto_id?: string | null
          titulo: string
          url_thumbnail?: string | null
          url_video?: string
        }
        Update: {
          descricao?: string | null
          id?: string
          id_video_bunny?: string | null
          ordem?: number
          produto_id?: string | null
          titulo?: string
          url_thumbnail?: string | null
          url_video?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_aulas_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_aulas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
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
            foreignKeyName: "fk_video_embeddings_video_aula"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
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
          cartorio_usuario_id: string | null
          completo: boolean
          id: string
          progresso_segundos: number
          ultima_visualizacao: string
          video_aula_id: string
        }
        Insert: {
          cartorio_id: string
          cartorio_usuario_id?: string | null
          completo?: boolean
          id?: string
          progresso_segundos?: number
          ultima_visualizacao?: string
          video_aula_id: string
        }
        Update: {
          cartorio_id?: string
          cartorio_usuario_id?: string | null
          completo?: boolean
          id?: string
          progresso_segundos?: number
          ultima_visualizacao?: string
          video_aula_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_visualizacoes_cartorio"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_visualizacoes_video_aula"
            columns: ["video_aula_id"]
            isOneToOne: false
            referencedRelation: "video_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_cartorio_cartorio_id_fkey"
            columns: ["cartorio_id"]
            isOneToOne: false
            referencedRelation: "cartorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_cartorio_cartorio_usuario_id_fkey"
            columns: ["cartorio_usuario_id"]
            isOneToOne: false
            referencedRelation: "cartorio_usuarios"
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
      get_current_cartorio_usuario_id: {
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
