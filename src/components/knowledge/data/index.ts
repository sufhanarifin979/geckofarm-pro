import { BASE_MORPHS } from './base';
import { ALBINO_MORPHS } from './albino';
import { SNOW_MORPHS } from './snow';
import { LINEBRED_MORPHS } from './linebred';
import { PATTERN_MORPHS } from './patterns';
import { COMPLEX_COMBOS } from './combos';
import { SPECIAL_PROJECTS } from './special';
import { GENETIC_MORPHS } from './genetic';

export const COMPLETE_MORPH_DATABASE = [
  ...BASE_MORPHS,
  ...ALBINO_MORPHS,
  ...SNOW_MORPHS,
  ...LINEBRED_MORPHS,
  ...PATTERN_MORPHS,
  ...GENETIC_MORPHS,
  ...COMPLEX_COMBOS,
  ...SPECIAL_PROJECTS
];
