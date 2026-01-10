// src/pages/api/send-sms.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const SMS_URL = "https://sms.comtele.com.br/api/v2/send";
const COMTELE_KEY = "4b20f8a0-f59e-44a0-9d86-0c866934cbfd";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
  }

  try {
    const response = await fetch(SMS_URL, {
      method: 'POST',
      headers: {
        'auth-key': COMTELE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Receivers: phone,
        Content: message
      })
    });

    const data = await response.text(); // A Comtele as vezes retorna texto puro, as vezes JSON

    if (!response.ok) {
      throw new Error(`Erro API SMS: ${response.status} - ${data}`);
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Erro ao enviar SMS:', error);
    return res.status(500).json({ error: error.message });
  }
}