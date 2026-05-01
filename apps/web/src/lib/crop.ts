// Heuristic crop glyph picker — extracts a crop family from job title + skill
// hints so cards can render a colored SVG without an explicit metadata column.
// Falls back to almond when nothing matches; that's still a Central Valley
// staple so the design language stays coherent for unknown roles.
export function inferCrop(titleEn: string, skills: string[]): string {
  const text = `${titleEn} ${skills.join(' ')}`.toLowerCase();
  if (text.includes('grape') || text.includes('vine') || text.includes('uva'))
    return 'grape';
  if (text.includes('almond') || text.includes('almendra')) return 'almond';
  if (
    text.includes('citrus') ||
    text.includes('orange') ||
    text.includes('lemon') ||
    text.includes('cítrico') ||
    text.includes('naranja')
  )
    return 'citrus';
  if (text.includes('tomato') || text.includes('jitomate')) return 'tomato';
  if (
    text.includes('strawberry') ||
    text.includes('berry') ||
    text.includes('fresa')
  )
    return 'strawberry';
  if (text.includes('lettuce') || text.includes('lechuga')) return 'lettuce';
  return 'almond';
}
