/**
 * Popular Google Fonts for manga/comic translation
 * Curated list of the most commonly used fonts
 */

export const POPULAR_GOOGLE_FONTS = [
  // Sans-Serif - Clean & Modern
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Raleway',
  'Poppins',
  'Nunito',
  'Ubuntu',
  'Work Sans',
  'Inter',

  // Comic & Fun
  'Comic Neue',
  'Bangers',
  'Permanent Marker',
  'Fredoka One',
  'Righteous',
  'Bungee',
  'Titan One',

  // Asian Language Support
  'Noto Sans',
  'Noto Sans JP',
  'Noto Sans KR',
  'Noto Sans SC',
  'Noto Sans TC',
  'M PLUS Rounded 1c',
  'M PLUS 1p',
  'Kosugi Maru',
  'Zen Maru Gothic',
  'Sawarabi Gothic',

  // Serif - Classic
  'Merriweather',
  'Playfair Display',
  'Lora',
  'PT Serif',

  // Mono - Technical
  'Roboto Mono',
  'Fira Code',
  'Source Code Pro',
  'JetBrains Mono',

  // Display - Dramatic
  'Bebas Neue',
  'Oswald',
  'Anton',
  'Russo One',
] as const;

export type GoogleFontName = typeof POPULAR_GOOGLE_FONTS[number];
