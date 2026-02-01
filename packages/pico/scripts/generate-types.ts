
import fs from 'node:fs';
import path from 'node:path';
import { generateIconsCode } from '../../../../pure-glyf/src/generator';

// Config duplicated from vite.config.ts (safest approach for standalone script)
const iconsConfig = {
    tabler: 'node_modules/@tabler/icons/icons',
};

// Target file
const dtsPath = path.resolve(process.cwd(), 'src/types/pure-glyf.d.ts');

console.log('Generating pure-glyf types...');
console.log(`Target: ${dtsPath}`);

try {
    const result = generateIconsCode(iconsConfig, false);
    fs.writeFileSync(dtsPath, result.dts);
    console.log('Successfully generated pure-glyf.d.ts');
} catch (e) {
    console.error('Failed to generate types:', e);
    process.exit(1);
}
