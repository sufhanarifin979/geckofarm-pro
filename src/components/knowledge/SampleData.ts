import { Morph } from '../../types';

export const SAMPLE_MORPHS: Morph[] = [
  {
    id: 'tremper-albino',
    name: 'Tremper Albino',
    description: 'Strain albino pertama dari tiga jenis yang ada, ditemukan oleh Ron Tremper pada tahun 1996. Tremper Albino memiliki warna berkisar dari putih dan kuning hingga oranye. Mereka kekurangan pigmen hitam dan biasanya memiliki corak berwarna cokelat atau krem.',
    genetic_type: 'recessive',
    traits: ['Albino', 'Mata Terang', 'Warna Kuning/Oranye'],
    price_range: 'Rp 500rb - Rp 1.5jt',
    image_url: ''
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Sifat resesif yang mempengaruhi warna mata dan pola. Gecko Eclipse memiliki mata hitam pekat (atau merah pekat pada albino). Mereka sering menunjukkan ciri "hidung putih" atau "pied" pada ekor dan anggota badan.',
    genetic_type: 'recessive',
    traits: ['Mata Solid', 'Hidung Putih', 'Kontras Tinggi'],
    price_range: 'Rp 600rb - Rp 2jt',
    image_url: ''
  },
  {
    id: 'mack-snow',
    name: 'Mack Snow',
    description: 'Sifat ko-dominan yang mengurangi pigmen kuning pada tukik (hatchling), membuat mereka terlihat hitam dan putih. Seiring bertambahnya usia, mereka mungkin mengembangkan sedikit warna kuning. Persilangan dua Mack Snow dapat menghasilkan Super Snow.',
    genetic_type: 'dominant',
    traits: ['Warna Dasar Putih', 'Bintik Hitam', 'Ko-dominan'],
    price_range: 'Rp 400rb - Rp 1.2jt',
    image_url: ''
  },
  {
    id: 'tangerine',
    name: 'Tangerine',
    description: 'Sifat poligenik yang dicapai melalui pembiakan selektif. Tangerine mengacu pada gecko dengan konsentrasi pigmen oranye yang tinggi. Ini bukan gen tunggal melainkan kombinasi dari beberapa gen.',
    genetic_type: 'polygenic',
    traits: ['Warna Oranye', 'Saturnasi Tinggi'],
    price_range: 'Rp 700rb - Rp 3jt+',
    image_url: ''
  },
  {
    id: 'black-night',
    name: 'Black Night',
    description: 'Sifat poligenik yang sangat dicari yang menghasilkan leopard gecko yang hampir sepenuhnya hitam melalui pembiakan selektif selama bertahun-tahun.',
    genetic_type: 'polygenic',
    traits: ['Hitam Pekat', 'Langka', 'Selective Bred'],
    price_range: 'Rp 10jt - Rp 50jt+',
    image_url: ''
  }
];

export const SAMPLE_RELATIONS = [
  { morph_id: 'tremper-albino', related_id: 'eclipse' },
  { morph_id: 'mack-snow', related_id: 'tremper-albino' },
];
