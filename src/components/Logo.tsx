import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { box: 'h-7 w-7', icon: 15, text: 'text-[15px]' },
  md: { box: 'h-8 w-8', icon: 16, text: 'text-base' },
  lg: { box: 'h-10 w-10', icon: 20, text: 'text-lg' },
};

export default function Logo({ size = 'md', showText = true, to = '/' }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <div className="flex items-center gap-2">
      <div className={`${s.box} flex shrink-0 items-center justify-center rounded-control border border-brand-200 bg-brand-50 text-brand-600`}>
        <Fingerprint size={s.icon} strokeWidth={2.1} />
      </div>
      {showText && (
        <span className={`${s.text} font-semibold tracking-tight text-text-primary`}>
          Chirograph<span className="text-brand-600"> Verify</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-flex transition-opacity hover:opacity-80">{content}</Link>;
  }
  return content;
}
