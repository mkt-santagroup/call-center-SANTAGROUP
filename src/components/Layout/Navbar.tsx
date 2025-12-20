import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Navbar.module.css';
import { LogOut, BarChart3, PhoneOutgoing, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      router.push('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Verifica se o link é a página atual para pintar de outra cor
  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className={styles.navbar}>
      {/* 1. Logo */}
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.iconBox}>
            <BarChart3 size={24} color="#ededed" />
          </div>
          <span className={styles.brandName}>
            Santa<span style={{ color: '#ef4444' }}>Metrics</span>
          </span>
        </Link>
      </div>

      {/* 2. Menu Central (Dashboard e Disparador) */}
      <div className={styles.navMenu}>
        <Link 
            href="/" 
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
        >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
        </Link>
        
        <Link 
            href="/dialer" 
            className={`${styles.navLink} ${isActive('/dialer') ? styles.active : ''}`}
        >
            <PhoneOutgoing size={18} />
            <span>Disparador</span>
        </Link>
      </div>

      {/* 3. Botão Sair */}
      <div className={styles.actionsSection}>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Sair do sistema">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}