import type { IconName } from '../icons';
import type { LinkCategory } from '../types';

export interface LinkCategoryMeta {
  id: LinkCategory;
  label: string;
  icon: IconName;
  color: string;
  hint: string;
}

export const LINK_CATEGORIES: LinkCategoryMeta[] = [
  { id: 'video', label: 'Video', icon: 'movie', color: '#EF4444', hint: 'YouTube, Vimeo, Twitch…' },
  { id: 'article', label: 'Article', icon: 'article', color: '#3B82F6', hint: 'News, blogs, docs…' },
  { id: 'music', label: 'Music', icon: 'music-note', color: '#A855F7', hint: 'Spotify, SoundCloud…' },
  { id: 'social', label: 'Social', icon: 'people', color: '#06B6D4', hint: 'X, Instagram, Reddit…' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-cart', color: '#F59E0B', hint: 'Amazon, Etsy…' },
  { id: 'code', label: 'Code', icon: 'code', color: '#10B981', hint: 'GitHub, Stack Overflow…' },
  { id: 'study', label: 'Study', icon: 'school', color: '#6366F1', hint: 'Courses, Wikipedia…' },
  { id: 'tools', label: 'Tools', icon: 'build', color: '#F97316', hint: 'Notion, Figma, Canva…' },
  { id: 'image', label: 'Image', icon: 'image', color: '#14B8A6', hint: 'Pinterest, Unsplash…' },
  { id: 'other', label: 'Other', icon: 'link', color: '#94A3B8', hint: 'Anything else' },
];

export function categoryMeta(id: LinkCategory): LinkCategoryMeta {
  return LINK_CATEGORIES.find((c) => c.id === id) ?? LINK_CATEGORIES[LINK_CATEGORIES.length - 1];
}

/** Extracts the hostname (without www.) from a pasted URL, tolerating missing schemes. */
export function hostOf(url: string): string {
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  try {
    return new URL(cleaned).hostname.replace(/^www\./, '');
  } catch {
    const m = cleaned.match(/^https?:\/\/([^\/\s:]+)/i);
    return m ? m[1].replace(/^www\./, '') : 'link';
  }
}

const GUESSES: Array<[RegExp, LinkCategory]> = [
  [/youtube|youtu\.be|vimeo|dailymotion|twitch|streamable|kick\.com/i, 'video'],
  [/spotify|soundcloud|music\.apple|pandora|deezer|podbean|anchor\.fm|podcasts\.apple/i, 'music'],
  [/github|gitlab|bitbucket|stackoverflow|stackexchange|npmjs|developer\.mozilla|codepen|codesandbox|vercel/i, 'code'],
  [/instagram|facebook|threads|x\.com|twitter|reddit|discord|linkedin|whatsapp|telegram|pinterest|snapchat|tiktok|mastodon/i, 'social'],
  [/amazon|ebay|aliexpress|etsy|shopify|zalando|asos|bestbuy|walmart|shein/i, 'shopping'],
  [/wikipedia|khanacademy|coursera|udemy|edx|duolingo|w3schools|geeksforgeeks|medium\.com|news\.ycombinator/i, 'study'],
  [/unsplash|pexels|pixabay|imgur|flickr|behance|dribbble/i, 'image'],
  [/notion|figma|canva|trello|asana|linear|monday|airtable|miro|calendly|zoom|slack/i, 'tools'],
];

/** Best-effort category suggestion from a URL host. Defaults to 'other'. */
export function guessCategory(url: string): LinkCategory {
  const host = hostOf(url);
  for (const [re, category] of GUESSES) {
    if (re.test(host)) return category;
  }
  return 'other';
}