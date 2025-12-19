import React, { useState } from 'react';
import styles from './DashboardTable.module.css';
import { CallLead } from '@/types';
import { format, differenceInDays, isSameDay } from 'date-fns';
import { PhoneOutgoing, RefreshCw, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  leads: CallLead[];
  loading: boolean;
  onRefetch: () => void;
}

export default function DashboardTable({ leads, loading, onRefetch }: Props) {
  const [callingId, setCallingId] = useState<number | null>(null);

  // Helper de Status (Isolado aqui)
  const getStatusConfig = (lead: CallLead) => {
    if (lead.is_recovered && lead.current_last_login) {
        const loginDate = new Date(lead.current_last_login);
        const callDate = lead.called_at ? new Date(lead.called_at) : null;
        
        if (!callDate || loginDate.getTime() < callDate.getTime()) 
            return { label: 'VOLTOU ANTES', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)', icon: Zap };
        
        if (isSameDay(loginDate, callDate)) 
            return { label: 'RECUPERADO NO DIA', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.2)', icon: CheckCircle };
        
        return { label: 'RECUPERADO DEPOIS', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.2)', icon: CheckCircle };
    }
    if (lead.called_at) {
        const dias = differenceInDays(new Date(), new Date(lead.called_at));
        if (dias > 7) return { label: 'NÃO RECUPERADO', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', icon: XCircle };
        return { label: 'AGUARDANDO', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.1)', border: 'rgba(202, 138, 4, 0.2)', icon: Clock };
    }
    return { label: 'PENDENTE', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)', icon: Clock };
  };

  const handleCall = async (lead: CallLead) => {
    if(!lead.whatsapp) return;
    if(!confirm(`Ligar para ${lead.name}?`)) return;
    setCallingId(lead.id);
    try {
        await fetch('/api/process-call', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ lead_id: lead.id, phone: lead.whatsapp, send_sms: true, sms_content: 'Volta pro GTA!' })
        });
        onRefetch(); // Atualiza tudo
    } catch(e) {
        alert('Erro ao ligar');
    } finally { 
        setCallingId(null); 
    }
  };

  return (
    <div className={styles.card}>
        <div className={styles.header}>
            <h3 className={styles.title}>Listagem de Leads</h3>
            <span className={styles.count}>Total: {leads.length} leads</span>
        </div>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Passport</th>
                    <th>Nome / Whatsapp</th>
                    <th>Último Login</th>
                    <th style={{textAlign:'center'}}>Tentativas</th>
                    <th style={{textAlign:'center'}}>Status</th>
                    <th style={{textAlign:'center'}}>Ação</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={6} style={{padding:'2rem', textAlign:'center', color:'#666'}}>Carregando...</td></tr>
                ) : leads.slice(0, 50).map(lead => {
                    const status = getStatusConfig(lead);
                    const Icon = status.icon;
                    return (
                        <tr key={lead.id}>
                            <td style={{fontWeight:800}}>#{lead.passport}</td>
                            <td>
                                <div style={{fontWeight:600}}>{lead.name || 'Desconhecido'}</div>
                                <div style={{color:'#666', fontSize:'0.8rem'}}>{lead.whatsapp}</div>
                            </td>
                            <td style={{color:'#a3a3a3'}}>{lead.last_login_at_ingestion ? format(new Date(lead.last_login_at_ingestion), 'dd/MM HH:mm') : '-'}</td>
                            <td style={{textAlign:'center', fontWeight:800}}>{lead.call_count || 0}</td>
                            <td style={{textAlign:'center'}}>
                                <span className={styles.pill} style={{backgroundColor: status.bg, color: status.color, border:`1px solid ${status.border}`}}>
                                    <Icon size={12} /> {status.label}
                                </span>
                            </td>
                            <td style={{textAlign:'center'}}>
                                <button className={styles.actionBtn} onClick={() => handleCall(lead)} disabled={callingId === lead.id}>
                                    {callingId === lead.id ? <RefreshCw className="spin" size={16}/> : <PhoneOutgoing size={16}/>}
                                </button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    </div>
  );
}