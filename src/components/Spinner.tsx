import { Loader2 } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export default function Spinner({ size = 16, className = '', ...props }: LucideProps) {
  return <Loader2 size={size} className={`animate-spin ${className}`} {...props} />;
}
