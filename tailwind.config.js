/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // X uses Inter for sans and Geist Mono for code.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // ── Chirograph Verify console — X Developer Platform system ──
        //
        // Every semantic token resolves to a CSS variable so the light theme
        // is a single variable swap on <html> rather than a hand-maintained
        // list of class overrides. Using `rgb(var(--x) / <alpha-value>)` keeps
        // Tailwind's opacity modifiers (/10, /45 …) working, which a plain
        // `var(--x)` would silently break.
        //
        // The values live in src/index.css under :root and html.light.
        primary: 'rgb(var(--cv-primary) / <alpha-value>)',   // headings & strong text
        neutral: 'rgb(var(--cv-primary) / <alpha-value>)',
        secondary: 'rgb(var(--cv-secondary) / <alpha-value>)', // secondary body text
        tertiary: 'rgb(var(--cv-line-strong) / <alpha-value>)', // legacy hairline alias
        muted: 'rgb(var(--cv-muted) / <alpha-value>)',       // muted body text
        canvas: 'rgb(var(--cv-canvas) / <alpha-value>)',    // page background
        surface: 'rgb(var(--cv-surface) / <alpha-value>)',   // raised surface
        'surface-2': 'rgb(var(--cv-surface-2) / <alpha-value>)', // X panel fill
        'surface-3': 'rgb(var(--cv-surface-3) / <alpha-value>)', // hovered / inset rows
        line: 'rgb(var(--cv-line) / <alpha-value>)',        // hairline border
        'line-strong': 'rgb(var(--cv-line-strong) / <alpha-value>)',
        // Accent = ink, matching the reference's focus ring.
        accent: 'rgb(var(--cv-primary) / <alpha-value>)',
        // The numeric accent steps exist for success/positive states
        // (verified calls, active webhooks, sent notices) and resolve to
        // the single green chromatic accent used across the console.
        'accent-50': 'rgb(var(--cv-success-bg) / <alpha-value>)',
        'accent-100': 'rgb(var(--cv-success-bg) / <alpha-value>)',
        'accent-200': 'rgb(var(--cv-success-line) / <alpha-value>)',
        'accent-300': 'rgb(var(--cv-success) / <alpha-value>)',
        'accent-400': 'rgb(var(--cv-success-ink) / <alpha-value>)',
        'accent-500': 'rgb(var(--cv-success) / <alpha-value>)',
        'accent-600': 'rgb(var(--cv-success-ink) / <alpha-value>)',
        'accent-700': 'rgb(var(--cv-success-ink) / <alpha-value>)',
        // Green is the single chromatic accent, reserved for positive
        // figures and success states.
        success: 'rgb(var(--cv-success) / <alpha-value>)',
        warning: 'rgb(var(--cv-warning) / <alpha-value>)',
        danger: 'rgb(var(--cv-danger) / <alpha-value>)',
        error: 'rgb(var(--cv-danger) / <alpha-value>)',
        'text-primary': 'rgb(var(--cv-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--cv-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--cv-muted) / <alpha-value>)',
        'text-micro': 'rgb(var(--cv-text-micro) / <alpha-value>)',
        // Brand blue. Per the documented exception in BrandMark.tsx this is the
        // ONLY place blue is allowed in the UI, and only on plan surfaces.
        'blue-ink': 'rgb(var(--cv-blue-ink) / <alpha-value>)',
        'blue-line': 'rgb(var(--cv-blue-line) / <alpha-value>)',
        'blue-soft': 'rgb(var(--cv-blue-soft) / <alpha-value>)',
        'blue-text': 'rgb(var(--cv-blue-text) / <alpha-value>)',
        'blue-glow': 'rgb(var(--cv-blue-glow) / <alpha-value>)',
        // Legacy brand ramp retained for components that still reference it;
        // it resolves to ink/surface greys so nothing renders in the old blue.
        brand: {
          50: 'rgb(var(--cv-surface-2) / <alpha-value>)',
          100: 'rgb(var(--cv-surface-3) / <alpha-value>)',
          200: 'rgb(var(--cv-line-strong) / <alpha-value>)',
          300: 'rgb(var(--cv-muted) / <alpha-value>)',
          400: 'rgb(var(--cv-secondary) / <alpha-value>)',
          500: 'rgb(var(--cv-secondary) / <alpha-value>)',
          600: 'rgb(var(--cv-primary) / <alpha-value>)',
          700: 'rgb(var(--cv-secondary) / <alpha-value>)',
          800: 'rgb(var(--cv-muted) / <alpha-value>)',
          900: 'rgb(var(--cv-text-micro) / <alpha-value>)',
        },
      },
      fontFamily: {
        // X uses Inter for sans and Geist Mono for code.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Spec: display / headline / body / label scales, 500-600 weight.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-lg': ['64px', { lineHeight: '1.06', letterSpacing: '-0.022em' }],
        'headline-lg': ['24px', { lineHeight: '29px', letterSpacing: '0px' }],
        'headline-md': ['20px', { lineHeight: '24px', letterSpacing: '0px' }],
        'headline-sm': ['18px', { lineHeight: '22px', letterSpacing: '0px' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
        'body-md': ['15px', { lineHeight: '23px', letterSpacing: '0px' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '0px' }],
        'label-lg': ['15px', { lineHeight: '23px', letterSpacing: '0px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
        display: ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.022em' }],
        hero: ['3.25rem', { lineHeight: '1.04', letterSpacing: '-0.022em' }],
      },
      boxShadow: {
        // Spec: mostly flat. Depth from contrast and thin borders only.
        control: 'none',
        card: 'none',
        glow: 'none',
      },
      borderRadius: {
        // X console: 16px panels/cards, 8px inputs, full pills.
        none: '0px',
        sm: '4px',
        md: '8px',
        xl2: '8px',
        panel: '16px',
        lg: '12px',
        xl: '16px',
        '2xl': '16px',
        '3xl': '24px',
        control: '9999px',
        full: '9999px',
      },
      spacing: {
        // Spec: xs 4 / sm 12 / md 24 / lg 32 / xl 40 / gutter 24 / section 80
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '32px',
        xl: '40px',
        gutter: '24px',
        section: '80px',
      },
      letterSpacing: {
        micro: '0px',
      },
      boxShadow: {
        // Elevation is expressed through hairlines, not shadows. The only
        // glow is the soft white halo on the primary action.
        none: 'none',
        control: 'none',
        card: 'none',
        // glow is the soft halo on the primary action, keyed to the ink token
        // so it follows the active theme instead of baking in white.
        glow: '0 0 34px 2px rgb(var(--cv-primary) / 0.20)',
        'glow-sm': '0 0 18px 0 rgb(var(--cv-primary) / 0.12)',
      },
      backgroundImage: {
        'brand-gradient': 'none',
        'card-grid': 'none',
        'hero-gradient': 'none',
      },
    },
  },
  plugins: [],
};
