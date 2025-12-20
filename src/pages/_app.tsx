// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "@/components/Layout/Navbar";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Verifica se a rota atual é a de login
  const isLoginPage = router.pathname === '/login';

  return (
    <>
      {/* Só mostra a Navbar se NÃO for a página de login */}
      {!isLoginPage && <Navbar />}
      <Component {...pageProps} />
    </>
  );
}