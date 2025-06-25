
export interface System {
  id: string;
  name: string;
  description: string;
  icon: string;
  products: Product[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  systemId: string;
  lessons: Lesson[];
  progress: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
  favorite: boolean;
  productId: string;
  systemId: string;
  transcript?: string;
  aiTags?: string[];
}

export const systems: System[] = [
  {
    id: 'orion',
    name: 'Orion',
    description: 'Sistema completo para gestão cartorária',
    icon: '🌟',
    products: [
      {
        id: 'orion-tn',
        name: 'Orion TN',
        description: 'Sistema para Tabelionato de Notas',
        systemId: 'orion',
        progress: 65,
        lessons: [
          {
            id: 'orion-tn-1',
            title: 'Introdução ao Orion TN',
            description: 'Visão geral do sistema e principais funcionalidades',
            duration: '15:30',
            videoUrl: 'sample-video-1',
            completed: true,
            favorite: false,
            productId: 'orion-tn',
            systemId: 'orion'
          },
          {
            id: 'orion-tn-2',
            title: 'Cadastro de Clientes',
            description: 'Como cadastrar e gerenciar clientes no sistema',
            duration: '22:15',
            videoUrl: 'sample-video-2',
            completed: false,
            favorite: true,
            productId: 'orion-tn',
            systemId: 'orion'
          }
        ]
      },
      {
        id: 'orion-pro',
        name: 'Orion Pro',
        description: 'Versão profissional do sistema Orion',
        systemId: 'orion',
        progress: 30,
        lessons: [
          {
            id: 'orion-pro-1',
            title: 'Recursos Avançados do Orion Pro',
            description: 'Explorando funcionalidades exclusivas da versão Pro',
            duration: '28:45',
            videoUrl: 'sample-video-3',
            completed: false,
            favorite: false,
            productId: 'orion-pro',
            systemId: 'orion'
          }
        ]
      },
      {
        id: 'orion-reg',
        name: 'Orion Reg',
        description: 'Sistema para Registro de Imóveis',
        systemId: 'orion',
        progress: 0,
        lessons: []
      }
    ]
  },
  {
    id: 'siplan',
    name: 'Siplan',
    description: 'Soluções integradas para cartórios',
    icon: '📋',
    products: [
      {
        id: 'siplan-webri',
        name: 'Siplan WEBRI',
        description: 'Sistema web para Registro de Imóveis',
        systemId: 'siplan',
        progress: 45,
        lessons: []
      },
      {
        id: 'siplan-webtd',
        name: 'Siplan WEBTD',
        description: 'Sistema web para Títulos e Documentos',
        systemId: 'siplan',
        progress: 20,
        lessons: []
      }
    ]
  },
  {
    id: 'control-m',
    name: 'Control-M',
    description: 'Sistema de controle e monitoramento',
    icon: '⚙️',
    products: [
      {
        id: 'control-m-reg',
        name: 'Control-M REG',
        description: 'Controle para Registro de Imóveis',
        systemId: 'control-m',
        progress: 10,
        lessons: []
      }
    ]
  },
  {
    id: 'global',
    name: 'Global',
    description: 'Soluções globais para cartórios',
    icon: '🌍',
    products: [
      {
        id: 'global-cartorios',
        name: 'Global Cartórios',
        description: 'Sistema integrado para múltiplos cartórios',
        systemId: 'global',
        progress: 75,
        lessons: []
      }
    ]
  }
];

// Dados de usuário fictícios para demonstração
export const getUserProgress = () => ({
  continueLearning: [
    {
      id: 'orion-tn-2',
      title: 'Cadastro de Clientes',
      description: 'Como cadastrar e gerenciar clientes no sistema',
      progress: 60,
      productName: 'Orion TN',
      systemName: 'Orion'
    }
  ],
  favorites: [
    {
      id: 'orion-tn-2',
      title: 'Cadastro de Clientes',
      description: 'Como cadastrar e gerenciar clientes no sistema',
      productName: 'Orion TN',
      systemName: 'Orion'
    }
  ],
  recentHistory: [
    {
      id: 'orion-tn-1',
      title: 'Introdução ao Orion TN',
      description: 'Visão geral do sistema e principais funcionalidades',
      lastViewed: '2024-06-24 14:30',
      status: 'Concluído',
      productName: 'Orion TN',
      systemName: 'Orion'
    }
  ]
});
