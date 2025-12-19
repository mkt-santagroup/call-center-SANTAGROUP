import Head from 'next/head';
import CallDashboard from '@/components/CallCenter/CallDashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>Call Center Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <CallDashboard />
      </main>
    </>
  );
}