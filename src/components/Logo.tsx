import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 17, text: 'text-body-md' },
  md: { box: 'h-10 w-10', icon: 20, text: 'text-headline-sm' },
  lg: { box: 'h-12 w-12', icon: 24, text: 'text-headline-md' },
};

export default function Logo({ size = 'md', showText = true, to = '/' }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <div className="flex items-center gap-2">
      <div className={`${s.box} flex shrink-0 items-center justify-center rounded-full bg-primary text-canvas`}>
        <Fingerprint size={s.icon} strokeWidth={2.1} />
      </div>
      {showText && (
        <span className={`${s.text} font-medium text-primary`}>
          Chirograph<span className="text-muted"> Verify</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-flex transition-opacity hover:opacity-80">{content}</Link>;
  }
  return content;
}
