import { EnhancedMorph } from '../morphDatabase';

export const ALBINO_MORPHS: EnhancedMorph[] = [
  {
    id: 'tremper-albino',
    name: 'Tremper Albino',
    description: 'Strain albino pertama yang ditemukan oleh Ron Tremper pada tahun 1996. Merupakan pondasi dari banyak combo morph populer.',
    visual_description: 'Memiliki warna dasar kuning hingga oranye dengan corak bintik coklat muda atau merah gelap. Mata biasanya berwarna perak dengan urat merah yang terlihat jelas.',
    genetic_type: 'recessive',
    traits: ['Albino', 'Light Pigment', 'Silver Eyes'],
    compatible_combos: ['RAPTOR', 'Sunglow', 'Diablo Blanco', 'APTOR'],
    rarity_tier: 'Common',
    market_demand: 'High',
    difficulty_level: 'Beginner',
    category: 'Albino',
    image_url: 'https://images.unsplash.com/photo-1545280703-90924be20300?q=80&w=800&auto=format&fit=crop',
    breeder_notes: 'Strain albino yang paling stabil dan memiliki kompatibilitas luas dengan line-bred Tangerine.'
  },
  {
    id: 'bell-albino',
    name: 'Bell Albino',
    description: 'Ditemukan oleh Mark Bell, merupakan strain albino paling baru dan paling diminati untuk project warna pekat.',
    visual_description: 'Cenderung memiliki bintik kecil berwarna coklat gelap (lavender) yang kontras di atas dasar kuning oranye. Mata adalah ciri khas utamanya, yaitu berwarna pink kemerahan yang pekat.',
    genetic_type: 'recessive',
    traits: ['Albino', 'Ruby Eyes', 'High Contrast'],
    compatible_combos: ['RADAR', 'Aurora', 'Stealth', 'White Knight'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Beginner',
    category: 'Albino',
    image_url: 'https://images.unsplash.com/photo-1549488344-1f9b8d234a9b?q=80&w=800&auto=format&fit=crop',
    breeder_notes: 'Strain Bell tidak kompatibel dengan Tremper atau Rainwater. Menghasilkan visual yang paling "bold" saat dikombinasikan dengan Enigma.'
  },
  {
    id: 'rainwater-albino',
    name: 'Rainwater Albino',
    description: 'Juga dikenal sebagai Las Vegas Albino, ditemukan oleh Tim Rainwater pada tahun 1998.',
    visual_description: 'Memiliki warna yang lebih pucat dan lembut (soft/pastel). Bintik biasanya lebih sedikit dan berwarna kuning kecokelatan. Mata adalah yang paling gelap di antara semua strain albino.',
    genetic_type: 'recessive',
    traits: ['Albino', 'Soft Pattern', 'Dark Eyes'],
    compatible_combos: ['Typhoon', 'Firewater'],
    rarity_tier: 'Uncommon',
    market_demand: 'Moderate',
    difficulty_level: 'Beginner',
    category: 'Albino',
    image_url: 'https://images.unsplash.com/photo-1510339847124-762295963286?q=80&w=800&auto=format&fit=crop',
    breeder_notes: 'Rainwater seringkali disalahpahami sebagai Murphy Patternless karena kebersihannya. Bagus untuk project "Firewater" (Rainwater x Tangerine).'
  }
];
