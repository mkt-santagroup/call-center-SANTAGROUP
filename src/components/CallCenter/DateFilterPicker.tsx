// src/components/CallCenter/DateFilterPicker.tsx

import React, { useState } from 'react';
import styles from './DateFilterPicker.module.css';
import { Calendar, ChevronDown, RefreshCw, ArrowLeft, Check } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYesterday, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateFilterOption = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lifetime' | 'custom';

export interface DateFilterState {
  option: DateFilterOption;
  startDate: Date | null;
  endDate: Date | null;
}

interface Props {
  filter: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function DateFilterPicker({ filter, onChange, onRefresh, loading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // Estados locais para as datas do modo personalizado
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const labels: Record<string, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    last7: 'Últimos 7 dias',
    last30: 'Últimos 30 dias',
    thisMonth: 'Este Mês',
    lifetime: 'Todo o Período',
    custom: 'Personalizado',
  };

  const handleSelect = (option: DateFilterOption) => {
    if (option === 'custom') {
      setIsCustomMode(true);
      return;
    }

    const today = new Date();
    let start: Date | null = today;
    let end: Date | null = today;

    switch (option) {
      case 'today':
        start = today; end = today; break;
      case 'yesterday':
        start = startOfYesterday(); end = startOfYesterday(); break;
      case 'last7':
        start = subDays(today, 6); end = today; break;
      case 'last30':
        start = subDays(today, 29); end = today; break;
      case 'thisMonth':
        start = startOfMonth(today); end = endOfMonth(today); break;
      case 'lifetime':
        start = null; end = null; break;
    }

    onChange({ option, startDate: start, endDate: end });
    setIsOpen(false);
    setIsCustomMode(false);
  };

  const applyCustomDate = () => {
    if (!customStart || !customEnd) return;
    
    const start = parseISO(customStart);
    const end = parseISO(customEnd);

    if (isValid(start) && isValid(end)) {
        onChange({ 
            option: 'custom', 
            startDate: start, 
            endDate: end 
        });
        setIsOpen(false);
        setIsCustomMode(false);
    }
  };

  const getButtonLabel = () => {
     if (filter.option === 'lifetime') return 'Todo o Período';
     if (!filter.startDate || !filter.endDate) return labels[filter.option];
     
     const fmt = (d: Date) => format(d, 'dd MMM', { locale: ptBR });
     if (filter.option === 'today' || filter.option === 'yesterday') return `${labels[filter.option]} (${fmt(filter.startDate)})`;
     
     return `${fmt(filter.startDate)} - ${fmt(filter.endDate)}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.dropdownWrapper}>
        <button className={styles.triggerBtn} onClick={() => { setIsOpen(!isOpen); setIsCustomMode(false); }}>
           <Calendar size={16} className={styles.icon} />
           <span>{getButtonLabel()}</span>
           <ChevronDown size={14} className={styles.chevron} />
        </button>

        {isOpen && (
           <div className={styles.menu}>
              {!isCustomMode ? (
                  // LISTA DE OPÇÕES
                  (Object.keys(labels) as DateFilterOption[]).map((key) => (
                      <button 
                        key={key} 
                        className={`${styles.menuItem} ${filter.option === key ? styles.active : ''}`}
                        onClick={() => handleSelect(key)}
                      >
                        {labels[key]}
                      </button>
                  ))
              ) : (
                  // MODO PERSONALIZADO (INPUTS)
                  <div className={styles.customContainer}>
                      <div className={styles.customHeader}>
                          <button onClick={() => setIsCustomMode(false)} className={styles.backBtn}>
                              <ArrowLeft size={14} /> Voltar
                          </button>
                          <span>Selecionar Datas</span>
                      </div>
                      
                      <div className={styles.inputsRow}>
                          <label>De:</label>
                          <input 
                            type="date" 
                            className={styles.dateInput}
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                          />
                      </div>
                      
                      <div className={styles.inputsRow}>
                          <label>Até:</label>
                          <input 
                            type="date" 
                            className={styles.dateInput}
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                          />
                      </div>

                      <button onClick={applyCustomDate} className={styles.applyBtn}>
                          <Check size={14} /> Aplicar Filtro
                      </button>
                  </div>
              )}
           </div>
        )}
      </div>

      {onRefresh && (
        <button 
            className={styles.refreshBtn} 
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados"
        >
            <RefreshCw 
                size={18} 
                className={`${styles.refreshIcon} ${loading ? styles.spinning : ''}`} 
            />
        </button>
      )}
    </div>
  );
}