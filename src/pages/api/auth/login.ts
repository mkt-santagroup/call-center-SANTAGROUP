// src/pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;

  // Verifica a senha do .env
  if (password === process.env.AUTH_PASSWORD) {
    
    // DEFININDO O COOKIE
    const cookie = serialize('auth_token', 'logged_in', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      
      // MUDANÇA AQUI: 
      // Antes era 1 dia (60 * 60 * 24).
      // Agora colocamos 1 ano (365 dias) para não deslogar nunca sozinho.
      maxAge: 60 * 60 * 24 * 365, 
      
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Senha incorreta' });
}