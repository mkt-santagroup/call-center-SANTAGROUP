// src/types/index.ts

export interface CallLead {
  id: number;
  passport: number;
  name: string | null;
  whatsapp: string | null;
  time_played: number | null;
  last_login_at_ingestion: string;
  current_last_login: string | null;
  called_at: string | null;
  is_recovered: boolean;
  created_at: string;
  call_count?: number; 
  call_history?: CallHistoryItem[]; 
}

export interface CallHistoryItem {
  call_number: number;
  date: string;
  status: string;
  price: number;
}

// Dados para o Gráfico de Tendência
export interface ChartDataLead {
  name: string; // Data formatada (dd/MM)
  total: number;
  atendidas: number;
  rec_dia: number;
  rec_depois: number;
  rec_antes: number;
  nao_rec: number;
  aguardando: number;
}

// Dados para o Gráfico de Chamadas
export interface ChartDataCall {
  name: string;
  answered: number;
  no_answer: number;
  failed: number;
  busy: number;
}

export interface DashboardStats {
  total: number;
  atendidas: number;
  recuperadosDia: number;
  recuperadosDepois: number;
  recuperadosAntes: number;
  naoRecuperados: number; // Perdidos
  aguardando: number;
  totalCusto: number;
}