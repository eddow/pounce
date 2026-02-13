# @pounce/ui TODO

## Form Validation

> Needs design pass

- `valid` prop on form controls — `aria-invalid="true|false"`, adapter provides border colours
- Error message display — where/how (inline, below field, toast?)
- Form-level validation — coordinating field-level `valid` with form submission
- Adapter hooks — valid/invalid colours, error message styling
- Consider `'error' | 'warning' | 'success'` instead of boolean
- Consider `<FormField>` wrapper (label + input + error message layout)
