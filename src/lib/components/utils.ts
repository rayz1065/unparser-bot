export function escapeHtml(text: string) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return text.replace(/[&<>]/g, (m) => map[m as keyof typeof map]);
}

export function selectedLabel(label: string, selected: boolean) {
  return selected ? `• ${label} •` : label;
}
