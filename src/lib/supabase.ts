import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 파일 업로드 (한글 지원)
export async function uploadPdfFile(file: File, docId: number): Promise<string> {
  try {
    // 원본 파일명 보존 (한글 포함)
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop() || 'file';
    
    // URL safe하게 인코딩
    const encodedFileName = encodeURIComponent(originalName);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    // 저장 경로: files/docId_timestamp_randomId_encodedFileName
    const fileName = `${docId}_${timestamp}_${randomId}_${encodedFileName}`;

    console.log('📤 업로드 시작:', originalName);
    console.log('💾 저장 경로:', fileName);

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`files/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ 업로드 오류:', error);
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    console.log('✅ 파일 업로드 완료:', data);

    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`files/${fileName}`);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('공개 URL 생성 실패');
    }

    console.log('✅ 공개 URL 생성 완료:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('파일 업로드 중 오류 발생:', error);
    throw error;
  }
}

// ✅ 파일 다운로드
export async function downloadPdfFile(pdfUrl: string): Promise<void> {
  try {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document';
    link.click();
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    throw error;
  }
}

// ✅ 문서 업로드 (DB 저장)
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