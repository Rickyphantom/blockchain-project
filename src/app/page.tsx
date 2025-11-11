// app/page.tsx
import ConnectCard from '@/components/ConnectCard';

export default function Page() {
  return (
    <div style={{display:'grid', gap:16}}>
      <ConnectCard />
      <section className="card">
        <h2 style={{marginTop:0}}>다음 단계</h2>
        <ol style={{margin:'6px 0 0 18px'}}>
          <li><b>등록</b>: 상단 네비의 <code>/upload</code>에서 IPFS CID와 가격을 넣어 판매 등록</li>
          <li><b>마켓</b>: <code>/market</code>에서 문서 조회 및 구매</li>
        </ol>
      </section>
    </div>
  );
}
