import React, { useState } from 'react';
import Head from 'next/head';
import styles from '@/styles/Dialer.module.css';
import { PhoneOutgoing, MessageSquare, Play, CheckCircle, XCircle, AlertCircle, Beaker, List } from 'lucide-react';

import DateFilterPicker, { DateFilterState } from '@/components/CallCenter/DateFilterPicker';
import { useLeadsTable } from '@/hooks/useLeadsTable';
import { CallLead } from '@/types';

// --- MODAL DE SMS (CONFIRMAÇÃO DO DISPARO EM MASSA) ---
interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string | null) => void;
  count: number;
}

const SmsModal = ({ isOpen, onClose, onConfirm, count }: SmsModalProps) => {
  const [smsText, setSmsText] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Configurar Disparo em Massa</h3>
        <p>Você vai disparar para <strong>{count} leads</strong> da lista atual.</p>
        
        <div className={styles.smsSection}>
          <label>Mensagem SMS (Enviada independente se atender):</label>
          <textarea 
            placeholder="Digite a mensagem... (Deixe vazio para NÃO enviar SMS)"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            rows={4}
          />
          <small>{smsText.length} caracteres</small>
        </div>

        <div className={styles.modalActions}>
            <button onClick={onClose} className={styles.btnCancel}>Cancelar</button>
            <button 
                onClick={() => onConfirm(smsText.trim() === '' ? null : smsText)} 
                className={styles.btnConfirm}
            >
                {smsText.trim() ? <><MessageSquare size={16}/> Ligar + SMS</> : <><PhoneOutgoing size={16}/> Apenas Ligar</>}
            </button>
        </div>
      </div>
    </div>
  );
};


// --- MODAL DE TESTE (DISPARO MANUAL) ---
interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTest: (lines: string[], message: string | null, setLog: (msg: string) => void) => Promise<void>;
}

const TestModal = ({ isOpen, onClose, onTest }: TestModalProps) => {
    const [inputText, setInputText] = useState('');
    const [smsText, setSmsText] = useState('');
    const [testing, setTesting] = useState(false);
    const [testLog, setTestLog] = useState<string[]>([]);

    if (!isOpen) return null;

    const addLog = (msg: string) => setTestLog(prev => [...prev, msg]);

    const handleRunTest = async () => {
        if (!inputText.trim()) return alert("Digite pelo menos um lead!");
        
        setTesting(true);
        setTestLog([]); 
        addLog("Iniciando teste...");

        // Divide por linha
        const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        await onTest(lines, smsText.trim() === '' ? null : smsText, addLog);
        
        addLog("Teste finalizado.");
        setTesting(false);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Disparo de Teste (ID Real)</h3>
                <p>Insira: <code>ID - NUMERO</code> (Para salvar no banco corretamente)</p>

                <div className={styles.testGrid}>
                    <div className={styles.testInputs}>
                        <div className={styles.inputGroup}>
                            <label><List size={14}/> Lista (ID - Whatsapp)</label>
                            <textarea 
                                placeholder="123 - 5511999999999&#10;456 - 5511888888888"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                rows={5}
                                disabled={testing}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label><MessageSquare size={14}/> SMS (Opcional)</label>
                            <textarea 
                                placeholder="Olá, teste de sistema..."
                                value={smsText}
                                onChange={(e) => setSmsText(e.target.value)}
                                rows={3}
                                disabled={testing}
                            />
                        </div>
                    </div>

                    <div className={styles.testLog}>
                        <label>Log de Execução:</label>
                        <div className={styles.logBox}>
                            {testLog.length === 0 ? <span className={styles.logEmpty}>Aguardando...</span> : (
                                testLog.map((log, i) => <div key={i} className={styles.logItem}>{log}</div>)
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    {!testing && <button onClick={onClose} className={styles.btnCancel}>Fechar</button>}
                    <button 
                        onClick={handleRunTest} 
                        className={styles.btnTestConfirm}
                        disabled={testing}
                    >
                        {testing ? 'Testando...' : <><Beaker size={16}/> Executar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- PÁGINA PRINCIPAL ---
export default function DialerPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ 
    option: 'today', startDate: new Date(), endDate: new Date() 
  });

  const { leads, loading, refetchLeads } = useLeadsTable(dateFilter);
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // CORE: Chama API
  const processCall = async (id: string, whatsapp: string, smsMessage: string | null) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const response = await fetch('/api/process-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                lead_id: id, 
                whatsapp: whatsapp, 
                sms_message: smsMessage 
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Tenta ler erro
            try { console.error(await response.json()); } catch {}
            return false;
        }
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
  };

  // DISPARO EM MASSA (Lista carregada)
  const handleBatchBlast = async (smsMessage: string | null) => {
    setIsBlastModalOpen(false);
    setProcessing(true);
    
    const initialStatus: any = {};
    leads.forEach(l => initialStatus[l.id] = 'pending');
    setResults(initialStatus);

    const promises = leads.map(async (lead) => {
        // CORREÇÃO: lead.id é number, mas processCall espera string. Adicionado .toString()
        const success = await processCall(lead.id.toString(), lead.whatsapp || '', smsMessage);
        setResults(prev => ({ ...prev, [lead.id]: success ? 'success' : 'error' }));
    });

    await Promise.all(promises);
    setProcessing(false);
    alert("Disparos finalizados!");
    refetchLeads();
  };

  // DISPARO DE TESTE (ID - NUMERO)
  const handleTestBlast = async (lines: string[], smsMessage: string | null, setLog: (msg: string) => void) => {
      const promises = lines.map(async (line) => {
          // Parse: "ID - NUMERO" ou "ID, NUMERO"
          // Tenta separar por hífen ou vírgula
          let id = '';
          let phone = '';

          const parts = line.split(/[-;,]+/); // Aceita - ; ou ,
          if (parts.length >= 2) {
              id = parts[0].trim();
              phone = parts[1].trim();
          } else {
              // Se não tiver separador, assume que é só numero e cria ID falso (mas usuário pediu ID)
              phone = line.trim();
              id = `temp-${Date.now()}`;
              setLog(`[AVISO] "${line}" sem ID. Usando temporário: ${id}`);
          }

          if (!phone) return;

          setLog(`[${id}] Ligando para ${phone}...`);
          
          const success = await processCall(id, phone, smsMessage);
          
          if (success) {
              setLog(`[${id}] SUCESSO! Banco atualizado.`);
          } else {
              setLog(`[${id}] ERRO na execução.`);
          }
      });
      
      await Promise.all(promises);
  };

  // Contadores
  const successCount = Object.values(results).filter(s => s === 'success').length;
  const errorCount = Object.values(results).filter(s => s === 'error').length;
  const total = leads.length;

  return (
    <>
      <Head><title>Central de Disparo | SantaGroup</title></Head>

      <div className={styles.container}>
        {/* Header e DatePicker (Igual) */}
        <div className={styles.header}>
            <div>
                <h1 className={styles.pageTitle}>Disparo em Massa</h1>
                <p className={styles.pageSubtitle}>Disparador automático com atualização de banco.</p>
            </div>
            <DateFilterPicker filter={dateFilter} onChange={setDateFilter} onRefresh={refetchLeads} loading={loading || processing} />
        </div>

        {/* Dashboard Controle */}
        <div className={styles.controlPanel}>
            <div className={styles.statsRow}>
                <div className={styles.statItem}><span>Total na Lista</span><strong>{total}</strong></div>
                {processing && (
                    <>
                        <div className={`${styles.statItem} ${styles.textSuccess}`}><span>Sucesso</span><strong>{successCount}</strong></div>
                        <div className={`${styles.statItem} ${styles.textError}`}><span>Falhas</span><strong>{errorCount}</strong></div>
                    </>
                )}
            </div>

            <div className={styles.actionsRight}>
                <button className={styles.testBtn} onClick={() => setIsTestModalOpen(true)} disabled={processing}>
                    <Beaker size={18} /> Testar Disparo
                </button>
                <button className={styles.fireBtn} onClick={() => setIsBlastModalOpen(true)} disabled={loading || processing || total === 0}>
                    {processing ? 'PROCESSANDO...' : <><Play size={20} fill="currentColor"/> INICIALIZAR</>}
                </button>
            </div>
        </div>

        {/* Lista */}
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <span>Leads ({dateFilter.option})</span>
                <span>Status</span>
            </div>
            <div className={styles.scrollArea}>
                {loading ? <div className={styles.centerMsg}>Carregando...</div> : 
                 total === 0 ? <div className={styles.centerMsg}>Nenhum lead encontrado.</div> :
                 leads.map((lead, i) => {
                    const status = results[lead.id];
                    return (
                        <div key={lead.id} className={styles.listItem}>
                            <div className={styles.leadInfo}>
                                <span className={styles.index}>#{i+1}</span>
                                <strong>{lead.name || 'Sem Nome'}</strong>
                                <span className={styles.phone}>{lead.whatsapp}</span>
                            </div>
                            <div className={styles.statusCol}>
                                {status === 'success' && <span className={styles.badgeSuccess}><CheckCircle size={14}/> Enviado</span>}
                                {status === 'error' && <span className={styles.badgeError}><XCircle size={14}/> Erro</span>}
                                {processing && status === 'pending' && <span className={styles.badgePending}>Enviando...</span>}
                                {!processing && !status && <span className={styles.badgeIdle}>Aguardando</span>}
                            </div>
                        </div>
                    )
                 })
                }
            </div>
        </div>

        <SmsModal isOpen={isBlastModalOpen} onClose={() => setIsBlastModalOpen(false)} onConfirm={handleBatchBlast} count={total} />
        <TestModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} onTest={handleTestBlast} />
      </div>
    </>
  );
}