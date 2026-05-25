export type Inheritance = 'recessive' | 'dominant' | 'codominant' | 'line-bred' | 'polygenic' | 'controversial' | 'special';

export interface GeneDefinition {
  id: string;
  name: string;
  type: Inheritance;
  group?: string; // e.g., 'albino'
  super_form?: string;
  isSpecial?: boolean;
  warning?: string;
}

export const CORE_GENES: Record<string, GeneDefinition> = {
  'tremper-albino': { id: 'tremper-albino', name: 'Tremper Albino', type: 'recessive', group: 'albino' },
  'bell-albino': { id: 'bell-albino', name: 'Bell Albino', type: 'recessive', group: 'albino' },
  'rainwater-albino': { id: 'rainwater-albino', name: 'Rainwater Albino', type: 'recessive', group: 'albino' },
  'eclipse': { id: 'eclipse', name: 'Eclipse', type: 'recessive' },
  'blizzard': { id: 'blizzard', name: 'Blizzard', type: 'recessive' },
  'murphy-patternless': { id: 'murphy-patternless', name: 'Murphy Patternless', type: 'recessive' },
  'mack-snow': { id: 'mack-snow', name: 'Mack Snow', type: 'codominant', super_form: 'super-snow' },
  'super-snow': { id: 'super-snow', name: 'Super Snow', type: 'special' },
  'tug-snow': { id: 'tug-snow', name: 'TUG Snow', type: 'dominant' },
  'white-yellow': { id: 'white-yellow', name: 'White & Yellow', type: 'special', isSpecial: true, warning: 'W&Y Syndrome Risk' },
  'enigma': { id: 'enigma', name: 'Enigma', type: 'special', isSpecial: true, warning: 'Enigma Syndrome Risk' },
  'giant': { id: 'giant', name: 'Giant', type: 'codominant', super_form: 'super-giant' },
  'super-giant': { id: 'super-giant', name: 'Super Giant', type: 'special' },
  'lemon-frost': { id: 'lemon-frost', name: 'Lemon Frost', type: 'special', isSpecial: true, warning: 'Fatal Cancer Risk (Iridophoroma)' },
};

export const SPECIAL_GENES: Record<string, GeneDefinition> = {
  'w-y-syndrome': { id: 'w-y-syndrome', name: 'W&Y Syndrome', type: 'special', warning: 'Neurological Issues' },
};

export interface TraitDefinition {
  name: string;
  description: string;
  type: Inheritance;
}

export const VISUAL_TRAITS: Record<string, TraitDefinition> = {
  'tangerine': { name: 'Tangerine', description: 'Orange basic pigment', type: 'line-bred' },
  'hypo': { name: 'Hypo', description: 'Reduced body spotting', type: 'line-bred' },
  'shtct': { name: 'SHTCT', description: 'Super Hypo Tangerine Carrot Tail', type: 'line-bred' },
  'mandarin': { name: 'Mandarin', description: 'High-end orange line', type: 'line-bred' },
  'sht': { name: 'SHT', description: 'Super Hypo Tangerine', type: 'line-bred' },
  'shtctb': { name: 'SHTCTB', description: 'SHTCT with Baldy', type: 'line-bred' },
  'lavender': { name: 'Lavender', description: 'Purplish pigment hue', type: 'line-bred' },
  'black-night': { name: 'Black Night', description: 'Melanistic lineage', type: 'line-bred' },
  'emerine': { name: 'Emerine', description: 'Greenish tangerine', type: 'line-bred' },
  'blood': { name: 'Blood', description: 'Intense red tangerine', type: 'line-bred' },
  'inferno': { name: 'Inferno', description: 'High-end tangerine', type: 'line-bred' },
  'firebold': { name: 'Firebold', description: 'High intensity line-bred', type: 'line-bred' },
  'electric': { name: 'Electric', description: 'Neon orange tangerine', type: 'line-bred' },
  'atomic': { name: 'Atomic', description: 'High-end tangerine line', type: 'line-bred' },
  'tangerine-tornado': { name: 'Tangerine Tornado', description: 'Deep orange lineage', type: 'line-bred' },
  'tangelo': { name: 'Tangelo', description: 'High-end orange phenotype', type: 'line-bred' },
  'sunset': { name: 'Sunset', description: 'Intense orange/red', type: 'line-bred' },
  'sunspot': { name: 'Sunspot', description: 'Orange with spots', type: 'line-bred' },
  'blood-emerine': { name: 'Blood Emerine', description: 'Combo of Blood and Emerine lines', type: 'line-bred' },
  'lime': { name: 'Lime', description: 'Greenish hue line', type: 'line-bred' },
  'neon': { name: 'Neon', description: 'Bright glowing colors', type: 'line-bred' },
  'melanistic': { name: 'Melanistic', description: 'High black pigment', type: 'line-bred' },
  'abyssinian': { name: 'Abyssinian', description: 'Speckled pattern variant', type: 'line-bred' },
  'halloween': { name: 'Halloween', description: 'High contrast head pattern', type: 'line-bred' },
  'rainbow-stripe': { name: 'Rainbow Stripe', description: 'Gradated colored stripes', type: 'line-bred' },
  'carrot-tail': { name: 'Carrot Tail', description: 'Orange at base of tail', type: 'line-bred' },
  'baldy': { name: 'Baldy', description: 'Zero head spots', type: 'line-bred' },
};

export const PATTERN_TRAITS: Record<string, TraitDefinition> = {
  'bold-stripe': { name: 'Bold Stripe', description: 'Strong, thick dorsal stripes', type: 'line-bred' },
  'red-stripe': { name: 'Red Stripe', description: 'Line-bred red dorsal stripes', type: 'line-bred' },
  'reverse-stripe': { name: 'Reverse Stripe', description: 'Stripe on tail and center back', type: 'line-bred' },
  'patternless-stripe': { name: 'Patternless Stripe', description: 'Clean center stripe between two lines', type: 'line-bred' },
  'jungle': { name: 'Jungle', description: 'Broken body bands', type: 'line-bred' },
  'aberrant': { name: 'Aberrant', description: 'Broken body pattern', type: 'line-bred' },
  'bandit': { name: 'Bandit', description: 'Nose band pattern', type: 'line-bred' },
};

export const ALL_GENES = { ...CORE_GENES, ...SPECIAL_GENES };

export interface COMBO_ENTRY {
  genes: string[];
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Holy Grail';
}

export const COMBO_MAPPING: COMBO_ENTRY[] = [
  { genes: ['tremper-albino', 'eclipse', 'patternless-stripe'], name: 'RAPTOR', rarity: 'Rare' },
  { genes: ['bell-albino', 'eclipse', 'patternless-stripe'], name: 'RADAR', rarity: 'Rare' },
  { genes: ['rainwater-albino', 'eclipse', 'patternless-stripe'], name: 'Typhoon', rarity: 'Rare' },
  { genes: ['tremper-albino', 'patternless-stripe'], name: 'APTOR', rarity: 'Uncommon' },
  { genes: ['mack-snow', 'tremper-albino', 'eclipse', 'patternless-stripe'], name: 'Mack Snow RAPTOR', rarity: 'Rare' },
  { genes: ['mack-snow', 'bell-albino', 'eclipse', 'patternless-stripe'], name: 'Mack Snow RADAR', rarity: 'Rare' },
  { genes: ['tremper-albino', 'blizzard', 'eclipse'], name: 'Diablo Blanco', rarity: 'Legendary' },
  { genes: ['bell-albino', 'blizzard', 'eclipse'], name: 'White Knight', rarity: 'Legendary' },
  { genes: ['tremper-albino', 'murphy-patternless', 'eclipse'], name: 'Ember', rarity: 'Rare' },
  { genes: ['bell-albino', 'murphy-patternless', 'eclipse'], name: 'Predator', rarity: 'Rare' },
  { genes: ['mack-snow', 'tremper-albino', 'murphy-patternless', 'eclipse'], name: 'Snowflake', rarity: 'Legendary' },
  { genes: ['super-snow', 'tremper-albino', 'murphy-patternless', 'eclipse'], name: 'Super Snowflake', rarity: 'Holy Grail' },
  { genes: ['mack-snow', 'tremper-albino', 'blizzard', 'eclipse'], name: 'Mack Snow Diablo Blanco', rarity: 'Legendary' },
  { genes: ['super-snow', 'tremper-albino', 'blizzard', 'eclipse'], name: 'Super Diablo Blanco', rarity: 'Holy Grail' },
  { genes: ['super-snow', 'bell-albino', 'blizzard', 'eclipse'], name: 'Super White Knight', rarity: 'Holy Grail' },
];

export interface GeneticState {
  visual: string[];
  hets: string[];
  visualTraits: string[];
  patternTraits: string[];
  traitLevels?: Record<string, string>;
}

export interface PredictionResult {
  name: string; // Display Name (Combined)
  primaryName: string; // e.g., RAPTOR
  traitProfile: string[]; // e.g., ['Reverse Stripe influence', 'High Tangerine saturation']
  probability: number;
  visualGenes: string[];
  visualTraits: string[];
  patternTraits: string[];
  traitLevels?: Record<string, string>;
  hets: string[];
  posHets?: { geneId: string; prob: number }[];
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary' | 'Holy Grail';
  isWarning?: boolean;
  warningMessage?: string;
  expectedValue: 'Standard' | 'Premium' | 'High-End' | 'Investment Grade';
  breedingValue: number;
  projectLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  projectDifficulty: 'Low' | 'Moderate' | 'Challenging' | 'Expert';
  desirability: number;
  breederDemand: 'Low' | 'Moderate' | 'High' | 'Extreme';
  isBreedingTarget?: boolean;
  futureProjects?: string[];
  breederInsight?: string;
  confidenceMetrics: {
    visualProjection: number;
    geneticAccuracy: number;
  };
  visualPrediction?: {
    intensity: string;
    pattern: string;
    contrast: string;
    spotting: string;
    saturation: string;
    melanistic: string;
    eyeAppearance: string;
  };
}

export function calculatePairing(parentA: GeneticState, parentB: GeneticState): PredictionResult[] {
  const genesInvolved = Array.from(new Set([
    ...parentA.visual, ...parentA.hets,
    ...parentB.visual, ...parentB.hets
  ])).filter(id => ALL_GENES[id]);

  if (genesInvolved.length === 0 && 
      parentA.visualTraits.length === 0 && parentB.visualTraits.length === 0 &&
      parentA.patternTraits.length === 0 && parentB.patternTraits.length === 0) {
    return [{
      name: 'Normal (Wild Type)',
      primaryName: 'Normal',
      traitProfile: ['Standard wild-type expression'],
      probability: 100,
      visualGenes: [],
      visualTraits: [],
      patternTraits: [],
      traitLevels: {},
      hets: [],
      rarity: 'Common',
      expectedValue: 'Standard',
      breedingValue: 10,
      projectLevel: 'Beginner',
      projectDifficulty: 'Low',
      desirability: 20,
      breederDemand: 'Moderate',
      breederInsight: "Awal yang ideal bagi breeder pemula. Fokus pada stabilitas silsilah dan konsistensi penentuan jenis kelamin berbasis suhu (TSD) yang stabil.",
      confidenceMetrics: { visualProjection: 95, geneticAccuracy: 99 },
      visualPrediction: generateVisualPrediction([], [])
    }];
  }

  // Cross-Strain Albino Check
  const getAlbino = (p: GeneticState) => p.visual.find(t => ALL_GENES[t]?.group === 'albino') || p.hets.find(t => ALL_GENES[t]?.group === 'albino');
  const albA = getAlbino(parentA);
  const albB = getAlbino(parentB);

  // Cross-strain warning if parents carry different albino strains
  const hasAlbinoConflict = albA && albB && albA !== albB;

  let outcomes: Map<string, { prob: number, visual: string[], hets: string[], posHets: {geneId: string, prob: number}[] }> = new Map();
  outcomes.set('', { prob: 1, visual: [], hets: [], posHets: [] });

  genesInvolved.forEach(geneId => {
    const gene = ALL_GENES[geneId];
    const newOutcomes: Map<string, { prob: number, visual: string[], hets: string[], posHets: {geneId: string, prob: number}[] }> = new Map();
    
    const stateA = parentA.visual.includes(geneId) ? 2 : (parentA.hets.includes(geneId) ? 1 : 0);
    const stateB = parentB.visual.includes(geneId) ? 2 : (parentB.hets.includes(geneId) ? 1 : 0);

    const geneResults = calculateSingleLocus(gene, stateA, stateB);

    outcomes.forEach((prev) => {
      geneResults.forEach(res => {
        const combinedVisual = Array.from(new Set([...prev.visual, ...res.visual])).sort();
        const combinedHets = Array.from(new Set([...prev.hets, ...res.hets])).filter(h => !combinedVisual.includes(h)).sort();
        
        let combinedPosHets = [...prev.posHets];
        if (res.isPosHet && !combinedVisual.includes(geneId)) {
          combinedPosHets.push({ geneId, prob: res.prob });
        }
        // Filter out pos hets that became visual or guaranteed het
        combinedPosHets = combinedPosHets.filter(p => !combinedVisual.includes(p.geneId) && !combinedHets.includes(p.geneId));

        const combinedKey = `${combinedVisual.join(',')}|${combinedHets.join(',')}|${combinedPosHets.map(p => `${p.geneId}:${p.prob}`).join(',')}`;
        const existing = newOutcomes.get(combinedKey);
        const newProb = prev.prob * (res.prob / 100);
        
        if (existing) {
          existing.prob += newProb;
        } else {
          newOutcomes.set(combinedKey, { prob: newProb, visual: combinedVisual, hets: combinedHets, posHets: combinedPosHets });
        }
      });
    });
    outcomes = newOutcomes;
  });

  const visualTraitsToPass = combineTraits(parentA.visualTraits, parentB.visualTraits);
  const patternTraitsToPass = combineTraits(parentA.patternTraits, parentB.patternTraits);
  
  const traitLevelsToPass: Record<string, string> = {};
  [...visualTraitsToPass, ...patternTraitsToPass].forEach(id => {
    const level = combineLevels(id, parentA.traitLevels?.[id], parentB.traitLevels?.[id]);
    if (level) traitLevelsToPass[id] = level;
  });

  const result: PredictionResult[] = [];
  outcomes.forEach((val) => {
    if (val.prob > 0) {
      const recognized = recognizeCombo(val.visual, [...visualTraitsToPass, ...patternTraitsToPass]);
      const warnings = checkHealth(val.visual);
      const prob = Math.round(val.prob * 100 * 100) / 100;
      
      const traitProfile = generateTraitProfile(val.visual, visualTraitsToPass, patternTraitsToPass, traitLevelsToPass, recognized.matchedGenes);
      const breedingValue = calculateBreedingValue(val.visual, val.hets, recognized.rarity);
      const desirability = calculateDesirability(recognized.name, recognized.rarity);
      const difficulty: any = recognized.rarity === 'Legendary' || recognized.rarity === 'Holy Grail' ? 'Expert' : (recognized.rarity === 'Rare' ? 'Challenging' : 'Moderate');
      
      const targets = identifyBreedingTargets(val.visual, val.hets);
      
      const resultObj: PredictionResult = {
        name: recognized.name || 'Normal',
        primaryName: recognized.primaryName,
        traitProfile,
        probability: prob,
        visualGenes: val.visual,
        visualTraits: visualTraitsToPass,
        patternTraits: patternTraitsToPass,
        traitLevels: traitLevelsToPass,
        hets: val.hets,
        posHets: val.posHets,
        rarity: recognized.rarity,
        expectedValue: determineValue(val.visual, [...visualTraitsToPass, ...patternTraitsToPass]) as any,
        breedingValue,
        projectLevel: determineProjectLevel(recognized.rarity, val.visual.length),
        projectDifficulty: difficulty,
        desirability,
        breederDemand: desirability > 80 ? 'Extreme' : (desirability > 60 ? 'High' : 'Moderate'),
        isBreedingTarget: breedingValue > 85,
        futureProjects: targets,
        confidenceMetrics: {
          visualProjection: Math.max(30, 100 - (val.visual.length * 5) - (visualTraitsToPass.length * 8)),
          geneticAccuracy: Math.max(40, 100 - (val.posHets.length * 10))
        },
        visualPrediction: generateVisualPrediction(visualTraitsToPass, patternTraitsToPass, traitLevelsToPass, val.visual),
        isWarning: warnings.isWarning || hasAlbinoConflict,
        warningMessage: hasAlbinoConflict ? `⚠️ Mixed Albino Strain: Persilangan ${ALL_GENES[albA || ""].name} x ${ALL_GENES[albB || ""].name} menghasilkan anakan normal yang membawa gen albino berbeda.` : warnings.warningMessage,
      };

      resultObj.breederInsight = generateBreederInsight(resultObj);

      result.push(resultObj);
    }
  });

  return result.sort((a, b) => b.probability - a.probability);
}

function determineProjectLevel(rarity: string, geneCount: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional' {
  if (rarity === 'Holy Grail' || geneCount >= 5) return 'Professional';
  if (rarity === 'Legendary' || geneCount >= 3) return 'Advanced';
  if (rarity === 'Rare' || geneCount >= 2) return 'Intermediate';
  return 'Beginner';
}

function generateTraitProfile(visualGenes: string[], visualTraits: string[], patternTraits: string[], traitLevels: Record<string, string>, matchedGenes: string[]): string[] {
  const profile: string[] = [];
  
  visualGenes.forEach(id => {
    if (!matchedGenes.includes(id)) {
      profile.push(`${ALL_GENES[id]?.name} influence`);
    }
  });

  visualTraits.forEach(id => {
    const level = traitLevels[id] ? `${traitLevels[id]} ` : '';
    profile.push(`${level}${VISUAL_TRAITS[id]?.name} expression`);
  });

  patternTraits.forEach(id => {
    profile.push(`${PATTERN_TRAITS[id]?.name} tendency`);
  });

  return profile;
}

export function generateBreederInsight(result: PredictionResult): string {
  const { visualGenes, visualTraits, patternTraits, rarity, hets } = result;
  
  const hasAlbino = visualGenes.some(v => ALL_GENES[v]?.group === 'albino');
  const hasEclipse = visualGenes.includes('eclipse');
  const hasSnow = visualGenes.includes('mack-snow') || visualGenes.includes('super-snow');
  const hasEnigma = visualGenes.includes('enigma');
  const hasWY = visualGenes.includes('white-yellow');
  const hasTangerine = visualTraits.some(t => ['tangerine', 'mandarin', 'inferno', 'blood'].includes(t));
  const hasBlackNight = visualTraits.includes('black-night');
  const hasGreen = visualTraits.some(t => ['emerine', 'blood-emerine', 'lime'].includes(t));
  
  const isComplex = visualGenes.length >= 3 || hasTangerine || hasBlackNight;
  const hasNeurological = hasEnigma || hasWY;

  const openers = [
    "Dari perspektif elit breeder,",
    "Berdasarkan analisis arsitektur genetik ini,",
    "Hasil pairing ini menunjukkan bahwa",
    "Dalam pasar gecko premium,",
    "Secara teknis,"
  ];

  const insightPools = [
    {
      condition: hasAlbino && hasEclipse,
      phrases: [
        "interaksi antara Albino dan Eclipse memberikan potensi visual mata yang sangat 'eye-catching' untuk pasar display.",
        "purity albino strain sangat krusial; pastikan tidak ada kontaminasi silang untuk menjaga kejernihan ruby-eye hasil akhirnya.",
        "kombinasi ini adalah fondasi sempurna untuk proyek spesialis bermata solid."
      ]
    },
    {
      condition: hasSnow && (hasTangerine || hasBlackNight),
      phrases: [
        "pengaruh Mack Snow akan bertindak sebagai penetral, memberikan kontras 'pastel' yang sangat elegan pada garis keturunan berwarna kuat.",
        "kombinasi Snow dan Tangerine adalah jalur klasik untuk mendapatkan High-End Creame/Tangelo look.",
        "faktor Snow di sini memberikan kejernihan visual yang akan memisahkan proyek Anda dari kompetisi standar."
      ]
    },
    {
      condition: isComplex,
      phrases: [
        "kompleksitas multi-lokus ini menuntut seleksi yang sangat disiplin di fase F1 untuk mempertahankan arah proyek.",
        "ini adalah 'genetic powerhouse'; setiap anakan akan menjadi subjek studi yang menarik bagi kolektor genetik tinggi.",
        "mengelola tumpukan alel ini membutuhkan pemahaman mendalam tentang ekspresivitas visual pada tiap individu."
      ]
    },
    {
      condition: hasTangerine && hasBlackNight,
      phrases: [
        "persilangan Tangerine dan Black Night adalah 'frontier' baru untuk mendapatkan 'Dark Mandarin'—sangat dicari oleh kolektor elit.",
        "keseimbangan antara pigmen orange dan melanistik harus dijaga melalui seleksi holdback yang ketat.",
        "saturasi warna yang dihasilkan akan memiliki kedalaman yang luar biasa unik."
      ]
    },
    {
      condition: hasNeurological,
      phrases: [
        "aspek kesejahteraan harus menjadi prioritas utama; seleksi hanya individu dengan stabilitas motorik sempurna.",
        "kewaspadaan breeder tingkat tinggi disarankan untuk menjaga integritas garis keturunan ini.",
        "stabilitas lineage adalah kunci untuk mempertahankan nilai komersial dari proyek berisiko tinggi ini."
      ]
    },
    {
      condition: rarity === 'Legendary' || rarity === 'Holy Grail',
      phrases: [
        "ini adalah material 'investment grade'. Fokuslah pada dokumentasi lineage yang sempurna untuk memaksimalkan nilainya.",
        "kelangkaan tumpukan genetik ini memberi Anda keunggulan kompetitif yang sangat besar di pasar internasional.",
        "hewan dengan kaliber ini adalah 'game changer' bagi program pembiakan profesional manapun."
      ]
    },
    {
      condition: hets.length >= 3,
      phrases: [
        "kandungan 'hidden genetics' yang masif membuat individu ini sangat fleksibel untuk berbagai jalur ekspansi proyek.",
        "profil pembawa (het) ini adalah kunci untuk membuka pintu ke kombinasi visual yang jauh lebih langka di generasi berikutnya.",
        "menggunakan outcross visual yang tepat akan mengungkap potensi sejati dari tumpukan genetik tersembunyi ini."
      ]
    },
    {
      condition: hasGreen && hasTangerine,
      phrases: [
        "fokuslah pada 'Neon Glow' yang dihasilkan dari perpaduan rona Emerald dan saturasi Tangerine.",
        "mempertahankan spektrum hijau membutuhkan tekanan selektif yang konsisten di tiap generasi.",
        "interaksi ini memberikan nilai estetika 'Designer' yang sangat kuat."
      ]
    }
  ];

  const relevantPhrases = insightPools.filter(p => p.condition).flatMap(p => p.phrases);
  
  if (relevantPhrases.length === 0) {
    return openers[Math.floor(Math.random() * openers.length)] + " pairing ini menjaga stabilitas fenotip yang sangat baik untuk pengembangan koloni dasar. Strategi yang solid untuk membangun fondasi yang kuat.";
  }

  const shuffled = relevantPhrases.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(relevantPhrases.length, 3));
  
  const opener = openers[Math.floor(Math.random() * openers.length)];
  const transitions = [". Selain itu, ", ". Menariknya, ", ". Dari sisi strategis, ", ". Di sisi lain, ", ". Secara visual, "];
  
  let resultText = opener + " " + selected[0];
  for (let i = 1; i < selected.length; i++) {
    resultText += transitions[Math.floor(Math.random() * transitions.length)] + selected[i];
  }
  
  return resultText + ".";
}

function generateVisualPrediction(traits: string[], patterns: string[], levels: Record<string, string> = {}, visuals: string[] = []) {
  const hasOrange = traits.some(t => ['tangerine', 'blood', 'inferno'].includes(t));
  const hasMelanistic = traits.includes('black-night');
  const hasWY = visuals.includes('white-yellow');
  const hasEclipse = visuals.includes('eclipse');
  const hasAlbino = visuals.some(v => ALL_GENES[v]?.group === 'albino');

  return {
    intensity: hasOrange ? 'Pemuatan Pigmen Ditingkatkan' : 'Nada Alami Standar',
    pattern: patterns.includes('bold-stripe') ? 'Stripe Definisi Tinggi' : (patterns.includes('jungle') ? 'Asimetris Distruptif' : 'Spotting Simetris'),
    contrast: hasMelanistic || hasWY ? 'Kontras Rentang Tinggi' : 'Nada Menengah Seimbang',
    spotting: traits.includes('hypo') || traits.includes('super-hypo') ? 'Reduksi Spotting Halus' : 'Densitas Spotting Alami',
    saturation: hasOrange ? 'Kehangatan Orange Mendalam' : 'Pigmentasi Netral',
    melanistic: hasMelanistic ? 'Pengaruh Karbon Padat' : 'Nada Melanistik Rendah',
    eyeAppearance: hasEclipse ? (hasAlbino ? 'Ruby/Solid Red' : 'Solid Black/Snake Eye') : 'Iris Berurat Standar'
  };
}

function recognizeCombo(visualGenes: string[], visualTraits: string[] = []): { name: string, primaryName: string, rarity: COMBO_ENTRY['rarity'], matchedGenes: string[] } {
  const allVisuals = [...visualGenes, ...visualTraits];
  const sortedCombos = [...COMBO_MAPPING].sort((a, b) => b.genes.length - a.genes.length);
  
  for (const combo of sortedCombos) {
    if (combo.genes.every(g => allVisuals.includes(g))) {
      const remainingGenes = visualGenes.filter(g => !combo.genes.includes(g));
      let name = combo.name;
      if (remainingGenes.length > 0) {
        const extraNames = remainingGenes.map(g => ALL_GENES[g]?.name).filter(Boolean).join(' ');
        name = `${extraNames} ${name}`;
      }
      return { name, primaryName: combo.name, rarity: combo.rarity, matchedGenes: combo.genes };
    }
  }

  if (visualGenes.length === 0) return { name: 'Normal', primaryName: 'Normal', rarity: 'Common', matchedGenes: [] };
  
  const baseName = visualGenes.map(g => ALL_GENES[g]?.name).filter(Boolean).join(' ');
  const primaryName = visualGenes.length > 0 ? ALL_GENES[visualGenes[0]]?.name : 'Normal';
  
  return { 
    name: baseName || 'Normal', 
    primaryName: primaryName || 'Normal',
    rarity: determineBaseRarity(visualGenes),
    matchedGenes: []
  };
}

function determineBaseRarity(genes: string[]): COMBO_ENTRY['rarity'] {
  if (genes.length >= 4) return 'Legendary';
  if (genes.length >= 2) return 'Rare';
  if (genes.length >= 1) return 'Uncommon';
  return 'Common';
}

function determineValue(genes: string[], traits: string[]): 'Standard' | 'Premium' | 'High-End' {
  const score = genes.length + (traits.length * 0.5);
  if (score >= 4) return 'High-End';
  if (score >= 2) return 'Premium';
  return 'Standard';
}

function checkHealth(traits: string[]) {
  const warnings = traits.map(t => ALL_GENES[t]?.warning).filter(Boolean);
  if (warnings.length > 0) {
    return { 
      isWarning: true, 
      warningMessage: warnings.join(' | ') 
    };
  }
  return {};
}

function calculateSingleLocus(gene: GeneDefinition, stateA: number, stateB: number) {
  const results: { prob: number, visual: string[], hets: string[], isPosHet?: boolean }[] = [];
  const pA = stateA === 2 ? ['g', 'g'] : (stateA === 1 ? ['g', 'n'] : ['n', 'n']);
  const pB = stateB === 2 ? ['g', 'g'] : (stateB === 1 ? ['g', 'n'] : ['n', 'n']);
  const table: Record<string, number> = {};
  
  for (const a of pA) {
    for (const b of pB) {
      const k = [a, b].sort().join('');
      table[k] = (table[k] || 0) + 1;
    }
  }

  Object.entries(table).forEach(([k, c]) => {
    const prob = (c / 4) * 100;
    if (gene.type === 'recessive') {
      if (k === 'gg') {
        results.push({ prob, visual: [gene.id], hets: [] });
      } else if (k === 'gn') {
        const isGuaranteedHet = (stateA === 2 && stateB === 0) || (stateA === 0 && stateB === 2);
        results.push({ prob, visual: [], hets: isGuaranteedHet ? [gene.id] : [], isPosHet: !isGuaranteedHet });
      } else {
        results.push({ prob, visual: [], hets: [] });
      }
    } else {
      const isVisual = k === 'gg' || k === 'gn';
      const isSuper = k === 'gg';
      results.push({ 
        prob, 
        visual: isSuper ? [(gene.super_form || gene.id)] : (isVisual ? [gene.id] : []), 
        hets: [] 
      });
    }
  });
  return results;
}

function calculateBreedingValue(visuals: string[], hets: string[], rarity: string) {
  let score = 20;
  if (rarity === 'Uncommon') score += 20;
  if (rarity === 'Rare') score += 40;
  if (rarity === 'Legendary') score += 60;
  if (rarity === 'Holy Grail') score += 75;
  score += (visuals.length * 5) + (hets.length * 3);
  return Math.min(100, score);
}

function calculateDesirability(name: string, rarity: string) {
  let score = 30;
  if (rarity === 'Rare') score += 30;
  if (rarity === 'Legendary') score += 50;
  if (name.includes('Black Night') || name.includes('RAPTOR')) score += 20;
  return Math.min(100, score);
}

function identifyBreedingTargets(visuals: string[], hets: string[]) {
  const targets = [];
  const allKnown = [...visuals, ...hets];
  if (allKnown.includes('tremper-albino') && allKnown.includes('eclipse')) targets.push('RAPTOR', 'Super Snow RAPTOR');
  if (allKnown.includes('bell-albino') && allKnown.includes('eclipse')) targets.push('RADAR');
  if (allKnown.includes('blizzard') && allKnown.includes('eclipse')) targets.push('White Knight');
  if (allKnown.includes('mack-snow') && allKnown.includes('black-night')) targets.push('Snow Night Project');
  return targets.slice(0, 3);
}

function combineTraits(a: string[], b: string[]) {
  return Array.from(new Set([...a, ...b]));
}

function combineLevels(id: string, a: string | undefined, b: string | undefined): string | undefined {
  if (!a && !b) return undefined;
  if (a && !b) return a;
  if (!a && b) return b;
  const levels = ['Low', 'Medium', 'High', 'Extreme'];
  const idxA = levels.indexOf(a!);
  const idxB = levels.indexOf(b!);
  return levels[Math.floor((idxA + idxB) / 2)];
}
