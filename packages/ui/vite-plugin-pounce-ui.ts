import type { Plugin } from 'vite'
import { relative, dirname } from 'path'

/**
 * Vite plugin for @pounce/ui
 * 1. Wraps css`...` and sass`...` tagged templates in @layer pounce.components
 * 2. Validates that only --pounce-* variables are used
 * 3. Auto-prepends @use for SASS variables with correct relative path
 */
export function pounceUIPlugin(): Plugin {
  return {
    name: 'vite-plugin-pounce-ui',
    enforce: 'pre',

    async transform(code, id) {
      // Only process .ts and .tsx files in src
      if (!id.match(/\.tsx?$/) || !id.includes('/src/')) {
        return null
      }

      const csstags = ['css', 'sass', 'scss', 'componentStyle', 'baseStyle']
      const regex = new RegExp(`\\b(${csstags.join('|')})(?:\\.(css|sass|scss))?\\s*\`([^\\\`]*)\``, 'g')
      let modified = false
      let newCode = code

      newCode = newCode.replace(regex, (match, tag, flavor, content) => {
        // Validation: Check for forbidden variables
        const forbidden = content.match(/--pico-[a-zA-Z0-9-]+/g)
        if (forbidden) {
          throw new Error(
            `[pounce-ui] Forbidden variables found in ${id}: ${forbidden.join(', ')}. ` +
            `Use --pounce-* variables instead.`
          )
        }

        modified = true
        
        // Determine the layer
        const layer = tag === 'baseStyle' ? 'pounce.base' : 'pounce.components'
        
        // Auto-prepend @use for SASS/SCSS flavors with correct relative path
        const isSass = flavor === 'sass' || flavor === 'scss'
        let importStatement = ''
        if (isSass && !content.includes('@use')) {
          // Calculate relative path from current file to styles/_variables.sass
          const currentDir = dirname(id)
          const variablesPath = id.replace(/\/src\/.*$/, '/src/styles/_variables.sass')
          const relativePath = relative(currentDir, variablesPath)
            .replace(/\\/g, '/') // Normalize Windows paths
            .replace(/^(?!\.)/, './') // Ensure it starts with ./
          importStatement = `@use '${relativePath}' as *\n`
        }
        
        // Wrap in the appropriate layer (needed for SASS @layer processing)
        const layeredContent = `@layer ${layer} {\n${importStatement}${content}\n}`
        const fullTag = flavor ? `${tag}.${flavor}` : tag
        return `${fullTag}\`${layeredContent}\``
      })

      if (modified) {
        return {
          code: newCode,
          map: null // We should ideally provide a map but for now null is okay
        }
      }

      return null
    }
  }
}
