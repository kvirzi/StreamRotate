// Service icon colors and abbreviations
const SERVICE_COLORS: Record<string, { bg: string; text: string }> = {
  netflix: { bg: '#e50914', text: '#fff' },
  'amazon prime': { bg: '#00a8e0', text: '#fff' },
  'prime video': { bg: '#00a8e0', text: '#fff' },
  hulu: { bg: '#1ce783', text: '#000' },
  'disney+': { bg: '#113ccf', text: '#fff' },
  'disney plus': { bg: '#113ccf', text: '#fff' },
  'hbo max': { bg: '#5822b4', text: '#fff' },
  max: { bg: '#5822b4', text: '#fff' },
  'apple tv+': { bg: '#555', text: '#fff' },
  'apple tv': { bg: '#555', text: '#fff' },
  peacock: { bg: '#fa3c00', text: '#fff' },
  paramount: { bg: '#0064ff', text: '#fff' },
  'paramount+': { bg: '#0064ff', text: '#fff' },
  showtime: { bg: '#f00', text: '#fff' },
  starz: { bg: '#000', text: '#fff' },
  crunchyroll: { bg: '#f47521', text: '#fff' },
  funimation: { bg: '#410099', text: '#fff' },
  youtube: { bg: '#f00', text: '#fff' },
  'youtube tv': { bg: '#f00', text: '#fff' },
  twitch: { bg: '#9146ff', text: '#fff' },
  plex: { bg: '#e5a00d', text: '#000' },
};

const GRADIENT_COLORS = [
  { bg: '#e8734a', text: '#fff' },
  { bg: '#3db8a0', text: '#fff' },
  { bg: '#a78bfa', text: '#fff' },
  { bg: '#f59e0b', text: '#000' },
  { bg: '#ec4899', text: '#fff' },
  { bg: '#3b82f6', text: '#fff' },
];

function getServiceColor(name: string) {
  const key = name.toLowerCase().trim();
  if (SERVICE_COLORS[key]) return SERVICE_COLORS[key];
  // Deterministic color from name
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length;
  return GRADIENT_COLORS[idx];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ServiceIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ServiceIcon({ name, size = 'md', className = '' }: ServiceIconProps) {
  const { bg, text } = getServiceColor(name);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };

  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-display font-bold flex-shrink-0 ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {getInitials(name)}
    </div>
  );
}
