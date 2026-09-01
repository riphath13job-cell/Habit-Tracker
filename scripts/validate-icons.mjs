import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'icons.tsx'), 'utf8');

const fontCode = {
  material: 'MaterialIcons.json',
  bold: 'MaterialCommunityIcons.json',
  minimal: 'Feather.json',
  thin: 'Ionicons.json',
};

const glyphmaps = {};
for (const [style, file] of Object.entries(fontCode)) {
  glyphmaps[style] = JSON.parse(
    readFileSync(
      join(root, 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'glyphmaps', file),
      'utf8',
    ),
  );
}

const re = /^\s*'?([A-Za-z0-9_-]+)'?:\s*\{\s*material:\s*'([^']+)',\s*bold:\s*'([^']+)',\s*minimal:\s*'([^']+)',\s*thin:\s*'([^']+)'\s*\},?\s*$/gm;

let count = 0;
let bad = 0;
let m;
while ((m = re.exec(src))) {
  count += 1;
  const [semantic, material, bold, minimal, thin] = m.slice(1);
  const checks = [
    ['material', semantic, material],
    ['bold', semantic, bold],
    ['minimal', semantic, minimal],
    ['thin', semantic, thin],
  ];
  for (const [style, name, glyph] of checks) {
    if (!(glyph in glyphmaps[style])) {
      bad += 1;
      console.log(`MISSING  ${style.padEnd(8)} ${name} -> '${glyph}'`);
    }
  }
}
console.log(`validated ${count} registry entries, ${bad} missing glyphs`);
process.exit(bad ? 1 : 0);