import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateOrderNumber } from '@/lib/utils';
import { mockProducts } from '@/lib/mockData';
import { Order, OrderItem } from '@/lib/types';

const checkoutItemSchema = z.object({
  variant_id: z.string().min(1, 'Variant ID wajib diisi'),
  quantity: z.number().int().min(1, 'Jumlah minimal 1').max(99, 'Jumlah maksimal 99'),
});

const checkoutRequestSchema = z.object({
  customer_name: z.string().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  customer_phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid (contoh: 08123456789)'),
  customer_email: z.string().email().nullable().optional(),
  delivery_type: z.enum(['DELIVERY', 'PICKUP']),
  customer_address: z.string().min(5, 'Alamat minimal 5 karakter'),
  order_note: z.string().max(250).optional().nullable(),
  payment_method: z.enum(['QRIS', 'COD']),
  items: z.array(checkoutItemSchema).min(1, 'Keranjang belanja tidak boleh kosong'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = checkoutRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Data pemesanan tidak valid',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_type,
      customer_address,
      order_note,
      payment_method,
      items: requestedItems,
    } = parseResult.data;

    const orderNumber = generateOrderNumber();
    const orderUuid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    const isUuid = (id: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // MODE 1: LIVE SUPABASE
    if (isSupabaseConfigured) {
      const variantIds = requestedItems.map((i) => i.variant_id);

      // 1. Fetch real prices and stocks from database (never trust client prices!)
      const { data: dbVariants, error: fetchErr } = await supabase
        .from('product_variants')
        .select('id, product_id, label, price, stock, weight_grams, products(id, name, is_active)')
        .in('id', variantIds);

      if (fetchErr || !dbVariants || dbVariants.length === 0) {
        return NextResponse.json(
          { error: 'Gagal memverifikasi varian produk dari database.' },
          { status: 400 }
        );
      }

      // Map DB variants for quick lookup
      interface ProductDetail {
        id: string;
        name: string;
        is_active: boolean;
      }
      interface VariantDetail {
        id: string;
        product_id: string;
        label: string;
        price: number;
        stock: number;
        weight_grams: number;
        products: ProductDetail | ProductDetail[] | null;
      }

      const variantMap = new Map<string, VariantDetail>();
      (dbVariants as unknown as VariantDetail[]).forEach((v) => variantMap.set(v.id, v));

      let serverTotalPrice = 0;
      let serverTotalWeight = 0;
      const orderItemsToInsert: Omit<OrderItem, 'id'>[] = [];
      const stockUpdates: { id: string; newStock: number }[] = [];

      for (const item of requestedItems) {
        const v = variantMap.get(item.variant_id);
        if (!v) {
          return NextResponse.json(
            { error: `Varian produk dengan ID ${item.variant_id} tidak ditemukan.` },
            { status: 400 }
          );
        }

        const prodInfo = Array.isArray(v.products) ? v.products[0] : v.products;
        if (!prodInfo || !prodInfo.is_active) {
          return NextResponse.json(
            { error: `Produk "${prodInfo?.name || 'Kue'}" saat ini sedang tidak aktif.` },
            { status: 400 }
          );
        }

        // 2. Validate Stock Availability
        if (v.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Stok tidak mencukupi untuk ${prodInfo.name} (${v.label}). Sisa stok: ${v.stock}, diminta: ${item.quantity}.`,
            },
            { status: 400 }
          );
        }

        serverTotalPrice += v.price * item.quantity;
        serverTotalWeight += v.weight_grams * item.quantity;

        orderItemsToInsert.push({
          order_id: orderUuid,
          product_variant_id: v.id,
          product_name: prodInfo.name,
          variant_label: v.label,
          quantity: item.quantity,
          unit_price: v.price, // verified from DB!
        });

        stockUpdates.push({
          id: v.id,
          newStock: v.stock - item.quantity,
        });
      }

      // 3. Insert order record
      const finalAddress =
        delivery_type === 'DELIVERY'
          ? customer_address
          : 'Ambil di Toko Fisik (Depok: https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6)';

      const { error: insertOrderErr } = await supabase.from('orders').insert({
        id: orderUuid,
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_address: finalAddress,
        greeting_card_note: order_note || null,
        total_price: serverTotalPrice,
        total_weight_grams: serverTotalWeight,
        order_status: 'pending',
        payment_status: payment_method === 'COD' ? 'unpaid' : 'unpaid',
      });

      if (insertOrderErr) {
        return NextResponse.json(
          { error: `Gagal mencatat pesanan: ${insertOrderErr.message}` },
          { status: 500 }
        );
      }

      // 4. Insert order items
      if (orderItemsToInsert.length > 0) {
        const itemsWithUuid = orderItemsToInsert
          .filter((oi) => isUuid(oi.product_variant_id))
          .map((oi) => ({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
            ...oi,
          }));

        if (itemsWithUuid.length > 0) {
          const { error: insertItemsErr } = await supabase.from('order_items').insert(itemsWithUuid);
          if (insertItemsErr) {
            console.error('Error inserting order items:', insertItemsErr);
          }
        }
      }

      // 5. Update stock in database
      for (const update of stockUpdates) {
        if (isUuid(update.id)) {
          await supabase
            .from('product_variants')
            .update({ stock: update.newStock, updated_at: new Date().toISOString() })
            .eq('id', update.id);
        }
      }

      const createdOrder: Order = {
        id: orderUuid,
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_address: finalAddress,
        order_note: order_note || null,
        greeting_card_note: order_note || null,
        total_price: serverTotalPrice,
        total_weight_grams: serverTotalWeight,
        order_status: 'pending',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderItemsToInsert.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          ...item,
        })),
      };

      return NextResponse.json({
        success: true,
        message: 'Pesanan berhasil dibuat.',
        data: createdOrder,
      });
    }

    // MODE 2: SIMULATION / DEMO (When Supabase is not configured)
    let demoTotalPrice = 0;
    let demoTotalWeight = 0;
    const demoItems: OrderItem[] = [];

    for (const reqItem of requestedItems) {
      let foundVariant = null;
      let foundProduct = null;

      for (const p of mockProducts) {
        const v = p.product_variants.find((v) => v.id === reqItem.variant_id);
        if (v) {
          foundVariant = v;
          foundProduct = p;
          break;
        }
      }

      const price = foundVariant ? foundVariant.price : 85000;
      const weight = foundVariant ? foundVariant.weight_grams : 350;
      const name = foundProduct ? foundProduct.name : 'Kue Lebaran';
      const label = foundVariant ? foundVariant.label : '350g';

      demoTotalPrice += price * reqItem.quantity;
      demoTotalWeight += weight * reqItem.quantity;

      demoItems.push({
        id: `demo-item-${Date.now()}-${reqItem.variant_id}`,
        order_id: orderUuid,
        product_variant_id: reqItem.variant_id,
        product_name: name,
        variant_label: label,
        quantity: reqItem.quantity,
        unit_price: price,
      });
    }

    const demoAddress =
      delivery_type === 'DELIVERY'
        ? customer_address
        : 'Ambil di Toko Fisik (Depok: https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6)';

    const demoOrder: Order = {
      id: orderUuid,
      order_number: orderNumber,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      customer_address: demoAddress,
      order_note: order_note || null,
      greeting_card_note: order_note || null,
      total_price: demoTotalPrice,
      total_weight_grams: demoTotalWeight,
      order_status: 'pending',
      payment_status: 'unpaid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: demoItems,
    };

    return NextResponse.json({
      success: true,
      message: '[Simulasi] Pesanan berhasil dibuat.',
      data: demoOrder,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses pemesanan.' },
      { status: 500 }
    );
  }
}
