import { createPaletteModel, paletteContainerModel } from '@pounce/ui/palette'
import type { PaletteEntryDefinition } from '@pounce/ui/palette'

// Create some sample palette entries for the demo
const demoDefinitions: PaletteEntryDefinition[] = [
    {
        id: 'ui.theme',
        label: 'Theme',
        description: 'Application theme',
        schema: {
            type: 'enum',
            options: [
                { value: 'light', label: 'Light', icon: '☀️' },
                { value: 'dark', label: 'Dark', icon: '🌙' },
                { value: 'system', label: 'System', icon: '💻' }
            ]
        }
    },
    {
        id: 'ui.sidebar',
        label: 'Sidebar',
        description: 'Show/hide sidebar',
        schema: { type: 'boolean' }
    },
    {
        id: 'editor.fontSize',
        label: 'Font Size',
        description: 'Editor font size',
        schema: { type: 'number', min: 8, max: 24, step: 1 }
    },
    {
        id: 'game.speed',
        label: 'Game Speed',
        description: 'Game simulation speed',
        schema: { type: 'number', min: 0, max: 5, step: 0.5 }
    }
]

// Create the palette model with some initial display configuration
const palette = createPaletteModel({
    definitions: demoDefinitions,
    display: {
        container: {
            editMode: false,
            dropTargets: [],
            surfaces: [
                {
                    id: '1',
                    type: 'toolbar',
                    region: 'top',
                    visible: true,
                    position: 0,
                    label: 'Main Toolbar',
                    items: [
                        {
                            kind: 'item-group',
                            group: {
                                kind: 'enum-options',
                                entryId: 'ui.theme',
                                options: ['light', 'dark'],
                                presenter: 'radio-group',
                            }
                        },
                        {
                            kind: 'intent',
                            intentId: 'ui.sidebar:toggle',
                            presenter: 'toggle',
                            showText: true
                        }
                    ]
                },
                {
                    id: '2',
                    type: 'toolbar',
                    region: 'left',
                    visible: true,
                    position: 0,
                    label: 'Settings Toolbar',
                    items: [
                        {
                            kind: 'intent',
                            intentId: 'ui.theme:set:light',
                            presenter: 'radio',
                            showText: true
                        },
                        {
                            kind: 'intent',
                            intentId: 'ui.theme:set:dark',
                            presenter: 'radio',
                            showText: true
                        },
                        {
                            kind: 'intent',
                            intentId: 'ui.theme:set:system',
                            presenter: 'radio',
                            showText: true
                        },
                        {
                            kind: 'editor',
                            entryId: 'ui.theme',
                            showText: true
                        }
                    ]
                }
            ]
        }
    }
})

// Create the container model
const container = paletteContainerModel({ palette })

// Demo: Set up initial container configuration
console.log('=== Initial Container State ===')
console.log('Edit mode:', container.editMode)
console.log('Surfaces:', container.surfaces.length)
console.log('Drop targets:', container.dropTargets.length)

// Demo: Create some surfaces
const mainToolbar = container.createSurface('top', 'toolbar', 'Main Toolbar')
const settingsToolbar = container.createSurface('left', 'toolbar', 'Settings Toolbar')
const commandPalette = container.createSurface('right', 'command')

console.log('\n=== Phase 7 Demo Integration ===')
console.log('✅ Main Toolbar: Demonstrates grouped presentation (light/dark theme pair)')
console.log('✅ Settings Toolbar: Shows atomic items + editor for contrast')
console.log('✅ Same entry (ui.theme) appears differently across surfaces:')
console.log('   - Grouped subset in main toolbar (light/dark pair)')
console.log('   - Richer editor in settings toolbar')
console.log('   - Atomic intents in settings toolbar (all options)')

console.log('\n=== After Creating Surfaces ===')
console.log('Surfaces:', container.surfaces.length)
console.log('Surfaces by region:')
;['top', 'right', 'bottom', 'left'].forEach(region => {
    const surfaces = container.getSurfacesInRegion(region as any)
    console.log(`  ${region}:`, surfaces.map(s => `${s.label} (${s.id})`))
})

// Demo: Enter edit mode
container.enterEditMode()
console.log('\n=== Edit Mode Enabled ===')
console.log('Edit mode:', container.editMode)
console.log('Drop targets:', container.dropTargets.length)

// Demo: Show insertion points
console.log('\n=== Insertion Points ===')
;['top', 'right', 'bottom', 'left'].forEach(region => {
    const points = container.getInsertionPointsInRegion(region as any)
    console.log(`${region}:`, points.map(p => `index ${p.index}`))
})

// Demo: Move surfaces between regions
console.log('\n=== Moving Surfaces ===')
container.moveSurface(commandPalette.id, 'bottom')
console.log(`Moved ${commandPalette.label} from right to bottom`)

container.moveSurface(settingsToolbar.id, 'top', 0) // Move to beginning of top
console.log(`Moved ${settingsToolbar.label} from left to top (position 0)`)

// Show updated state
console.log('\n=== Updated Surface Layout ===')
;['top', 'right', 'bottom', 'left'].forEach(region => {
    const surfaces = container.getSurfacesInRegion(region as any)
    console.log(`  ${region}:`, surfaces.map(s => `${s.label} (${s.id})`))
})

// Demo: Surface operations
console.log('\n=== Surface Operations ===')
container.hideSurface(mainToolbar.id)
console.log(`Hidden ${mainToolbar.label}`)

container.renameSurface(settingsToolbar.id, 'App Settings')
console.log(`Renamed settings toolbar to 'App Settings'`)

const newToolbar = container.createSurface('right', 'toolbar', 'Secondary Toolbar')
console.log(`Created new toolbar: ${newToolbar.label}`)

// Demo: Exit edit mode
container.exitEditMode()
console.log('\n=== Edit Mode Disabled ===')
console.log('Edit mode:', container.editMode)
console.log('Drop targets:', container.dropTargets.length)

// Demo: Error handling
console.log('\n=== Error Handling Demo ===')
try {
    container.removeSurface('non-existent-id')
} catch (error) {
    console.log('Expected error:', error instanceof Error ? error.message : String(error))
}

try {
    container.moveSurface('non-existent-id', 'top')
} catch (error) {
    console.log('Expected error:', error instanceof Error ? error.message : String(error))
}

// Final state
console.log('\n=== Final Container State ===')
console.log('Total surfaces:', container.surfaces.length)
console.log('Visible surfaces:', container.surfaces.filter(s => s.visible).length)
console.log('Hidden surfaces:', container.surfaces.filter(s => !s.visible).length)

export { palette, container }
