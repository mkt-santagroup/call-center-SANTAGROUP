// src/pages/dialer.tsx

import React, { useState } from 'react';
import Head from 'next/head';
import styles from '@/styles/Dialer.module.css';
import { PhoneOutgoing, MessageSquare, Play, CheckCircle, XCircle, Beaker, List, Crown } from 'lucide-react';

import DateFilterPicker, { DateFilterState } from '@/components/CallCenter/DateFilterPicker';
import { useLeadsTable } from '@/hooks/useLeadsTable';

const API_BASE = 'http://api.santagroup.com.br:4957/';
const API_TOKEN = 'Mjk5ODk4OiZTWk0zM1FxOGtaJDWA231XFXZ';

// --- MODAL DE SMS + VIP (DISPARO EM MASSA) ---
interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string | null, setarVip: boolean, vipPassports: number[], vipCommands: string, vipExpires: string) => void;
  count: number;
  leads: any[];
}
const SmsModal = ({ isOpen, onClose, onConfirm, count, leads }: SmsModalProps) => {
  const [smsText, setSmsText] = useState('');
  const [setarVip, setSetarVip] = useState(false);
  const [vipCommands, setVipCommands] = useState('');
  const [vipExpires, setVipExpires] = useState('');
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    const passports = leads.map(l => l.passport).filter(p => p);
    onConfirm(
      smsText.trim() === '' ? null : smsText,
      setarVip,
      passports,
      vipCommands,
      vipExpires
    );
  };
  
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
        </div>

        {/* CHECKBOX SETAR VIP */}
        <div className={styles.smsSection}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={setarVip}
              onChange={(e) => setSetarVip(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <Crown size={18} color="#8b5cf6" />
            <span>Setar VIP para todos os {count} leads?</span>
          </label>
        </div>

        {/* CAMPOS VIP */}
        {setarVip && (
          <>
            <div className={styles.smsSection}>
              <label>Comandos VIP (um por linha):</label>
              <textarea 
                placeholder="givemoney 10000&#10;additem weapon 1&#10;setvip 30"
                value={vipCommands}
                onChange={(e) => setVipCommands(e.target.value)}
                rows={5}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#737373', marginTop: '4px' }}>
                💡 O passport de cada lead será adicionado automaticamente no início de cada comando
              </p>
            </div>

            <div className={styles.smsSection}>
              <label>Data de Expiração (opcional):</label>
              <input 
                type="datetime-local"
                value={vipExpires}
                onChange={(e) => setVipExpires(e.target.value)}
                style={{
                  background: '#0a0a0a', border: '1px solid #404040', color: '#fff',
                  padding: '10px', borderRadius: '8px', width: '100%', fontFamily: 'inherit',
                  colorScheme: 'dark'
                }}
              />
            </div>
          </>
        )}

        <div className={styles.modalActions}>
            <button onClick={onClose} className={styles.btnCancel}>Cancelar</button>
            <button onClick={handleConfirm} className={styles.btnConfirm}>
                {setarVip ? (
                  <><Crown size={16}/> Ligar + SMS + VIP</>
                ) : smsText.trim() ? (
                  <><MessageSquare size={16}/> Ligar + SMS</>
                ) : (
                  <><PhoneOutgoing size={16}/> Apenas Ligar</>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL DE TESTE (ATUALIZADO PARA USAR API INTERNA) ---
interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTest: (lines: string[], message: string | null, vipData: any, setLog: (msg: string) => void) => Promise<void>;
}
const TestModal = ({ isOpen, onClose, onTest }: TestModalProps) => {
    const [inputText, setInputText] = useState('');
    const [smsText, setSmsText] = useState('');
    const [setarVip, setSetarVip] = useState(false);
    const [vipPassport, setVipPassport] = useState('');
    const [vipCommands, setVipCommands] = useState('');
    const [vipExpires, setVipExpires] = useState('');
    const [testing, setTesting] = useState(false);
    const [testLog, setTestLog] = useState<string[]>([]);
    
    if (!isOpen) return null;
    
    const addLog = (msg: string) => setTestLog(prev => [...prev, msg]);
    
    const handleRunTest = async () => {
        if (!inputText.trim()) return alert("Digite pelo menos um número!");
        setTesting(true);
        setTestLog([]); 
        addLog("Iniciando teste...");
        const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const vipData = (setarVip && vipPassport) ? {
          passport: vipPassport,
          commands: vipCommands,
          expires: vipExpires
        } : null;
        
        await onTest(lines, smsText.trim() === '' ? null : smsText, vipData, addLog);
        addLog("Teste finalizado.");
        setTesting(false);
    };
    
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '900px' }}>
                <h3>Disparo de Teste</h3>
                <p>Digite os números de WhatsApp para testar</p>
                <div className={styles.testGrid}>
                    <div className={styles.testInputs}>
                        <div className={styles.inputGroup}>
                            <label><List size={14}/> Lista de Números</label>
                            <textarea 
                                placeholder="5511999999999&#10;5511888888888&#10;5511777777777"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                rows={4}
                                disabled={testing}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label><MessageSquare size={14}/> Mensagem SMS (Opcional)</label>
                            <textarea 
                                placeholder="Olá, teste de sistema..."
                                value={smsText}
                                onChange={(e) => setSmsText(e.target.value)}
                                rows={3}
                                disabled={testing}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox"
                              checked={setarVip}
                              onChange={(e) => setSetarVip(e.target.checked)}
                              disabled={testing}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <Crown size={18} color="#8b5cf6" />
                            <span>Setar VIP?</span>
                          </label>
                        </div>

                        {setarVip && (
                          <div style={{ 
                            border: '1px solid #8b5cf6', borderRadius: '8px', 
                            padding: '12px', background: 'rgba(139, 92, 246, 0.05)' 
                          }}>
                            <div className={styles.inputGroup}>
                              <label style={{ fontSize: '0.85rem' }}>Passport:</label>
                              <input 
                                type="number"
                                placeholder="Ex: 1001"
                                value={vipPassport}
                                onChange={(e) => setVipPassport(e.target.value)}
                                disabled={testing}
                                style={{
                                  background: '#0a0a0a', border: '1px solid #404040', color: '#fff',
                                  padding: '10px', borderRadius: '6px', width: '100%', fontFamily: 'inherit'
                                }}
                              />
                            </div>

                            <div className={styles.inputGroup}>
                              <label style={{ fontSize: '0.85rem' }}>Comandos:</label>
                              <textarea 
                                placeholder="givemoney 10000&#10;setvip 30"
                                value={vipCommands}
                                onChange={(e) => setVipCommands(e.target.value)}
                                rows={3}
                                disabled={testing}
                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                              />
                            </div>

                            <div className={styles.inputGroup}>
                              <label style={{ fontSize: '0.85rem' }}>Expira em (opcional):</label>
                              <input 
                                type="datetime-local"
                                value={vipExpires}
                                onChange={(e) => setVipExpires(e.target.value)}
                                disabled={testing}
                                style={{
                                  background: '#0a0a0a', border: '1px solid #404040', color: '#fff',
                                  padding: '10px', borderRadius: '6px', width: '100%', fontFamily: 'inherit',
                                  colorScheme: 'dark'
                                }}
                              />
                            </div>
                          </div>
                        )}
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
                    <button onClick={handleRunTest} className={styles.btnTestConfirm} disabled={testing}>
                        {testing ? 'Testando...' : <><Beaker size={16}/> Executar Teste</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---
export default function DialerPage() {
  const [activeTable, setActiveTable] = useState<'CALL_LEADS_D1' | 'CALL_LEADS_D2'>('CALL_LEADS_D2');

  const [dateFilter, setDateFilter] = useState<DateFilterState>({ 
    option: 'today', startDate: new Date(), endDate: new Date() 
  });

  const { leads, loading, refetchLeads } = useLeadsTable(dateFilter, activeTable);
  
  const [isBlastModalOpen, setIsBlastModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const setVipForPassport = async (passport: number, commands: string, expiresAt: string) => {
    try {
      const commandsArray = commands.split('\n')
        .filter(cmd => cmd.trim())
        .map(cmd => `${passport} ${cmd.trim()}`);
      
      let formattedDate = null;
      if (expiresAt) {
        const date = new Date(expiresAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`;
      }

      const payload: any = { passport: parseInt(passport.toString()) };
      if (commandsArray.length > 0) payload.commands = commandsArray;
      if (formattedDate) payload.expires_at = formattedDate;

      const response = await fetch(`${API_BASE}set-next-login-commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Erro API: ${response.status}`);
      return true;
    } catch (error) {
      console.error(`Erro ao setar VIP para passport ${passport}:`, error);
      return false;
    }
  };

  const processCall = async (id: string, whatsapp: string, smsMessage: string | null) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        const response = await fetch('/api/process-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                lead_id: id, 
                whatsapp: whatsapp, 
                sms_message: smsMessage,
                table_name: activeTable
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) return false;
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
  };

  const handleBatchBlast = async (
    smsMessage: string | null, 
    setarVip: boolean, 
    vipPassports: number[], 
    vipCommands: string, 
    vipExpires: string
  ) => {
    setIsBlastModalOpen(false);
    setProcessing(true);
    const initialStatus: any = {};
    leads.forEach(l => initialStatus[l.id] = 'pending');
    setResults(initialStatus);

    const promises = leads.map(async (lead) => {
        const success = await processCall(lead.id.toString(), lead.whatsapp || '', smsMessage);
        setResults(prev => ({ ...prev, [lead.id]: success ? 'success' : 'error' }));
    });

    await Promise.all(promises);

    if (setarVip && vipPassports.length > 0) {
      console.log(`Setando VIP para ${vipPassports.length} passports...`);
      const vipPromises = vipPassports.map(passport => 
        setVipForPassport(passport, vipCommands, vipExpires)
      );
      await Promise.all(vipPromises);
      alert(`Disparos finalizados! VIP configurado para ${vipPassports.length} jogadores.`);
    } else {
      alert("Disparos finalizados!");
    }

    setProcessing(false);
    refetchLeads();
  };

  const handleTestBlast = async (
    lines: string[], 
    smsMessage: string | null, 
    vipData: any,
    setLog: (msg: string) => void
  ) => {
      const promises = lines.map(async (line, index) => {
          let phone = line.trim();
          if (line.includes('-')) {
              const parts = line.split('-');
              phone = parts[1].trim();
          }
          if (!phone.startsWith('+')) {
            if (!phone.startsWith('55')) phone = '55' + phone;
            phone = '+' + phone;
          }

          setLog(`[${index + 1}] Processando ${phone}...`);

          try {
              // 1. LIGAR (DisparoPro)
              const callPayload = {
                  phone: phone,
                  type: "audio",
                  audio_id: "a3d4342b-b11b-4166-9062-bc57e0ba9c73",
                  message: "Audio message"
              };

              setLog(`[${index + 1}] Disparando ligação...`);
              const callResponse = await fetch("https://gateway.disparopro.com.br/voice/v1/call/send", {
                  method: 'POST',
                  headers: {
                      'accept': 'application/json',
                      'token': '80bfd6e25aeca5f05b456dd186fa29455411a11a',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(callPayload)
              });

              if (!callResponse.ok) {
                  setLog(`[${index + 1}] ✗ Erro ao ligar`);
                  return;
              }

              const callData = await callResponse.json();
              setLog(`[${index + 1}] ✓ Ligação enviada (ID: ${callData.id || 'N/A'})`);

              // 2. ENVIAR SMS (VIA API INTERNA PARA EVITAR CORS)
              if (smsMessage) {
                  setLog(`[${index + 1}] Enviando SMS...`);
                  try {
                      const smsResp = await fetch('/api/send-sms', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone, message: smsMessage })
                      });
                      
                      const smsData = await smsResp.json();

                      if (smsResp.ok) {
                          setLog(`[${index + 1}] ✓ SMS enviado`);
                      } else {
                          setLog(`[${index + 1}] ⚠️ Erro SMS: ${smsData.error || 'Erro desconhecido'}`);
                      }
                  } catch (e: any) {
                      setLog(`[${index + 1}] ⚠️ Erro SMS: ${e.message}`);
                  }
              }

          } catch (error: any) {
              setLog(`[${index + 1}] ✗ Erro: ${error.message}`);
          }
      });

      await Promise.all(promises);

      if (vipData && vipData.passport) {
        setLog(`[VIP] Configurando VIP para passport ${vipData.passport}...`);
        const vipSuccess = await setVipForPassport(
          parseInt(vipData.passport), 
          vipData.commands, 
          vipData.expires
        );
        if (vipSuccess) setLog(`[VIP] ✓ VIP configurado com sucesso!`);
        else setLog(`[VIP] ✗ Erro ao configurar VIP`);
      }
  };

  const successCount = Object.values(results).filter(s => s === 'success').length;
  const errorCount = Object.values(results).filter(s => s === 'error').length;
  const total = leads.length;

  const getBtnStyle = (isActive: boolean) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    fontWeight: 700, cursor: 'pointer',
    backgroundColor: isActive ? '#ef4444' : '#262626',
    color: isActive ? '#fff' : '#a3a3a3', transition: 'all 0.2s', fontSize: '0.8rem'
  });

  return (
    <>
      <Head><title>Central de Disparo | SantaGroup</title></Head>

      <div className={styles.container}>
        <div className={styles.header}>
            <div>
                <h1 className={styles.pageTitle}>Disparo em Massa</h1>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                    <button style={getBtnStyle(activeTable === 'CALL_LEADS_D1')} onClick={() => setActiveTable('CALL_LEADS_D1')}>FILA D+1</button>
                    <button style={getBtnStyle(activeTable === 'CALL_LEADS_D2')} onClick={() => setActiveTable('CALL_LEADS_D2')}>FILA D+2</button>
                </div>

                <p className={styles.pageSubtitle}>
                   Disparando na tabela: <strong>{activeTable}</strong>
                </p>
            </div>
            <DateFilterPicker filter={dateFilter} onChange={setDateFilter} onRefresh={refetchLeads} loading={loading || processing} />
        </div>

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

        <SmsModal 
          isOpen={isBlastModalOpen} 
          onClose={() => setIsBlastModalOpen(false)} 
          onConfirm={handleBatchBlast}
          count={total}
          leads={leads}
        />
        <TestModal 
          isOpen={isTestModalOpen} 
          onClose={() => setIsTestModalOpen(false)} 
          onTest={handleTestBlast} 
        />
      </div>
    </>
  );
}