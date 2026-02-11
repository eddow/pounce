# @pounce/ui TODO

## Future Components

- **Card** (`<article>`) — header/body/footer slots
- **Progress** (`<progress>`) — determinate + indeterminate
- **Accordion** (`<details name="...">`) — exclusive-open groups

## Form Validation

> Needs design pass

- `valid` prop on form controls — `aria-invalid="true|false"`, adapter provides border colours
- Error message display — where/how (inline, below field, toast?)
- Form-level validation — coordinating field-level `valid` with form submission
- Adapter hooks — valid/invalid colours, error message styling
- Consider `'error' | 'warning' | 'success'` instead of boolean
- Consider `<FormField>` wrapper (label + input + error message layout)

## DisplayContext Extensions

```typescript
fontSize?: 'small' | 'medium' | 'large'
contrast?: 'normal' | 'high'
reducedMotion?: boolean
density?: 'compact' | 'comfortable' | 'spacious'
```
