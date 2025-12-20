// src/pages/login.tsx
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/'); // Sucesso! Vai pra Home
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#0a0a0a', color: '#ededed'
    }}>
      <Head><title>Acesso Restrito | SantaGroup</title></Head>

      <div style={{
        width: '100%', maxWidth: '400px', padding: '2rem', 
        backgroundColor: '#171717', borderRadius: '12px', border: '1px solid #262626',
        display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{ 
                width: '48px', height: '48px', backgroundColor: '#262626', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem auto'
            }}>
                <Lock size={24} color="#ededed" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Acesso Restrito</h1>
            <p style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>Digite a senha mestre para acessar o dashboard.</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
                type="password" 
                placeholder="Senha de Acesso"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                style={{
                    padding: '0.75rem', borderRadius: '8px', border: error ? '1px solid #ef4444' : '1px solid #404040',
                    backgroundColor: '#0a0a0a', color: 'white', outline: 'none', fontSize: '1rem'
                }}
            />
            {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>Senha incorreta. Tente novamente.</span>}

            <button 
                type="submit" 
                disabled={loading}
                style={{
                    padding: '0.75rem', borderRadius: '8px', border: 'none',
                    backgroundColor: '#ededed', color: '#000', fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <>Acessar <ArrowRight size={18} /></>}
            </button>
        </form>
      </div>
    </div>
  );
}