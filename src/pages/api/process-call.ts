import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente (Configure no seu .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DISPARO_TOKEN = process.env.DISPARO_TOKEN || '80bfd6e25aeca5f05b456dd186fa29455411a11a';
const COMTELE_KEY = process.env.COMTELE_KEY || '4b20f8a0-f59e-44a0-9d86-0c866934cbfd';
const AUDIO_ID = 'a3d4342b-b11b-4166-9062-bc57e0ba9c73';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { lead_id, phone, send_sms, sms_content } = req.body;

  if (!phone) return res.status(400).json({ error: 'Telefone obrigatório.' });

  try {
    // 1. Tratamento do telefone
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

    console.log(`[CALL] Iniciando para ${cleanPhone} (Lead ID: ${lead_id})`);

    // 2. Disparo Pro (Voz)
    const callRes = await fetch('https://gateway.disparopro.com.br/voice/v1/call/send', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'token': DISPARO_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: cleanPhone, type: 'audio', audio_id: AUDIO_ID })
    });

    const callData = await callRes.json();
    if (!callRes.ok || !callData.data?.id) {
      // Tenta pegar o ID de lugares diferentes dependendo da resposta da API
      const errorId = callData.id || callData.data?.id;
      if(!errorId) throw new Error(`Erro Gateway Voz: ${JSON.stringify(callData)}`);
    }
    
    const callId = callData.data?.id || callData.id;

    // 3. Aguarda processamento (Lógica original pedia 60s)
    await sleep(60000);

    // 4. Checagem de Status
    let finalStatus = 'UNKNOWN';
    let finalPrice = 0;
    
    try {
      const statusRes = await fetch(`https://gateway.disparopro.com.br/voice/v1/call?id=${callId}`, {
         headers: { 'token': DISPARO_TOKEN }
      });
      const statusData = await statusRes.json();
      const item = statusData.items ? statusData.items[0] : statusData.data;
      
      finalStatus = item?.status_call || item?.status || 'UNKNOWN';
      finalPrice = Number(item?.price || 0);
    } catch (e) {
      console.error('Erro ao checar status:', e);
    }

    // 5. Envio de SMS (Comtele)
    if (send_sms && sms_content) {
      await fetch('https://sms.comtele.com.br/api/v2/send', {
        method: 'POST',
        headers: { 'auth-key': COMTELE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Receivers: `+${cleanPhone}`, Content: sms_content })
      });
    }

    // 6. Atualização do Supabase
    if (lead_id && lead_id !== 0) {
      const { data: lead } = await supabase.from('CALL_LEADS_D2').select('call_count, call_history').eq('id', lead_id).single();
      
      if (lead) {
        const newHistory = [
          ...(lead.call_history || []),
          {
            call_number: (lead.call_count || 0) + 1,
            date: new Date().toISOString(),
            call_id: callId,
            status: finalStatus,
            price: finalPrice
          }
        ];

        await supabase.from('CALL_LEADS_D2').update({
          call_count: (lead.call_count || 0) + 1,
          call_history: newHistory,
          status: 'CALLED',
          called_at: new Date().toISOString()
        }).eq('id', lead_id);
      }
    }

    return res.status(200).json({ success: true, status: finalStatus });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}