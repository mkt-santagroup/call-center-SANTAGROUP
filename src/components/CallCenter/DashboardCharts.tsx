import React from 'react';
import styles from './DashboardCharts.module.css';
import { ChartDataLead, ChartDataCall } from '@/types';
import { AreaChart, Area, BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Phone } from 'lucide-react';

interface Props {
  leadData: ChartDataLead[];
  callData: ChartDataCall[];
}

export default function DashboardCharts({ leadData, callData }: Props) {
  return (
    <div className={styles.grid}>
      
      {/* Gráfico Tendência */}
      <div className={styles.card}>
          <h3 className={styles.title}>Tendência de Recuperação</h3>
          <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={leadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                      <linearGradient id="colRecDia" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', color: '#ededed' }} />
                  <Legend iconType="circle" />
                  
                  {/* 1. Total (Linha Azul) */}
                  <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" fill="none" strokeWidth={2} />
                  
                  {/* 2. Recuperado no dia (Verde) */}
                  <Area type="monotone" dataKey="rec_dia" name="Recuperado no dia" stroke="#22c55e" fill="url(#colRecDia)" strokeWidth={2} stackId="1" />
                  
                  {/* 3. Recuperado 7 dias (Azul Claro) */}
                  <Area type="monotone" dataKey="rec_depois" name="Recuperado 7 dias" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} stackId="1" />

                  {/* 4. Voltou antes (Roxo) */}
                  <Area type="monotone" dataKey="rec_antes" name="Voltou Antes" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} stackId="1" />
                  
              </ComposedChart>
          </ResponsiveContainer>
      </div>

      {/* Gráfico Chamadas (MANTIDO) */}
      <div className={styles.card}>
          <h3 className={styles.title}><Phone size={20} /> Performance de Ligações</h3>
          <ResponsiveContainer width="100%" height="90%">
              <BarChart data={callData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a3a3a3', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#333' }} contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', color: '#ededed' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="answered" name="Atendida" stackId="a" fill="#16a34a" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="no_answer" name="Sem Resposta" stackId="a" fill="#ca8a04" />
                  <Bar dataKey="busy" name="Ocupado" stackId="a" fill="#ea580c" />
                  <Bar dataKey="failed" name="Falha" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
      </div>

    </div>
  );
}