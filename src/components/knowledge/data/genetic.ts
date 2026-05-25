import { EnhancedMorph } from '../morphDatabase';

export const GENETIC_MORPHS: EnhancedMorph[] = [
  {
    id: 'white-and-yellow',
    name: 'White & Yellow',
    description: 'Genetik yang meningkatkan pigmen putih dan kuning dengan pola yang khas.',
    visual_description: 'Warna putih yang bersih di sisi tubuh dan ekor, seringkali dengan kontras tinggi.',
    genetic_type: 'dominant',
    traits: ['W&Y Effect'],
    compatible_combos: ['Mack Snow'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  },
  {
    id: 'super-white-and-yellow',
    name: 'Super White & Yellow (kontroversial)',
    description: 'Bentuk homozigot dari W&Y yang sering dikaitkan dengan masalah neurologis.',
    visual_description: 'Warna putih yang sangat dominan, namun seringkali memiliki gangguan keseimbangan.',
    genetic_type: 'dominant',
    traits: ['Extreme W&Y'],
    compatible_combos: ['None'],
    rarity_tier: 'Rare',
    market_demand: 'Low',
    difficulty_level: 'Expert',
    category: 'Genetic'
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    description: 'Mutasi yang mempengaruhi pigmen mata dan pola tubuh.',
    visual_description: 'Mata bisa solid hitam/merah (Full Eclipse) atau sebagian (Snake Eyes).',
    genetic_type: 'recessive',
    traits: ['Solid Eyes', 'White Nose', 'White Feet'],
    compatible_combos: ['RAPTOR'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  },
  {
    id: 'murphy-patternless',
    name: 'Murphy Patternless',
    description: 'Genetik yang menghilangkan pola tubuh saat gecko dewasa.',
    visual_description: 'Warna tubuh solid (kuning/krem) tanpa bintik atau garis.',
    genetic_type: 'recessive',
    traits: ['Patternless'],
    compatible_combos: ['Blizzard'],
    rarity_tier: 'Uncommon',
    market_demand: 'Moderate',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    description: 'Menghilangkan semua pola dan bintik sejak gecko lahir.',
    visual_description: 'Warna solid (putih, abu-abu, atau keunguan) tanpa corak sama sekali.',
    genetic_type: 'recessive',
    traits: ['No Pattern'],
    compatible_combos: ['Diablo Blanco'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  },
  {
    id: 'giant',
    name: 'Giant',
    description: 'Mutasi yang mempengaruhi ukuran tubuh menjadi lebih besar.',
    visual_description: 'Ukuran tubuh yang mencapai batas maksimal leopard gecko normal dengan cepat.',
    genetic_type: 'dominant',
    traits: ['Large Size'],
    compatible_combos: ['Super Giant'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  },
  {
    id: 'super-giant',
    name: 'Super Giant',
    description: 'Bentuk homozigot dari Giant, ukuran gecko bisa mencapai 100-150 gram.',
    visual_description: 'Tubuh yang sangat besar dan panjang di atas rata-rata.',
    genetic_type: 'dominant',
    traits: ['Extra Large Size'],
    compatible_combos: ['Giant'],
    rarity_tier: 'Rare',
    market_demand: 'High',
    difficulty_level: 'Intermediate',
    category: 'Genetic'
  }
];
