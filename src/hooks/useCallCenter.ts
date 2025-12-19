import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CallLead, DashboardStats, ChartDataLead, ChartDataCall } from '@/types';
import { differenceInDays, isSameDay, format, subDays } from 'date-fns';
import { DateFilterState } from '@/components/CallCenter/DateFilterPicker';

export function useCallCenter() {
  const [leads, setLeads] = useState<CallLead[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado do Filtro
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    option: '7days', // Padrão: 7 dias
    startDate: subDays(new Date(), 6), // Início do dia 6 dias atrás
    endDate: new Date() // Agora
  });

  // --- BUSCA COM POOLING (1000+) ---
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let allData: CallLead[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    try {
        while (hasMore) {
            // Constrói a query base
            let query = supabase
                .from('CALL_LEADS_D2')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            // APLICA FILTRO DE DATA NO SUPABASE (Performático!)
            // Se NÃO for lifetime e tivermos datas definidas, filtra.
            if (dateFilter.option !== 'lifetime' && dateFilter.startDate && dateFilter.endDate) {
                // created_at >= startDate AND created_at <= endDate
                query = query
                    .gte('created_at', dateFilter.startDate.toISOString())
                    .lte('created_at', dateFilter.endDate.toISOString());
            }

            const { data, error, count } = await query;

            if (error) throw error;

            if (data) {
                allData = [...allData, ...data];
                
                // Se baixou menos que o tamanho da página, acabou.
                if (data.length < pageSize) {
                    hasMore = false;
                } else {
                    // Se baixou 1000, pode ter mais. Próxima página.
                    page++;
                }
            } else {
                hasMore = false;
            }
        }
        
        setLeads(allData);

    } catch (err) {
        console.error("Erro ao buscar leads:", err);
        // Aqui você poderia setar um estado de erro se quisesse
    } finally {
        setLoading(false);
    }
  }, [dateFilter]); // Refaz a função se o filtro mudar

  // Dispara o fetch quando o filtro muda
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // --- CÁLCULO DOS KPIS (Mesma lógica, agora operando sobre os dados já filtrados) ---
  const stats: DashboardStats = useMemo(() => {
    const s = {
      total: 0, atendidas: 0, recuperadosDia: 0, 
      recuperadosDepois: 0, recuperadosAntes: 0, 
      naoRecuperados: 0, aguardando: 0, totalCusto: 0
    };
    const today = new Date();

    leads.forEach(lead => {
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
  }, [leads]);

  // --- GRÁFICOS (Ajustado para usar o range filtrado) ---
  const leadChartData = useMemo(() => {
    // Se for lifetime, pega 30 dias padrão ou calcula range total.
    // Para simplificar o gráfico, se for lifetime, mostra últimos 30 dias dos dados baixados.
    // Se for filtro, mostra o range do filtro.
    
    let start = dateFilter.startDate || subDays(new Date(), 30);
    let end = dateFilter.endDate || new Date();
    
    // Se lifetime, ajusta o gráfico para não ficar infinito
    if (dateFilter.option === 'lifetime') {
       start = subDays(new Date(), 30); 
       end = new Date();
    }

    const daysMap = new Map();
    const diff = differenceInDays(end, start);
    // Cria chaves para cada dia do intervalo
    for (let i = 0; i <= diff; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = format(d, 'yyyy-MM-dd');
        daysMap.set(key, { name: format(d, 'dd/MM'), total: 0, atendidas: 0, rec_dia: 0, rec_depois: 0, aguardando: 0 });
    }

    leads.forEach(lead => {
      if (!lead.created_at) return;
      const dateKey = lead.created_at.substring(0, 10);
      if (daysMap.has(dateKey)) {
        const entry = daysMap.get(dateKey);
        entry.total++;
        const history = lead.call_history || [];
        if (history.some((h: any) => (h.status||'').toLowerCase().includes('answered'))) entry.atendidas++;
        
        // Lógica simplificada para gráfico
        if (lead.is_recovered && lead.current_last_login) {
            const login = new Date(lead.current_last_login);
            const call = lead.called_at ? new Date(lead.called_at) : null;
            if (call && isSameDay(login, call)) entry.rec_dia++;
            else entry.rec_depois++;
        } else {
            entry.aguardando++;
        }
      }
    });
    return Array.from(daysMap.values()) as ChartDataLead[];
  }, [leads, dateFilter]);

  // Gráfico de Barras (Chamadas) - Mesma lógica de data
  const callChartData = useMemo(() => {
    let start = dateFilter.startDate || subDays(new Date(), 30);
    let end = dateFilter.endDate || new Date();
    if (dateFilter.option === 'lifetime') { start = subDays(new Date(), 30); end = new Date(); }

    const daysMap = new Map();
    const diff = differenceInDays(end, start);
    for (let i = 0; i <= diff; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = format(d, 'yyyy-MM-dd');
        daysMap.set(key, { name: format(d, 'dd/MM'), answered: 0, no_answer: 0, failed: 0, busy: 0 });
    }

    leads.forEach(lead => {
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
                else if (['FAILED', 'CONGESTION'].includes(st)) entry.failed++;
                else if (st === 'BUSY') entry.busy++;
            }
        });
    });
    return Array.from(daysMap.values()) as ChartDataCall[];
  }, [leads, dateFilter]);

  return { 
    leads, 
    loading, 
    stats, 
    leadChartData, 
    callChartData, 
    dateFilter, 
    setDateFilter, // Exportamos o setter para o componente usar
    refetch: fetchLeads 
  };
}