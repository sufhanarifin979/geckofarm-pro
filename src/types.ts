export interface Gecko {
  id?: string;
  name: string;
  morph: string;
  birthDate: string;
  project: string;
  sireId: string;
  damId: string;
  sireName: string;
  damName: string;
  gender: 'male' | 'female' | 'unsex';
  status: 'available' | 'keep' | 'sold' | 'dead';
  info: string;
  note: string;
  photoUrl: string;
  ownerId: string;
  albinoStrain?: 'None' | 'Tremper' | 'Bell' | 'Rainwater';
  weight?: number;
  createdAt?: any;
}

export interface Pairing {
  id?: string;
  sireId: string;
  damId: string;
  sireName?: string;
  damName?: string;
  pairingDate: string;
  ownerId: string;
  clutchCount: number;
  subscription?: string;
}

export interface Clutch {
  id?: string;
  pairingId: string;
  clutchNumber: number;
  layDate: string;
  hatchDate?: string;
  eggCount: number;
  hatchedCount: number;
  failedCount?: number;
  ownerId: string;
  incubator?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  farmName: string;
  farmPhotoUrl: string;
  subscription: 'free' | 'premium';
  geckoCount: number;
  pairingCount: number;
  clutchCount: number;
  planLimit: number;
}

export interface WeightLog {
  id?: string;
  weight: number;
  date: string;
  note: string;
}

export interface ActivityLog {
  id?: string;
  type: 'feeding' | 'shedding' | 'health' | 'note';
  date: string;
  description: string;
}

export interface Morph {
  id?: string;
  name: string;
  description: string;
  genetic_type: 'dominant' | 'recessive' | 'polygenic';
  traits: string[];
  price_range?: string;
  image_url?: string;
}

export interface MorphRelation {
  id?: string;
  morph_id: string;
  related_id: string;
}
