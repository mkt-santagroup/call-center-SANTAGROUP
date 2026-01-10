// src/pages/api/process-call.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const DISPARO_URL_SEND = "https://gateway.disparopro.com.br/voice/v1/call/send";
const DISPARO_URL_STATUS = "https://gateway.disparopro.com.br/voice/v1/call";
const DISPARO_TOKEN = "80bfd6e25aeca5f05b456dd186fa29455411a11a";
const AUDIO_ID = "a3d4342b-b11b-4166-9062-bc57e0ba9c73";

const SMS_URL = "https://sms.comtele.com.br/api/v2/send";
const COMTELE_KEY = "4b20f8a0-f59e-44a0-9d86-0c866934cbfd";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead_id, whatsapp, sms_message, table_name } = req.body;
  const TARGET_TABLE = table_name || 'CALL_LEADS_D2';

  if (!whatsapp || !lead_id) {
    return res.status(400).json({ error: 'Faltando ID ou Whatsapp.' });
  }

  let phone = whatsapp.replace(/\D/g, ''); 
  if (!phone.startsWith('55')) phone = '55' + phone;
  phone = '+' + phone; 

  try {
    // 1. LIGAR 
    console.log(`[${lead_id}] 1. Disparando para ${phone}...`);

    const callPayload = {
        phone: phone,
        type: "audio",
        audio_id: AUDIO_ID,
        message: "Audio message"
    };

    const callResponse = await fetch(DISPARO_URL_SEND, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'token': DISPARO_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(callPayload)
    });

    const callData = await callResponse.json();
    if (!callResponse.ok) throw new Error(`Erro DisparoPro: ${JSON.stringify(callData)}`);
    const CALL_ID = callData.id || callData.data?.id;
    if (!CALL_ID) throw new Error("Disparo realizado mas sem ID retornado!");

    // 2. ESPERAR 1 MINUTO
    await sleep(60000);

    // 3. VERIFICAR STATUS
    const statusResponse = await fetch(`${DISPARO_URL_STATUS}?id=${CALL_ID}`, {
        method: 'GET',
        headers: {
            'token': DISPARO_TOKEN,
            'accept': 'application/json'
        }
    });
    const statusData = await statusResponse.json();
    let callItem = (statusData.items && statusData.items[0]) ? statusData.items[0] : statusData;
    const rawStatus = callItem.status_call || callItem.status || 'unknown';
    const finalPrice = Number(callItem.price ?? 0);

    // 4. MANDAR SMS
    let smsSent = false;
    if (sms_message) {
        console.log(`[${lead_id}] 4. Enviando SMS...`);
        try {
            const smsResp = await fetch(SMS_URL, {
                method: 'POST',
                headers: {
                    'auth-key': COMTELE_KEY,
                    'Content-Type': 'application/json' // Definido como JSON explicitamente
                },
                body: JSON.stringify({
                    Receivers: phone, 
                    Content: sms_message
                })
            });
            
            if (smsResp.ok) smsSent = true;
            else console.error(`[${lead_id}] Erro SMS:`, await smsResp.text());
        } catch (e) {
            console.error(`[${lead_id}] Falha requisição SMS:`, e);
        }
    }

    // 5. ATUALIZAR BANCO
    const { data: currentLead } = await supabase
        .from(TARGET_TABLE)
        .select('call_history')
        .eq('id', lead_id)
        .single();

    if (currentLead) {
        const history = Array.isArray(currentLead.call_history) ? currentLead.call_history : [];
        const nextCount = history.length > 0 ? (history[history.length-1].call_number || history.length) + 1 : 1;

        const newLogEntry = {
            data: new Date().toISOString(),
            price: finalPrice,              
            status: rawStatus,              
            call_id: CALL_ID,
            call_number: nextCount          
        };

        await supabase.from(TARGET_TABLE).update({
                call_history: [...history, newLogEntry],
                call_count: nextCount,
                called_at: new Date().toISOString()
            }).eq('id', lead_id);
    }

    return res.status(200).json({ success: true, call_id: CALL_ID, status: rawStatus, sms_sent: smsSent });

  } catch (error: any) {
    console.error(`[${lead_id}] Erro Geral:`, error);
    return res.status(500).json({ error: error.message });
  }
}