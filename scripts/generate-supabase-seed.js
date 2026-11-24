import { writeFile } from 'node:fs/promises';
import { products } from '../src/data.js';

const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const rows = products.map(product => {
  const json = JSON.stringify(product).replaceAll("'", "''");
  return `  (${sqlString(product.id)}, '${json}'::jsonb, true)`;
});

await writeFile('supabase/seed.sql', [
  '-- Generated from src/data.js. Rerunning does not overwrite staff edits.',
  'insert into public.menu_items (id, product, available) values',
  rows.join(',\n'),
  'on conflict (id) do nothing;',
  '',
].join('\n'));
console.log(`Wrote seed for ${products.length} menu items.`);
