import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadPdfFile(file: File, docId: number): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${docId}-${Date.now()}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('파일 업로드 에러:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('documents').getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDocument(docId: number) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('doc_id', docId)
    .single();

  if (error) throw error;
  return data;
}

// 판매 중단 (DB만)
export async function deactivateDocument(docId: number, seller: string) {
  const { data, error } = await supabase
    .from('documents')
    .update({ is_active: false })
    .eq('doc_id', docId)
    .eq('seller', seller.toLowerCase());

  if (error) throw error;
  return data;
}

// 판매 재개 (DB만)
export async function reactivateDocument(docId: number, seller: string) {
  const { data, error } = await supabase
    .from('documents')
    .update({ is_active: true })
    .eq('doc_id', docId)
    .eq('seller', seller.toLowerCase());

  if (error) throw error;
  return data;
}

// 구매 기록 저장
export async function savePurchase(
  buyer: string,
  docId: number,
  quantity: number,
  totalPrice: string,
  txHash: string
) {
  const { data, error } = await supabase
    .from('purchases')
    .insert([
      {
        buyer: buyer.toLowerCase(),
        doc_id: docId,
        quantity: quantity,
        total_price: totalPrice,
        tx_hash: txHash,
      },
    ])
    .select();

  if (error) {
    console.error('구매 기록 저장 실패:', error);
    throw error;
  }

  return data;
}

// 사용자의 구매 목록 조회
export async function getUserPurchases(buyer: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      documents (
        doc_id,
        title,
        description,
        price_per_token,
        file_url,
        seller
      )
    `)
    .eq('buyer', buyer.toLowerCase())
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('구매 목록 조회 실패:', error);
    throw error;
  }

  return data;
}