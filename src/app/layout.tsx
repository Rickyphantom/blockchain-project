// app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'File ↔ Coin Platform',
  description: '블록체인을 사용한 전자거래 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="header">
          <div className="brand">File ↔ Coin</div>
          <nav className="nav">
            <Link href="/">홈</Link>
            <Link href="/upload">등록</Link>
            <Link href="/market">마켓</Link>
          </nav>
        </header>

        <main className="container">{children}</main>

        {/* 배경 장식 */}
        <div className="bgOrbs"><div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/></div>

        <style jsx global>{`
          :root{
            --bg:#0a0f1a; --panel:#0f1524cc; --stroke:#2a3550;
            --text:#e6eefc; --muted:#9bb0d4; --accent:#3ea0ff; --accent2:#6be6ff; --danger:#ff6470;
          }
          html, body { height: 100%; }
          body {
            margin:0; color:var(--text);
            font-family: ui-sans-serif, system-ui, -apple-system, 'Noto Sans KR', Segoe UI, Roboto, sans-serif;
            background: radial-gradient(1200px 800px at 10% 10%, #0e1a2b 0%, #0a0f1a 60%, #080c16 100%);
          }
          .header {
            max-width: 1000px; margin: 0 auto; padding: 18px 16px;
            display:flex; justify-content:space-between; align-items:center;
          }
          .brand {
            font-weight:800; font-size:22px;
            background: linear-gradient(90deg,var(--accent),var(--accent2));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
          .nav { display:flex; gap:14px; }
          .nav a { color: var(--text); text-decoration:none; opacity:.9 }
          .nav a:hover { color: var(--accent) }
          .container { max-width: 1000px; margin: 18px auto 80px; padding: 0 16px; position: relative; z-index: 1; }

          .card {
            background: var(--panel); border:1px solid var(--stroke); border-radius: 16px;
            padding: 18px; box-shadow: 0 10px 40px rgba(8,12,22,.5), inset 0 1px 0 rgba(255,255,255,.03);
            backdrop-filter: blur(10px);
          }
          .label{ font-size:12px; color:var(--muted); margin-bottom:6px; }
          .mono{ font-family: ui-monospace, Menlo, Consolas, monospace; }

          .btn{
            appearance:none; border:0; cursor:pointer; padding:12px 16px; border-radius:12px;
            font-weight:700; letter-spacing:.2px; transition: transform .05s ease, box-shadow .2s ease, background .2s ease;
          }
          .btn.primary{ color:#07101b; background:linear-gradient(180deg,#6be6ff,#3ea0ff); box-shadow:0 6px 20px rgba(62,160,255,.35); }
          .btn.ghost{ color:var(--text); background:linear-gradient(180deg,#131b30,#0d1426); border:1px solid var(--stroke); }
          .error{
            margin-top:12px; color:var(--danger); background:rgba(255,100,112,.08);
            border:1px solid rgba(255,100,112,.25); padding:10px 12px; border-radius:12px; font-size:14px;
          }

          .bgOrbs{ position: fixed; inset: 0; pointer-events:none; overflow:hidden; z-index: 0;}
          .orb{ position:absolute; filter: blur(60px); opacity:.35; border-radius:50%; mix-blend-mode: screen; }
          .orb1{ width:460px; height:460px; left:-80px; top:-80px; background: radial-gradient(closest-side, #7ed3ff, transparent); }
          .orb2{ width:520px; height:520px; right:-120px; top:40%; background: radial-gradient(closest-side, #8fb0ff, transparent); }
          .orb3{ width:380px; height:380px; left:40%; bottom:-140px; background: radial-gradient(closest-side, #c6d6ff, transparent); }
        `}</style>
      </body>
    </html>
  );
}
