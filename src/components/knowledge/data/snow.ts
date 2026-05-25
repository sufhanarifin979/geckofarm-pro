import { EnhancedMorph } from '../morphDatabase';

export const SNOW_MORPHS: EnhancedMorph[] = [
  {
    id: 'mack-snow',
    name: 'Mack Snow',
    description: 'Genetik yang mengurangi pigmen kuning.',
    visual_description: 'Saat lahir berwarna hitam-putih, saat dewasa warna cenderung putih keabuan atau krem.',
    genetic_type: 'dominant',
    traits: ['Reduced Yellow'],
    compatible_combos: ['Super Snow'],
    rarity_tier: 'Common',
    market_demand: 'Very High',
    difficulty_level: 'Beginner',
    category: 'Snow'
  },
  {
    id: 'tug-snow',
    name: 'TUG Snow',
    description: 'The Urban Gecko Snow, strain snow yang selektif.',
    visual_description: 'Warna putih salju yang bersih tanpa pengaruh kuning yang kuat.',
    genetic_type: 'polygenic',
    traits: ['Pure Snow'],
    compatible_combos: ['Tremper Albino'],
    rarity_tier: 'Uncommon',
    market_demand: 'Moderate',
    difficulty_level: 'Intermediate',
    category: 'Snow'
  },
  {
    id: 'gem-snow',
    name: 'Gem Snow',
    description: 'Salah satu strain snow yang unik dan kontras.',
    visual_description: 'Warna putih dengan bintik hitam yang tajam dan bersih.',
    genetic_type: 'dominant',
    traits: ['High Contrast Snow'],
    compatible_combos: ['Tangerine'],
    rarity_tier: 'Uncommon',
    market_demand: 'Moderate',
    difficulty_level: 'Intermediate',
    category: 'Snow'
  }
];
