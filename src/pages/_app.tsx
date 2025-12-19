// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Navbar from "@/components/Layout/Navbar"; // Importe a Navbar

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar /> {/* Adicionado aqui */}
      <Component {...pageProps} />
    </>
  );
}