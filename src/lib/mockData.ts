import { ProductWithVariants } from '@/lib/types';

export const mockProducts: ProductWithVariants[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Nastar Spesial Wisman',
    slug: 'nastar-spesial-wisman',
    description:
      'Nastar lembut dengan selai nanas homemade yang dipanggang sempurna menggunakan butter Wisman pilihan. Lumer di mulut, manisnya pas, cocok untuk suguhan tamu istimewa di hari raya.',
    image_url: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    texture_badge: 'Lembut',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-001-250', product_id: '00000000-0000-0000-0000-000000000001', label: '250g', weight_grams: 250, price: 85000, stock: 50 },
      { id: 'v-001-350', product_id: '00000000-0000-0000-0000-000000000001', label: '350g', weight_grams: 350, price: 115000, stock: 40 },
      { id: 'v-001-500', product_id: '00000000-0000-0000-0000-000000000001', label: '500g', weight_grams: 500, price: 155000, stock: 30 },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Kastengel Keju Edam',
    slug: 'kastengel-keju-edam',
    description:
      'Kastengel renyah berlapis keju Edam asli yang gurih dan harum. Dipanggang hingga keemasan, setiap gigitan menghadirkan rasa keju yang kaya dan tak terlupakan.',
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    texture_badge: 'Renyah',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-002-250', product_id: '00000000-0000-0000-0000-000000000002', label: '250g', weight_grams: 250, price: 90000, stock: 45 },
      { id: 'v-002-350', product_id: '00000000-0000-0000-0000-000000000002', label: '350g', weight_grams: 350, price: 120000, stock: 35 },
      { id: 'v-002-500', product_id: '00000000-0000-0000-0000-000000000002', label: '500g', weight_grams: 500, price: 165000, stock: 25 },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Putri Salju Mede',
    slug: 'putri-salju-mede',
    description:
      'Kue mungil bertabur gula halus dengan kacang mede utuh di setiap potongnya. Teksturnya lembut, langsung hancur begitu menyentuh lidah. Favorit sepanjang masa.',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    texture_badge: 'Lumer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-003-250', product_id: '00000000-0000-0000-0000-000000000003', label: '250g', weight_grams: 250, price: 80000, stock: 55 },
      { id: 'v-003-350', product_id: '00000000-0000-0000-0000-000000000003', label: '350g', weight_grams: 350, price: 108000, stock: 40 },
      { id: 'v-003-500', product_id: '00000000-0000-0000-0000-000000000003', label: '500g', weight_grams: 500, price: 148000, stock: 30 },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Sagu Keju Santan',
    slug: 'sagu-keju-santan',
    description:
      'Perpaduan unik sagu berkualitas tinggi dengan santan segar dan taburan keju. Renyah di luar, lembut di dalam, dengan aroma harum yang menggugah selera.',
    image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    texture_badge: 'Renyah',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-004-250', product_id: '00000000-0000-0000-0000-000000000004', label: '250g', weight_grams: 250, price: 75000, stock: 60 },
      { id: 'v-004-350', product_id: '00000000-0000-0000-0000-000000000004', label: '350g', weight_grams: 350, price: 100000, stock: 45 },
      { id: 'v-004-500', product_id: '00000000-0000-0000-0000-000000000004', label: '500g', weight_grams: 500, price: 138000, stock: 35 },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Cokelat Mede Crunchy',
    slug: 'cokelat-mede-crunchy',
    description:
      'Kue cokelat premium dengan potongan kacang mede panggang yang renyah. Menggunakan dark couverture chocolate berkualitas untuk rasa cokelat yang intens dan tidak terlalu manis.',
    image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
    rating: 4.5,
    texture_badge: 'Crunchy',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-005-250', product_id: '00000000-0000-0000-0000-000000000005', label: '250g', weight_grams: 250, price: 88000, stock: 40 },
      { id: 'v-005-350', product_id: '00000000-0000-0000-0000-000000000005', label: '350g', weight_grams: 350, price: 118000, stock: 30 },
      { id: 'v-005-500', product_id: '00000000-0000-0000-0000-000000000005', label: '500g', weight_grams: 500, price: 162000, stock: 20 },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Lidah Kucing Keju',
    slug: 'lidah-kucing-keju',
    description:
      'Kue tipis memanjang yang dipanggang hingga keemasan sempurna. Renyahnya tahan lama berkat resep turun temurun, dengan sentuhan keju yang gurih di setiap lembarnya.',
    image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    texture_badge: 'Crispy',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product_variants: [
      { id: 'v-006-250', product_id: '00000000-0000-0000-0000-000000000006', label: '250g', weight_grams: 250, price: 78000, stock: 50 },
      { id: 'v-006-350', product_id: '00000000-0000-0000-0000-000000000006', label: '350g', weight_grams: 350, price: 105000, stock: 40 },
      { id: 'v-006-500', product_id: '00000000-0000-0000-0000-000000000006', label: '500g', weight_grams: 500, price: 145000, stock: 30 },
    ],
  },
];
