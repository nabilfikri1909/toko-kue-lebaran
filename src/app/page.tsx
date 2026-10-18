import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { ProductWithVariants } from '@/lib/types';
import CatalogClient from '@/components/CatalogClient';
import { mockProducts } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let products: ProductWithVariants[] = [];
  let isLiveDb = false;

  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .order('name');

    if (!error && data && data.length > 0) {
      products = data as ProductWithVariants[];
      isLiveDb = true;
    }
  } catch (err) {
    console.warn('Supabase SSR fetch notice:', err);
  }

  // Fallback to initial seed catalog if Supabase credentials are not set yet
  if (products.length === 0) {
    products = mockProducts;
  }

  return <CatalogClient products={products} isLiveDb={isLiveDb} />;
}
