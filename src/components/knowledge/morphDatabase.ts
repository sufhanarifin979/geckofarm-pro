import { Morph } from '../../types';
import { COMPLETE_MORPH_DATABASE } from './data';

export interface EnhancedMorph extends Morph {
  category: string;
  compatible_combos: string[];
  genetic_issues?: string[];
  rarity_tier: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Holy Grail';
  market_demand: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  visual_description: string;
  image_url?: string;
  breeder_notes?: string;
  searchableKeywords?: string[];
}

export const MORPH_DATABASE: EnhancedMorph[] = COMPLETE_MORPH_DATABASE;
