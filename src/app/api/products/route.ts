import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ProductVariant } from '@/lib/types';

interface VariantInput {
  label?: string;
  weight_grams?: number;
  price?: number;
  stock?: number;
}

// GET: Fetch all products with their variants
export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ message: 'Mode demo/simulasi aktif' });
  }

  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST: Add new cookie product (from Merchant App)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, image_url, texture_badge, variants } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Nama kue dan deskripsi wajib diisi' },
        { status: 400 }
      );
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: '[Simulasi] Produk kue berhasil ditambahkan.',
        data: { name, slug, description, image_url, texture_badge },
      });
    }

    // Insert product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        image_url:
          image_url ||
          'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
        texture_badge: texture_badge || 'Renyah & Gurih',
        rating: 5.0,
        is_active: true,
      })
      .select()
      .single();

    if (prodErr) {
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // Insert variants if provided
    let insertedVariants: ProductVariant[] = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantPayload = (variants as VariantInput[]).map((v) => ({
        product_id: product.id,
        label: v.label || '350g',
        weight_grams: v.weight_grams || 350,
        price: v.price || 85000,
        stock: v.stock !== undefined ? v.stock : 20,
      }));

      const { data: varsData, error: varErr } = await supabase
        .from('product_variants')
        .insert(variantPayload)
        .select();

      if (!varErr && varsData) {
        insertedVariants = varsData as ProductVariant[];
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Produk kue berhasil ditambahkan ke katalog.',
      product: { ...product, product_variants: insertedVariants },
    });
  } catch {
    return NextResponse.json({ error: 'Gagal menambahkan produk kue' }, { status: 500 });
  }
}

// PUT: Update an existing product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, image_url, texture_badge, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib disertakan' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: `[Simulasi] Produk ${id} berhasil diperbarui.`,
      });
    }

    const updatePayload: Record<string, string | boolean | undefined> = {};
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (texture_badge !== undefined) updatePayload.texture_badge = texture_badge;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil diperbarui.',
      data,
    });
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

// DELETE: Delete a product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib disertakan (?id=...)' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: `[Simulasi] Produk ${id} berhasil dihapus.`,
      });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus dari katalog.',
    });
  } catch {
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
