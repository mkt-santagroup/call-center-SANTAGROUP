import React, { useState, useMemo } from 'react';
import styles from './DashboardTable.module.css';
import { CallLead } from '@/types';
import { format, differenceInDays, isSameDay, isBefore } from 'date-fns';
import { 
  CheckCircle, XCircle, Clock, Gamepad2, ChevronLeft, ChevronRight, 
  Zap, AlertCircle, PhoneOutgoing, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';

interface Props {
  leads: CallLead[];
  loading: boolean;
}

// Tipos para ordenação
type SortKey = 'passport' | 'name' | 'last_login' | 'retorno' | 'time_played' | 'attempts' | null;
type SortDirection = 'asc' | 'desc';

export default function DashboardTable({ leads, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // --- ESTADO DA ORDENAÇÃO ---
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>Carregando dados...</div>
      </div>
    );
  }

  // --- LÓGICA DE ORDENAÇÃO ---
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Se clicou na mesma coluna, inverte a ordem
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é coluna nova, começa decrescente (maior para menor costuma ser mais útil)
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedLeads = useMemo(() => {
    if (!sortKey) return leads;

    return [...leads].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      // Define os valores baseados na chave
      switch (sortKey) {
        case 'passport':
          valA = Number(a.passport || a.id) || 0;
          valB = Number(b.passport || b.id) || 0;
          break;
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'last_login':
          valA = a.last_login_at_ingestion ? new Date(a.last_login_at_ingestion).getTime() : 0;
          valB = b.last_login_at_ingestion ? new Date(b.last_login_at_ingestion).getTime() : 0;
          break;
        case 'retorno':
          valA = a.current_last_login ? new Date(a.current_last_login).getTime() : 0;
          valB = b.current_last_login ? new Date(b.current_last_login).getTime() : 0;
          break;
        case 'time_played':
          valA = Number(a.time_played || 0);
          valB = Number(b.time_played || 0);
          break;
        case 'attempts':
          valA = (a.call_history || []).length;
          valB = (b.call_history || []).length;
          break;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [leads, sortKey, sortDirection]);

  // --- LÓGICA DE PAGINAÇÃO (Usa a lista ORDENADA) ---
  const totalLeads = sortedLeads.length;
  const totalPages = Math.ceil(totalLeads / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentLeads = sortedLeads.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // --- HELPERS VISUAIS ---
  // Componente para renderizar o cabeçalho clicável com setinha
  const SortableHeader = ({ label, cKey }: { label: string, cKey: SortKey }) => (
    <th 
        className={styles.sortableHeader} 
        onClick={() => handleSort(cKey)}
        title="Clique para ordenar"
    >
        <div className={styles.headerContent}>
            {label}
            {sortKey === cKey ? (
                sortDirection === 'asc' ? <ArrowUp size={14} className={styles.activeIcon}/> : <ArrowDown size={14} className={styles.activeIcon}/>
            ) : (
                <ArrowUpDown size={14} className={styles.inactiveIcon}/>
            )}
        </div>
    </th>
  );

  const safeFormat = (dateString: string | null, fmt: string = 'dd/MM HH:mm') => {
    if (!dateString) return '-';
    try { return format(new Date(dateString), fmt); } catch (e) { return '-'; }
  };

  const formatTimePlayed = (seconds: number | null) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // CALCULO DE CUSTO E STATUS
  const getCallStats = (lead: CallLead) => {
      const history = lead.call_history || [];
      const attempts = history.length;
      const totalCost = history.reduce((acc: number, curr: any) => acc + (Number(curr.price) || 0), 0);
      return { attempts, totalCost };
  };

  const getLeadStatus = (lead: CallLead) => {
    const now = new Date();
    
    if (lead.is_recovered && lead.current_last_login) {
        const loginDate = new Date(lead.current_last_login);
        const callDate = lead.called_at ? new Date(lead.called_at) : null;

        if (!callDate || isBefore(loginDate, callDate)) {
            return { label: 'Voltou Antes', icon: Zap, style: styles.badgePurple };
        }
        if (isSameDay(loginDate, callDate)) {
            return { label: 'Rec. Dia', icon: CheckCircle, style: styles.badgeGreen };
        }
        return { label: 'Rec. 7d', icon: Clock, style: styles.badgeBlue };
    }

    if (lead.called_at) {
        const callDate = new Date(lead.called_at);
        const daysSinceCall = differenceInDays(now, callDate);
        if (daysSinceCall > 7) {
            return { label: 'Não Voltou', icon: XCircle, style: styles.badgeRed };
        }
    }
    return { label: 'Aguardando', icon: AlertCircle, style: styles.badgeOrange };
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Listagem de Leads</h3>
        <span className={styles.countBadge}>
           Total de Leads: <strong>{totalLeads}</strong>
        </span>
      </div>

      <div className={styles.tableContainer}>
        {totalLeads === 0 ? (
           <div className={styles.empty}>Nenhum lead encontrado neste período.</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortableHeader label="Passport" cKey="passport" />
                  <SortableHeader label="Nome" cKey="name" />
                  <th>Whatsapp</th> {/* Whatsapp geralmente não precisa ordenar, mas pode se quiser */}
                  <SortableHeader label="Último Login" cKey="last_login" />
                  <SortableHeader label="Retorno" cKey="retorno" />
                  <SortableHeader label="Tempo Jogo" cKey="time_played" />
                  <th>Status</th>
                  <SortableHeader label="Tentativas" cKey="attempts" />
                </tr>
              </thead>
              <tbody>
                {currentLeads.map((lead) => {
                  const status = getLeadStatus(lead);
                  const Icon = status.icon;
                  const { attempts, totalCost } = getCallStats(lead);
                  
                  return (
                    <tr key={lead.id} className={lead.is_recovered ? styles.rowRecovered : ''}>
                      <td><span className={styles.passport}>#{lead.passport || lead.id}</span></td>
                      <td><div className={styles.name}>{lead.name || 'Desconhecido'}</div></td>
                      <td>{lead.whatsapp || '-'}</td>
                      <td><span className={styles.dateMuted}>{safeFormat(lead.last_login_at_ingestion)}</span></td>
                      <td>
                        {lead.is_recovered && lead.current_last_login ? (
                          <div className={styles.standardDate}>
                              <strong>{safeFormat(lead.current_last_login, 'dd/MM')}</strong>
                              <span>{safeFormat(lead.current_last_login, 'HH:mm')}</span>
                          </div>
                        ) : <span className={styles.muted}>-</span>}
                      </td>
                      <td>
                          <div className={styles.gameTime}>
                              <Gamepad2 size={14} style={{ opacity: 0.5 }} />
                              {formatTimePlayed(lead.time_played)}
                          </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${status.style}`}>
                          <Icon size={12} /> {status.label}
                        </span>
                      </td>
                      <td>
                          <div 
                            className={styles.attemptsData} 
                            title={`Custo Total: R$ ${totalCost.toFixed(2)}`}
                          >
                             <PhoneOutgoing size={14} />
                             <strong>{attempts}x</strong>
                          </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINAÇÃO */}
            <div className={styles.paginationFooter}>
                <div className={styles.rowsPerPage}>
                    <span>Itens por página:</span>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
                <div className={styles.pageControls}>
                    <span className={styles.pageInfo}>Pg <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
                    <button onClick={goToPrev} disabled={currentPage === 1} className={styles.pageBtn}><ChevronLeft size={16} /></button>
                    <button onClick={goToNext} disabled={currentPage === totalPages} className={styles.pageBtn}><ChevronRight size={16} /></button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}