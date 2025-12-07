import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 한글 포함 원본은 메타로 보존하고, 업로드 키는 안전하게 생성
export async function uploadPdfFile(file: File, docId: number): Promise<string> {
  try {
    const originalName = file.name;
    const ext = originalName.split('.').pop() || 'bin';
    // 1) URL-인코딩 후 '%' 제거 -> 안전 문자(영숫자, _, - , . )만 남김
    const encoded = encodeURIComponent(originalName).replace(/%/g, '_');
    // 2) 또 안전하게: 연속 언더스코어/슬래시 제거, 길이 제한 적용
    const safeName = encoded.replace(/\/+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const key = `files/${docId}_${timestamp}_${rand}_${safeName}.${ext}`.replace(/\.\./g, '.');

    console.log('upload key:', key, 'original:', originalName);

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(key, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('upload error:', error);
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(key);
    if (!publicUrlData?.publicUrl) throw new Error('공개 URL 생성 실패');

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('uploadPdfFile error:', err);
    throw err;
  }
}

// ✅ 파일 다운로드
export async function downloadPdfFile(fileUrl: string): Promise<void> {
  try {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = 'document';
    link.click();
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    throw error;
  }
}

// ✅ 문서 업로드 (DB 저장)
export const uploadDocument = async (
  docId: number,
  title: string,
  seller: string,
  fileUrl: string,
  description: string,
  pricePerToken: string,
  amount: number
) => {
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        doc_id: docId,
        title,
        seller,
        file_url: fileUrl,
        description,
        price_per_token: pricePerToken,
        amount,
      },
    ])
    .select();

  if (error) {
    console.error('Document upload error:', error);
    throw new Error(`문서 업로드 실패: ${error.message}`);
  }

  return data;
};

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

// -- Supabase RLS 정책 설정 (SQL Editor에서 실행)
// CREATE POLICY "allow_insert_documents" ON documents
// FOR INSERT
// WITH CHECK (true);

// CREATE POLICY "allow_select_documents" ON documents
// FOR SELECT
// USING (true);

// CREATE POLICY "allow_insert_transactions" ON transactions
// FOR INSERT
// WITH CHECK (true);

// CREATE POLICY "allow_select_transactions" ON transactions
// FOR SELECT
// USING (true);