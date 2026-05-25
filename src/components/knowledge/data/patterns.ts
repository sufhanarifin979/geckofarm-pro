import { EnhancedMorph } from '../morphDatabase';

export const PATTERN_MORPHS: EnhancedMorph[] = [
  {
    id: 'bold-stripe',
    name: 'Bold Stripe',
    description: 'Pola garis hitam yang sangat tebal di sisi tubuh.',
    visual_description: 'Dua garis hitam tebal di sepanjang punggung dengan bagian tengah yang bersih.',
    genetic_type: 'polygenic',
    traits: ['Bold side stripes'],
    compatible_combos: ['Mack Snow'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Beginner',
    category: 'Pattern'
  },
  {
    id: 'reverse-stripe',
    name: 'Reverse Stripe',
    description: 'Satu garis gelap di sepanjang tulang belakang.',
    visual_description: 'Memiliki garis gelap tunggal di tengah punggung.',
    genetic_type: 'polygenic',
    traits: ['Central Dorsal Stripe'],
    compatible_combos: ['Eclipse'],
    rarity_tier: 'Uncommon',
    market_demand: 'High',
    difficulty_level: 'Beginner',
    category: 'Pattern'
  },
  {
    id: 'cipher',
    name: 'Cipher',
    description: 'Pola yang sangat unik dan kompleks yang baru ditemukan.',
    visual_description: 'Pola bintik yang sangat pecah dan mendetail, seringkali menyerupai kode.',
    genetic_type: 'recessive',
    traits: ['Complex Pixelated Pattern'],
    compatible_combos: ['Albino'],
    rarity_tier: 'Rare',
    market_demand: 'Very High',
    difficulty_level: 'Advanced',
    category: 'Pattern'
  }
];
