import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET: View all cookie variants with their current stock levels
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({
      message: 'Supabase belum dikonfigurasi di .env.local. Mode simulasi aktif.',
      mode: 'demo',
    });
  }

  const { data, error } = await supabase
    .from('product_variants')
    .select('id, product_id, label, price, stock, weight_grams, products(name)')
    .order('product_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST: Update stock of a specific variant (callable from Merchant App)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant_id, stock } = body;

    if (!variant_id || typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Parameter variant_id dan stock (angka >= 0) wajib disertakan' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: `[Simulasi] Stok varian ${variant_id} berhasil diupdate menjadi ${stock}.`,
        variant_id,
        stock,
      });
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', variant_id)
      .select('id, product_id, label, stock')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Stok kue berhasil diperbarui.',
      data,
    });
  } catch {
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 });
  }
}

// PUT: Update variant details (price, label, weight, stock)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant_id, price, label, weight_grams, stock } = body;

    if (!variant_id) {
      return NextResponse.json({ error: 'variant_id wajib disertakan' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: `[Simulasi] Varian ${variant_id} berhasil diperbarui.`,
      });
    }

    const payload: Record<string, string | number | undefined> = { updated_at: new Date().toISOString() };
    if (price !== undefined) payload.price = price;
    if (label !== undefined) payload.label = label;
    if (weight_grams !== undefined) payload.weight_grams = weight_grams;
    if (stock !== undefined) payload.stock = stock;

    const { data, error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', variant_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Varian toples berhasil diperbarui.',
      data,
    });
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui varian' }, { status: 500 });
  }
}

// DELETE: Delete a specific variant
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const variant_id = searchParams.get('variant_id');

    if (!variant_id) {
      return NextResponse.json({ error: 'variant_id wajib disertakan (?variant_id=...)' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: `[Simulasi] Varian ${variant_id} berhasil dihapus.`,
      });
    }

    const { error } = await supabase.from('product_variants').delete().eq('id', variant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Varian toples berhasil dihapus.',
    });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus varian' }, { status: 500 });
  }
}
