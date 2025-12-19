// src/components/Layout/Navbar.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './Navbar.module.css';
import { LayoutDashboard, Phone, LogOut } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();

  // Função para verificar se o link está ativo
  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* LOGO / TÍTULO */}
        <div className={styles.logo}>
            <span className={styles.logoHighlight}>Santa</span>Group
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <div className={styles.links}>
          <Link 
            href="/" 
            className={`${styles.link} ${isActive('/') ? styles.active : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link 
            href="/dialer" 
            className={`${styles.link} ${isActive('/dialer') ? styles.active : ''}`}
          >
            <Phone size={18} />
            Realizar Chamadas
          </Link>
        </div>

        {/* LADO DIREITO (Logout ou Perfil) */}
        <div className={styles.actions}>
            <button className={styles.logoutBtn}>
                <LogOut size={16} />
                <span className={styles.logoutText}>Sair</span>
            </button>
        </div>
      </div>
    </nav>
  );
}