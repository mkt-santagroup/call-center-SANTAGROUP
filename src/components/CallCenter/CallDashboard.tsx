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
  // 1. ESTADO DA TABELA ATIVA (Default: D2)
  const [activeTable, setActiveTable] = useState<'CALL_LEADS_D1' | 'CALL_LEADS_D2'>('CALL_LEADS_D2');

  const [dateFilter, setDateFilter] = useState<DateFilterState>({ 
    option: 'today', 
    startDate: new Date(), 
    endDate: new Date() 
  });

  // 2. Passamos activeTable para os hooks
  const { 
    stats, 
    leadChartData, 
    callChartData, 
    loadingMetrics, 
    refetchMetrics 
  } = useDashboardMetrics(dateFilter, activeTable);

  // IMPORTANTE: Certifique-se de que useLeadsTable.ts também foi atualizado para receber (dateFilter, tableName)
  const { 
    leads, 
    loading: loadingTable, 
    refetchLeads 
  } = useLeadsTable(dateFilter, activeTable);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchMetrics(),
      refetchLeads()
    ]);
  }, [refetchMetrics, refetchLeads]);

  const isLoading = loadingMetrics || loadingTable;

  // Estilos simples para os botões de troca
  const getBtnStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    backgroundColor: isActive ? '#ef4444' : '#262626',
    color: isActive ? '#fff' : '#a3a3a3',
    transition: 'all 0.2s',
    fontSize: '0.85rem'
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Dashboard de Atendimento</h1>
            
            {/* --- SELETOR DE FILA --- */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                    style={getBtnStyle(activeTable === 'CALL_LEADS_D1')}
                    onClick={() => setActiveTable('CALL_LEADS_D1')}
                >
                    FILA D+1
                </button>
                <button 
                    style={getBtnStyle(activeTable === 'CALL_LEADS_D2')}
                    onClick={() => setActiveTable('CALL_LEADS_D2')}
                >
                    FILA D+2
                </button>
            </div>
            {/* ----------------------- */}
            
            <p className={styles.pageSubtitle} style={{ marginTop: '10px' }}>
                Visualizando dados de: <strong>{activeTable === 'CALL_LEADS_D1' ? 'D+1 (Ontem)' : 'D+2 (Anteontem)'}</strong>
            </p>
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

      <DashboardKPIs stats={stats} />

      <DashboardCharts 
        leadData={leadChartData} 
        callData={callChartData} 
      />

      <DashboardTable leads={leads} loading={loadingTable} />
    </div>
  );
}