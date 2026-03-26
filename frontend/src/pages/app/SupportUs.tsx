import { Heart, Coffee, DollarSign, Star, LucideIcon } from 'lucide-react';

export function SupportUs() {
  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Support Us</h1>
        <p className="text-text-muted text-sm mt-0.5">Help keep StreamRotate running and growing</p>
      </div>

      <div className="bg-gradient-to-br from-accent-orange/10 to-accent-purple/10 border border-accent-orange/20 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-accent-orange/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-accent-orange" />
        </div>
        <h2 className="font-display font-bold text-xl text-text-primary mb-2">StreamRotate is indie-built</h2>
        <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
          Made by a developer who wanted to stop forgetting about streaming services.
          If StreamRotate helps you save money or watch more intentionally, consider buying me a coffee!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SupportCard
          icon={DollarSign}
          title="Venmo"
          handle="@kvirzi"
          color="text-accent-teal"
          bgColor="bg-accent-teal/15"
          href="https://venmo.com/kvirzi"
        />
        <SupportCard
          icon={DollarSign}
          title="Cash App"
          handle="$kvirzi"
          color="text-green-400"
          bgColor="bg-green-900/20"
          href="https://cash.app/$kvirzi"
        />
        <SupportCard
          icon={Coffee}
          title="Buy Me a Coffee"
          handle="Link coming soon"
          color="text-yellow-400"
          bgColor="bg-yellow-900/20"
          href={undefined}
          disabled
        />
      </div>

      <div className="bg-bg-card border border-bg-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-accent-orange" />
          <h2 className="font-display font-semibold text-text-primary">Other Ways to Help</h2>
        </div>
        <div className="space-y-3">
          <WayItem text="Share StreamRotate with friends who over-pay for streaming" />
          <WayItem text="Send feedback — tell me what would make it more useful for you" />
          <WayItem text="Upgrade to Pro — directly funds development" />
        </div>
      </div>
    </div>
  );
}

function SupportCard({
  icon: Icon, title, handle, color, bgColor, href, disabled
}: {
  icon: LucideIcon;
  title: string;
  handle: string;
  color: string;
  bgColor: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <div className={`bg-bg-card border border-bg-border rounded-2xl p-5 text-center card-hover ${disabled ? 'opacity-60' : ''}`}>
      <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
        <Icon size={24} className={color} />
      </div>
      <h3 className="font-display font-semibold text-text-primary text-sm">{title}</h3>
      <p className={`text-sm font-medium mt-0.5 ${color}`}>{handle}</p>
    </div>
  );

  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}

function WayItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-orange mt-1.5 flex-shrink-0" />
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}
