import React, { useState, useEffect } from 'react';
import styles from './DateFilterPicker.module.css';
import { format, subDays, startOfDay, endOfDay, subClasses } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateRangeOption = 'today' | 'yesterday' | '7days' | '30days' | 'lifetime' | 'custom';

export interface DateFilterState {
  option: DateRangeOption;
  startDate: Date | null;
  endDate: Date | null;
}

interface Props {
  value: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  disabled?: boolean;
}

export default function DateFilterPicker({ value, onChange, disabled }: Props) {
  const [showCustom, setShowCustom] = useState(false);

  // Função que aplica os Presets
  const handlePreset = (option: DateRangeOption) => {
    const today = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (option) {
      case 'today':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case 'yesterday':
        const yest = subDays(today, 1);
        start = startOfDay(yest);
        end = endOfDay(yest);
        break;
      case '7days':
        start = startOfDay(subDays(today, 6)); // Hoje + 6 dias atrás = 7 dias
        end = endOfDay(today);
        break;
      case '30days':
        start = startOfDay(subDays(today, 29));
        end = endOfDay(today);
        break;
      case 'lifetime':
        start = null; // Null indica "sem filtro" no banco
        end = null;
        break;
      case 'custom':
        setShowCustom(true);
        return; // Não muda data imediatamente, espera o user escolher
    }

    setShowCustom(false);
    onChange({ option, startDate: start, endDate: end });
  };

  // Handler para datas customizadas
  const handleCustomDate = (type: 'start' | 'end', dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr);
    // Ajusta fuso se necessário, mas new Date(yyyy-mm-dd) costuma pegar UTC em alguns browsers.
    // Vamos garantir o timezone local adicionando horas se precisar, 
    // mas para input type="date" simples, new Date(val + 'T00:00') ajuda.
    
    const newDate = new Date(dateStr + 'T12:00:00'); // Meio dia para evitar pular dia por fuso
    
    const newState = { ...value, option: 'custom' as DateRangeOption };
    
    if (type === 'start') newState.startDate = startOfDay(newDate);
    if (type === 'end') newState.endDate = endOfDay(newDate);

    onChange(newState);
  };

  // Formatar label do botão
  const getLabel = () => {
    switch (value.option) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case '7days': return 'Últimos 7 dias';
      case '30days': return 'Últimos 30 dias';
      case 'lifetime': return 'Lifetime (Tudo)';
      case 'custom': 
        if (value.startDate && value.endDate) {
          return `${format(value.startDate, 'dd/MM')} - ${format(value.endDate, 'dd/MM')}`;
        }
        return 'Personalizado';
      default: return 'Selecione a Data';
    }
  };

  return (
    <div className={styles.container}>
      {/* Botões de Preset */}
      <div className={styles.presets}>
        <button 
          className={`${styles.btn} ${value.option === 'today' ? styles.active : ''}`}
          onClick={() => handlePreset('today')} disabled={disabled}>Hoje</button>
        
        <button 
          className={`${styles.btn} ${value.option === 'yesterday' ? styles.active : ''}`}
          onClick={() => handlePreset('yesterday')} disabled={disabled}>Ontem</button>
        
        <button 
          className={`${styles.btn} ${value.option === '7days' ? styles.active : ''}`}
          onClick={() => handlePreset('7days')} disabled={disabled}>7d</button>
        
        <button 
          className={`${styles.btn} ${value.option === '30days' ? styles.active : ''}`}
          onClick={() => handlePreset('30days')} disabled={disabled}>30d</button>

        <button 
          className={`${styles.btn} ${value.option === 'lifetime' ? styles.active : ''}`}
          onClick={() => handlePreset('lifetime')} disabled={disabled}>Total</button>
        
        <div className={styles.separator} />

        <button 
          className={`${styles.btn} ${value.option === 'custom' ? styles.active : ''}`}
          onClick={() => setShowCustom(!showCustom)} disabled={disabled}
          style={{display: 'flex', alignItems: 'center', gap: 6}}
        >
          <Calendar size={14}/> 
          <span className={styles.desktopOnly}>{value.option === 'custom' ? getLabel() : 'Custom'}</span>
          <ChevronDown size={12}/>
        </button>
      </div>

      {/* Menu Dropdown do Custom (Só aparece se custom ativo ou clicado) */}
      {showCustom && (
        <div className={styles.customPopup}>
            <div className={styles.field}>
                <label>De:</label>
                <input 
                    type="date" 
                    value={value.startDate ? format(value.startDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleCustomDate('start', e.target.value)}
                />
            </div>
            <div className={styles.field}>
                <label>Até:</label>
                <input 
                    type="date" 
                    value={value.endDate ? format(value.endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleCustomDate('end', e.target.value)}
                />
            </div>
        </div>
      )}
    </div>
  );
}