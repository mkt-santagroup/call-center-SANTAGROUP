// src/components/CallCenter/CallDashboard.tsx

import React, { useState, useCallback } from 'react';
import styles from './CallDashboard.module.css';
import DateFilterPicker, { DateFilterState } from './DateFilterPicker';
import DashboardKPIs from './DashboardKPIs';
import DashboardCharts from './DashboardCharts';
import DashboardTable from './DashboardTable';

// Hooks
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useLeadsTable } from '@/hooks/useLeadsTable';

export default function CallDashboard() {
  // 1. Estado Global do Filtro de Data
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ 
    option: 'today', 
    startDate: new Date(), 
    endDate: new Date() 
  });

  // 2. Chamada dos Hooks (passando o filtro)
  const { 
    stats, 
    leadChartData, 
    callChartData, 
    loadingMetrics, 
    refetchMetrics 
  } = useDashboardMetrics(dateFilter);

  const { 
    leads, 
    loading: loadingTable, 
    refetchLeads 
  } = useLeadsTable(dateFilter);

  // 3. Função de Reload Manual (Correção do Bug)
  const handleRefresh = useCallback(async () => {
    // Chama ambos os refetchs e espera terminarem
    await Promise.all([
      refetchMetrics(),
      refetchLeads()
    ]);
  }, [refetchMetrics, refetchLeads]);

  // Estado unificado de carregamento para o botão de refresh girar
  const isLoading = loadingMetrics || loadingTable;

  return (
    <div className={styles.container}>
      {/* TOPO: Filtro de Data + Botão de Reload */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Dashboard de Atendimento</h1>
            <p className={styles.pageSubtitle}>Acompanhe o desempenho e recuperação de leads em tempo real.</p>
        </div>
        
        <div className={styles.headerRight}>
            <DateFilterPicker 
                filter={dateFilter} 
                onChange={setDateFilter} 
                onRefresh={handleRefresh} 
                loading={isLoading}
            />
        </div>
      </div>

      {/* KPIs (Cards) */}
      <DashboardKPIs stats={stats} />

      {/* Gráficos */}
      {/* CORREÇÃO: Removida a propriedade 'loading' que não existe no componente DashboardCharts */}
      <DashboardCharts 
        leadData={leadChartData} 
        callData={callChartData} 
      />

      {/* Tabela de Leads */}
      <DashboardTable leads={leads} loading={loadingTable} />
    </div>
  );
}