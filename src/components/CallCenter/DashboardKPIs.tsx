import React from 'react';
import styles from './DashboardKPIs.module.css'; // Vamos criar esse CSS abaixo
import { DashboardStats } from '@/types';
import { Users, PhoneIncoming, CheckCircle, Clock, Zap, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  stats: DashboardStats;
}

export default function DashboardKPIs({ stats }: Props) {
  
  const calcPct = (val: number) => stats.total > 0 ? ((val / stats.total) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className={styles.grid}>
      <KpiCard label="Total Leads" value={stats.total} icon={Users} color="#3b82f6" />
      <KpiCard label="Atendidas" value={stats.atendidas} sub={calcPct(stats.atendidas)} icon={PhoneIncoming} color="#10b981" />
      <KpiCard label="Rec. no Dia" value={stats.recuperadosDia} sub={calcPct(stats.recuperadosDia)} icon={CheckCircle} color="#22c55e" />
      <KpiCard label="Rec. 7 Dias" value={stats.recuperadosDepois} sub={calcPct(stats.recuperadosDepois)} icon={Clock} color="#0ea5e9" />
      <KpiCard label="Voltou Antes" value={stats.recuperadosAntes} sub={calcPct(stats.recuperadosAntes)} icon={Zap} color="#8b5cf6" />
      <KpiCard label="Não Recup." value={stats.naoRecuperados} sub={calcPct(stats.naoRecuperados)} icon={XCircle} color="#ef4444" />
      <KpiCard label="Aguardando" value={stats.aguardando} sub={calcPct(stats.aguardando)} icon={AlertCircle} color="#f59e0b" />
      
      {/* Card Especial de Custo */}
      <div className={`${styles.card} ${styles.costCard}`}>
          <div className={styles.header}><Users size={14} /> Custo Total</div>
          <div className={styles.value}>R$ {stats.totalCusto.toFixed(2).replace('.', ',')}</div>
      </div>
    </div>
  );
}

// Subcomponente interno para evitar repetição
const KpiCard = ({ label, value, sub, icon: Icon, color }: any) => (
    <div className={styles.card}>
        <div className={styles.topBorder} style={{ backgroundColor: color }} />
        <div className={styles.header}>
            <Icon size={14} style={{ color }} /> {label}
        </div>
        <div className={styles.value}>{value}</div>
        {sub && <span className={styles.sub}>{sub}</span>}
    </div>
);