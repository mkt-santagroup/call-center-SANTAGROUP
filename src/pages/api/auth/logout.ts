// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Substitui o cookie por um expirado
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0), // Data no passado expira imediatamente
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}