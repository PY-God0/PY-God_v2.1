interface Props {
  message: string;
  visible: boolean;
  variant?: 'default' | 'bead' | 'holy' | 'shard';
}

const variantStyles: Record<string, { icon: string; bg: string }> = {
  default: { icon: 'text-primary-400', bg: 'bg-primary-900/90' },
  bead: { icon: 'text-primary-400', bg: 'bg-primary-900/90' },
  holy: { icon: 'text-accent-400', bg: 'bg-accent-900/90' },
  shard: { icon: 'text-amber-400', bg: 'bg-amber-900/90' },
};

export default function Toast({ message, visible, variant = 'default' }: Props) {
  if (!visible) return null;
  const s = variantStyles[variant];
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={`px-4 py-2 rounded-lg text-white text-sm shadow-lg flex items-center gap-2 ${s.bg}`}>
        <i className={`ri-check-line ${s.icon}`}></i>
        {message}
      </div>
    </div>
  );
}