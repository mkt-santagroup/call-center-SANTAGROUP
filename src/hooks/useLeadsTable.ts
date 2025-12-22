// src/hooks/useLeadsTable.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CallLead } from '@/types';
import { DateFilterState } from '@/components/CallCenter/DateFilterPicker';
import { format } from 'date-fns';

// ADICIONADO: Parâmetro tableName (Obrigatório ou Opcional)
export function useLeadsTable(dateFilter: DateFilterState, tableName: string = 'CALL_LEADS_D2') {
  const [leads, setLeads] = useState<CallLead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    
    let allData: CallLead[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Configuração das datas para o filtro
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
        // MUDANÇA AQUI: Usa 'tableName' em vez de string fixa
        let query = supabase
          .from(tableName) 
          .select('id, passport, name, whatsapp, created_at, called_at, is_recovered, last_login_at_ingestion, current_last_login, time_played, call_history')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        // Aplica o filtro de data (se não for lifetime)
        if (dateFilter.option !== 'lifetime' && isoStart && isoEnd) {
          query = query
            .gte('created_at', isoStart)
            .lte('created_at', isoEnd);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data) {
          const leadsData = data as unknown as CallLead[];
          allData = [...allData, ...leadsData];
          
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
          
          // Trava de segurança opcional
          if (allData.length >= 5000) hasMore = false; 

        } else {
            hasMore = false;
        }
      }
      
      setLeads(allData);

    } catch (err) {
      console.error("Erro ao carregar leads para a tabela:", err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, tableName]); // <--- tableName adicionado nas dependências

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { 
    leads, 
    loading, 
    refetchLeads: fetchLeads 
  };
}