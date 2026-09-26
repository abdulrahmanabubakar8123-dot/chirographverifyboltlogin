import { Link } from 'react-router-dom';
import { BrandMark } from '@/components/BrandMark';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
}

const sizeMap = {
  sm: { box: 'h-7 w-7', text: 'text-body-md' },
  md: { box: 'h-8 w-8', text: 'text-headline-sm' },
  lg: { box: 'h-10 w-10', text: 'text-headline-md' },
};

export default function Logo({ size = 'md', showText = true, to = '/' }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <div className="flex items-center gap-2">
      <BrandMark className={`${s.box} shrink-0`} />
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
