export function highlightText(text: string, searchTerms: string[]): string {
  if (!text || searchTerms.length === 0) {
    return escapeHtml(text);
  }

  let highlightedText = escapeHtml(text);
  
  searchTerms.forEach(term => {
    if (term.trim()) {
      const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
  });
  
  return highlightedText;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}