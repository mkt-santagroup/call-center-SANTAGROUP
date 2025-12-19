// src/hooks/useLeadsTable.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CallLead } from '@/types';
import { DateFilterState } from '@/components/CallCenter/DateFilterPicker';

export function useLeadsTable(dateFilter: DateFilterState) {
  const [leads, setLeads] = useState<CallLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50; // Tabela não precisa baixar 1000 de uma vez

  // Função para buscar leads (com paginação real)
  const fetchTableData = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      
      let query = supabase
        .from('CALL_LEADS_D2')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      // Aplica filtro de data se necessário
      if (dateFilter.option !== 'lifetime' && dateFilter.startDate && dateFilter.endDate) {
        query = query
          .gte('created_at', dateFilter.startDate.toISOString())
          .lte('created_at', dateFilter.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        if (reset) {
          setLeads(data);
          setPage(1); // Próxima página será a 1
        } else {
          setLeads(prev => [...prev, ...data]);
          setPage(prev => prev + 1);
        }
        
        // Se veio menos que o tamanho da página, acabou
        if (data.length < pageSize) setHasMore(false);
        else setHasMore(true);
      }
    } catch (err) {
      console.error("Erro na tabela:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, page]);

  // Reseta a busca quando o filtro de data muda
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchTableData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]); // Removemos fetchTableData das deps para evitar loop, usamos só o filtro

  return { leads, loading, hasMore, loadMore: () => fetchTableData(false), refetch: () => fetchTableData(true) };
}