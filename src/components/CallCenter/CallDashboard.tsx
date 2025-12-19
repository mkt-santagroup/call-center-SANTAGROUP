import React from 'react';
import styles from './CallDashboard.module.css';
import { useCallCenter } from '@/hooks/useCallCenter';
import { RefreshCw, Loader2 } from 'lucide-react'; // Loader2 para animação de loading

import DashboardKPIs from './DashboardKPIs';
import DashboardCharts from './DashboardCharts';
import DashboardTable from './DashboardTable';
import DateFilterPicker from './DateFilterPicker'; // <--- Import novo

export default function CallDashboard() {
  // Pegamos o dateFilter e setDateFilter do hook
  const { leads, loading, stats, leadChartData, callChartData, dateFilter, setDateFilter, refetch } = useCallCenter();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
            <div className={styles.title}>
                <h1>Gerenciamento de Ligações <span className={styles.liveBadge}>LIVE</span></h1>
            </div>
            <p className={styles.subtitle}>
              {loading 
                ? 'Sincronizando dados...' 
                : `${leads.length} leads carregados.`}
            </p>
        </div>

        <div className={styles.headerRight}>
            {/* COMPONENTE DE DATA AQUI */}
            <DateFilterPicker 
              value={dateFilter} 
              onChange={setDateFilter} 
              disabled={loading} 
            />

            <button onClick={() => refetch()} className={styles.refreshBtn} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin"/> : <RefreshCw size={18}/>}
            </button>
        </div>
      </div>

      <DashboardKPIs stats={stats} />

      <DashboardCharts leadData={leadChartData} callData={callChartData} />

      <DashboardTable leads={leads} loading={loading} onRefetch={refetch} />
      
      {/* Estilo globalzinho para girar o loader */}
      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}