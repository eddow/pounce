import type { Plugin } from 'vite'
import { relative, dirname } from 'path'
import { createRequire } from 'module'

import MagicString from 'magic-string'

const require = createRequire(import.meta.url)
const sass = require('sass')

export function pounceUIPlugin(): Plugin {
  const cssChunks = new Map<string, string>();
  
  return {
    name: 'vite-plugin-pounce-ui',
    enforce: 'pre',
    
    buildStart() {
      cssChunks.clear();
    },

    async transform(code, id) {
      if (!id.match(/\.tsx?$/) || !id.includes('/src/')) {
        return null;
      }

      const csstags = ['css', 'sass', 'scss', 'componentStyle', 'baseStyle'];
      const regex = new RegExp(`\\b(${csstags.join('|')})(?:\\.(css|sass|scss))?\\s*\`([^\\\`]*)\``, 'g');
      
      // Initialize MagicString with your original code
      const s = new MagicString(code);
      let match;
      let modified = false;

      while ((match = regex.exec(code)) !== null) {
        const [fullMatch, tag, flavor, content] = match;
        const start = match.index;
        const end = start + fullMatch.length;

        // Validation logic
        const forbidden = content.match(/--pico-[a-zA-Z0-9-]+/g);
        if (forbidden) {
          throw new Error(`[pounce-ui] Forbidden variables found in ${id}: ${forbidden.join(', ')}`);
        }

        modified = true;
        const layer = tag === 'baseStyle' ? 'pounce.base' : 'pounce.components';
        const isSass = flavor === 'sass' || flavor === 'scss';
        
        let processedContent = content;
        
        if (isSass) {
          // Compile SASS to CSS
          try {
            const currentDir = dirname(id);
            const variablesPath = id.replace(/\/src\/.*$/, '/src/styles/_variables.sass');
            let relativePath = relative(currentDir, variablesPath).replace(/\\/g, '/');
            if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
            
            // Add @use for variables if not present
            let sassContent = content;
            if (!content.includes('@use')) {
              sassContent = `@use '${relativePath}' as *\n${content}`;
            }
            
            const result = sass.compileString(sassContent, {
              syntax: flavor === 'scss' ? 'scss' : 'indented',
              loadPaths: [dirname(id), dirname(variablesPath)]
            });
            processedContent = result.css;
          } catch (error) {
            // If SASS compilation fails, fall back to passing through
            console.warn(`[pounce-ui] SASS compilation failed in ${id}: ${error}`);
            if (!content.includes('@use')) {
              const currentDir = dirname(id);
              const variablesPath = id.replace(/\/src\/.*$/, '/src/styles/_variables.sass');
              let relativePath = relative(currentDir, variablesPath).replace(/\\/g, '/');
              if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
              processedContent = `@use '${relativePath}' as *\n${content}`;
            }
          }
        }

        // Use overwrite to replace the old chunk with the new one
        const fullTag = flavor ? `${tag}.${flavor}` : tag;
        const replacement = `${fullTag}\`@layer ${layer} {\n${processedContent}\n}\``;
        
        s.overwrite(start, end, replacement);
      }

      if (modified) {
        return {
          code: s.toString(),
          // This generates a high-fidelity map automatically
          map: s.generateMap({
            source: id,
            file: id + '.map',
            includeContent: true
          })
        };
      }

      return null;
    }
  };
}
