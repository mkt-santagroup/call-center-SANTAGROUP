// src/hooks/useDashboardMetrics.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DashboardStats, ChartDataLead, ChartDataCall, CallLead } from '@/types';
import { differenceInDays, isSameDay, format, subDays, eachDayOfInterval } from 'date-fns';
import { DateFilterState } from '@/components/CallCenter/DateFilterPicker';

export function useDashboardMetrics(dateFilter: DateFilterState) {
  const [rawData, setRawData] = useState<CallLead[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // --- 1. BUSCA DE DADOS (COM CORREÇÃO DE TIMEZONE MANUAL) ---
  const fetchMetricsData = useCallback(async () => {
    setLoadingMetrics(true);
    
    let allData: CallLead[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Força o range UTC completo para o dia selecionado
    let isoStart = null;
    let isoEnd = null;

    if (dateFilter.startDate) {
        const yyyyMMdd = format(dateFilter.startDate, 'yyyy-MM-dd');
        isoStart = `${yyyyMMdd}T00:00:00.000Z`;
    }
    
    if (dateFilter.endDate) {
        const yyyyMMdd = format(dateFilter.endDate, 'yyyy-MM-dd');
        isoEnd = `${yyyyMMdd}T23:59:59.999Z`;
    }

    try {
      while (hasMore) {
        let query = supabase
          .from('CALL_LEADS_D2')
          .select('id, created_at, called_at, is_recovered, current_last_login, call_history, status, call_count')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (dateFilter.option !== 'lifetime' && isoStart && isoEnd) {
          query = query
            .gte('created_at', isoStart)
            .lte('created_at', isoEnd);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data) {
          allData = [...allData, ...data as unknown as CallLead[]];
          if (data.length < pageSize) hasMore = false;
          else page++;
        } else {
            hasMore = false;
        }
      }
      
      setRawData(allData);

    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoadingMetrics(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchMetricsData();
  }, [fetchMetricsData]);


  // --- HELPERS ---
  const allowedDatesSet = useMemo(() => {
     if (dateFilter.option === 'lifetime') return null;

     const set = new Set<string>();
     const start = dateFilter.startDate || subDays(new Date(), 6);
     const end = dateFilter.endDate || new Date();
     
     const interval = eachDayOfInterval({ start, end });
     interval.forEach(date => {
        set.add(format(date, 'yyyy-MM-dd'));
     });
     
     return set;
  }, [dateFilter]);


  // --- 2. CÁLCULO DOS KPIs (Cards) ---
  const stats: DashboardStats = useMemo(() => {
    const s = {
      total: 0, 
      atendidas: 0, 
      recuperadosDia: 0, 
      recuperadosDepois: 0, 
      recuperadosAntes: 0,
      retorno: 0, // <--- NOVA MÉTRICA INICIALIZADA
      naoRecuperados: 0, 
      aguardando: 0, 
      totalCusto: 0
    };
    
    const today = new Date();

    rawData.forEach(lead => {
      if (!lead.created_at) return;

      const dateKey = lead.created_at.substring(0, 10);
      if (allowedDatesSet && !allowedDatesSet.has(dateKey)) return;

      s.total++;
      
      const history = lead.call_history || [];
      let foiAtendido = false;
      history.forEach((h: any) => {
        s.totalCusto += Number(h.price || 0);
        const st = (h.status || '').toLowerCase();
        if (['answered', 'human'].includes(st)) foiAtendido = true;
      });
      if (foiAtendido) s.atendidas++;

      if (lead.is_recovered && lead.current_last_login) {
        s.retorno++; // <--- INCREMENTA O RETORNO GERAL

        const loginDate = new Date(lead.current_last_login);
        const callDate = lead.called_at ? new Date(lead.called_at) : null;
        
        if (!callDate || loginDate.getTime() < callDate.getTime()) s.recuperadosAntes++; 
        else if (isSameDay(loginDate, callDate)) s.recuperadosDia++;   
        else s.recuperadosDepois++; 
      } else if (lead.called_at) {
        const dias = differenceInDays(today, new Date(lead.called_at));
        if (dias > 7) s.naoRecuperados++; 
        else s.aguardando++;
      } else {
        s.aguardando++; 
      }
    });

    return s;
  }, [rawData, allowedDatesSet]);


  // --- 3. GRÁFICO DE TENDÊNCIA ---
  const leadChartData = useMemo(() => {
    let start = dateFilter.startDate;
    let end = dateFilter.endDate || new Date();

    if (dateFilter.option === 'lifetime') {
       if (rawData.length > 0 && rawData[rawData.length - 1].created_at) {
         start = new Date(rawData[rawData.length - 1].created_at);
       } else {
         start = subDays(new Date(), 30); 
       }
    }
    
    if (!start) start = subDays(new Date(), 30);

    const daysMap = new Map();
    const interval = eachDayOfInterval({ start, end });
    const safeInterval = interval.length > 365 ? interval.slice(-365) : interval;

    safeInterval.forEach(d => {
        const key = format(d, 'yyyy-MM-dd');
        daysMap.set(key, { 
            name: format(d, 'dd/MM'), 
            total: 0, 
            atendidas: 0, 
            rec_dia: 0, 
            rec_depois: 0, 
            rec_antes: 0,
            aguardando: 0,
            nao_rec: 0
        });
    });

    rawData.forEach(lead => {
      if (!lead.created_at) return;
      const dateKey = lead.created_at.substring(0, 10);
      
      if (daysMap.has(dateKey)) {
        const entry = daysMap.get(dateKey);
        entry.total++; 
        
        if (lead.is_recovered && lead.current_last_login) {
            const login = new Date(lead.current_last_login);
            const call = lead.called_at ? new Date(lead.called_at) : null;
            
            if (!call || login.getTime() < call.getTime()) {
                entry.rec_antes++; 
            } 
            else if (isSameDay(login, call)) {
                entry.rec_dia++; 
            } 
            else {
                entry.rec_depois++; 
            }
        } else {
            entry.aguardando++; 
        }

        const history = lead.call_history || [];
        if (history.some((h: any) => (h.status||'').toLowerCase().includes('answered'))) {
            entry.atendidas++;
        }
      }
    });

    return Array.from(daysMap.values()) as ChartDataLead[];
  }, [rawData, dateFilter]);


  // --- 4. GRÁFICO DE CHAMADAS ---
  const callChartData = useMemo(() => {
    let start = dateFilter.startDate;
    let end = dateFilter.endDate || new Date();

    if (dateFilter.option === 'lifetime') {
        if (rawData.length > 0 && rawData[rawData.length - 1].created_at) {
            start = new Date(rawData[rawData.length - 1].created_at);
        } else {
            start = subDays(new Date(), 30);
        }
    }
    
    if (!start) start = subDays(new Date(), 30);
    
    const interval = eachDayOfInterval({ start, end });
    const safeInterval = interval.length > 365 ? interval.slice(-365) : interval;
    const daysMap = new Map();

    safeInterval.forEach(d => {
        const key = format(d, 'yyyy-MM-dd');
        daysMap.set(key, { 
            name: format(d, 'dd/MM'), 
            answered: 0, 
            no_answer: 0, 
            failed: 0, 
            busy: 0 
        });
    });

    rawData.forEach(lead => {
        const history = lead.call_history || [];
        history.forEach((h: any) => {
            const callDateRaw = h.date || lead.called_at; 
            if (!callDateRaw) return;
            const dateKey = callDateRaw.substring(0, 10);
            
            if (daysMap.has(dateKey)) {
                const entry = daysMap.get(dateKey);
                const st = (h.status || '').toUpperCase();
                
                if (['ANSWERED', 'HUMAN'].includes(st)) entry.answered++;
                else if (['NO ANSWER', 'NO_ANSWER'].includes(st)) entry.no_answer++;
                else if (['FAILED', 'CONGESTION', 'ERROR'].includes(st)) entry.failed++;
                else if (['BUSY'].includes(st)) entry.busy++;
                else entry.failed++;
            }
        });
    });

    return Array.from(daysMap.values()) as ChartDataCall[];
  }, [rawData, dateFilter]);

  return { 
    loadingMetrics, 
    stats, 
    leadChartData, 
    callChartData, 
    refetchMetrics: fetchMetricsData 
  };
}