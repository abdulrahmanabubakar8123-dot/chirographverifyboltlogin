import { Fingerprint } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
  onDark?: boolean;
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 16, text: 'text-base' },
  md: { box: 'h-10 w-10', icon: 20, text: 'text-lg' },
  lg: { box: 'h-12 w-12', icon: 24, text: 'text-xl' },
};

export default function Logo({ size = 'md', showText = true, to = '/', onDark = false }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} flex shrink-0 items-center justify-center rounded-full bg-[#ff801f] shadow-sm`}>
        <Fingerprint className="text-black" size={s.icon} strokeWidth={2.2} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight text-[#f0f0f0]`}>
          Chirograph<span className="text-[#ff801f]"> Verify</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-flex transition-opacity hover:opacity-80">{content}</Link>;
  }
  return content;
}
