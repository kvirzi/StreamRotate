export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <span className={`font-display font-bold ${sizes[size]}`}>
      <span className="text-accent-orange">Stream</span>
      <span className="text-text-primary">Rotate</span>
    </span>
  );
}
