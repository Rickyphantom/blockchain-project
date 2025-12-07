import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 문서 업로드 (블록체인 등록 후)
export async function uploadDocument(
  doc_id: number,
  title: string,
  seller: string,
  pdf_url: string,
  description: string,
  price_per_token: string,
  amount: number
) {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        doc_id,
        title,
        seller,
        pdf_url,
        description,
        price_per_token,
        amount,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase 저장 실패:', error);
    throw error;
  }
  return data;
}

// ✅ 모든 문서 조회
export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('문서 조회 실패:', error);
    throw error;
  }
  return data;
}

// ✅ 문서 검색 (제목/설명)
export async function searchDocuments(query: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('검색 실패:', error);
    throw error;
  }
  return data;
}

// ✅ 특정 판매자의 문서
export async function getDocumentsBySeller(seller: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('seller', seller)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ✅ 거래 기록 저장
export async function recordTransaction(
  doc_id: number,
  seller: string,
  buyer: string,
  amount: number,
  price_per_token: string,
  total_price: string,
  tx_hash: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        doc_id,
        seller,
        buyer,
        amount,
        price_per_token,
        total_price,
        tx_hash,
        status: 'completed',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ✅ 거래 기록 조회
export async function getTransactionsByUser(userAddress: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`buyer.eq.${userAddress},seller.eq.${userAddress}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ✅ 특정 문서의 거래 기록
export async function getTransactionsByDocId(doc_id: number) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('doc_id', doc_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}