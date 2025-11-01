/**
 * Text processing utilities for How-CLI
 */

export function cleanResponse(text: string): string {
  text = text.trim();

  // Remove markdown code blocks
  if (text.startsWith('```') && text.endsWith('```')) {
    const lines = text.split('\n');
    const firstLine = lines[0];

    if (firstLine.length > 3) {
      // Has language identifier, remove first line and last ```
      text = lines.slice(1, -1).join('\n').trim();
    } else {
      // No language identifier, just remove ``` markers
      text = text.slice(3, -3).trim();
    }
  } else if (text.startsWith('`') && text.endsWith('`')) {
    // Remove single backticks
    text = text.slice(1, -1).trim();
  }

  return text.trim();
}
