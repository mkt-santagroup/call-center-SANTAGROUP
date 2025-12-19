// src/components/CallCenter/CallDashboard.tsx
import React, { useState } from 'react';
import styles from './CallDashboard.module.css';
import { RefreshCw, Loader2 } from 'lucide-react';
import { subDays } from 'date-fns';

// Importando os hooks separados
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

// Componentes Visuais
import DashboardKPIs from './DashboardKPIs';
import DashboardCharts from './DashboardCharts';
import DashboardTable from './DashboardTable';
import DateFilterPicker, { DateFilterState } from './DateFilterPicker';

export default function CallDashboard() {
  // 1. Estado Global do Filtro de Data (Controla ambos os hooks)
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    option: '7days',
    startDate: subDays(new Date(), 6),
    endDate: new Date()
  });

  // 2. Hook da Tabela (Focado em carregar linhas paginadas)
  const { 
    leads, 
    loading: tableLoading, 
    hasMore, 
    loadMore, // Se quiser usar scroll infinito ou botão "Ver mais" depois
    refetch: refetchTable 
  } = useLeadsTable(dateFilter);

  // 3. Hook das Métricas e Gráficos (Focado em matemática e tendências)
  const { 
    stats, 
    leadChartData, // <--- AQUI ESTÃO ELES
    callChartData, // <--- E AQUI TAMBÉM
    loadingMetrics, 
    refetchMetrics 
  } = useDashboardMetrics(dateFilter);

  // Função para atualizar tudo manualmente
  const handleGlobalRefresh = () => {
    refetchTable();
    refetchMetrics();
  };

  const isLoadingAny = tableLoading || loadingMetrics;

  return (
    <div className={styles.container}>
      {/* --- HEADER --- */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
            <div className={styles.title}>
                <h1>Gerenciamento de Ligações <span className={styles.liveBadge}>LIVE</span></h1>
            </div>
            <p className={styles.subtitle}>
              {tableLoading 
                ? 'Sincronizando dados...' 
                : `${leads.length} leads listados nesta página.`}
            </p>
        </div>

        <div className={styles.headerRight}>
            <DateFilterPicker 
              value={dateFilter} 
              onChange={setDateFilter} 
              disabled={isLoadingAny} 
            />

            <button onClick={handleGlobalRefresh} className={styles.refreshBtn} disabled={isLoadingAny}>
              {isLoadingAny ? <Loader2 size={18} className="spin"/> : <RefreshCw size={18}/>}
            </button>
        </div>
      </div>

      {/* --- KPIs (Cards do topo) --- */}
      <DashboardKPIs stats={stats} />

      {/* --- GRÁFICOS (Agora devidamente conectados) --- */}
      {/* Passamos o loadingMetrics para, se quiser, mostrar um spinner nos gráficos também */}
      <DashboardCharts 
        leadData={leadChartData} 
        callData={callChartData} 
      />

      {/* --- TABELA DE LEADS --- */}
      <DashboardTable 
        leads={leads} 
        loading={tableLoading} 
        onRefetch={refetchTable} 
      />
      
      {/* Estilos Globais de Animação */}
      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}