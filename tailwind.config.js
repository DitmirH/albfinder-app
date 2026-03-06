/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F6F7F4',
          dark: '#0F1115',
        },
        subtle: {
          DEFAULT: '#F0F2EE',
          dark: '#151922',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#181D27',
        },
        'surface-hover': {
          DEFAULT: '#F8FAF7',
          dark: '#1F2531',
        },
        elevated: {
          DEFAULT: '#FFFFFF',
          dark: '#232A36',
        },
        accent: {
          DEFAULT: '#0F9F6E',
          hover: '#0B8A5F',
          soft: '#E8F7F0',
          'soft-text': '#0B6B4A',
          dark: '#34D399',
          'dark-hover': '#10B981',
          'dark-soft': 'rgba(52, 211, 153, 0.14)',
          'dark-soft-text': '#86EFAC',
        },
        border: {
          subtle: '#E5E7EB',
          DEFAULT: '#D7DCE2',
          strong: '#C4CAD3',
          'dark-subtle': '#273041',
          dark: '#313B4D',
          'dark-strong': '#445066',
        },
        semantic: {
          success: '#0F9F6E',
          'success-soft': '#E8F7F0',
          warning: '#D97706',
          'warning-soft': '#FFF4E5',
          danger: '#DC2626',
          'danger-soft': '#FDECEC',
          info: '#4F46E5',
          'info-soft': '#EEF2FF',
          'dark-success': '#34D399',
          'dark-success-soft': 'rgba(52, 211, 153, 0.14)',
          'dark-warning': '#F59E0B',
          'dark-warning-soft': 'rgba(245, 158, 11, 0.14)',
          'dark-danger': '#F87171',
          'dark-danger-soft': 'rgba(248, 113, 113, 0.14)',
          'dark-info': '#818CF8',
          'dark-info-soft': 'rgba(129, 140, 248, 0.14)',
        },
      },
      textColor: {
        primary: {
          DEFAULT: '#111827',
          dark: '#F3F4F6',
        },
        secondary: {
          DEFAULT: '#4B5563',
          dark: '#C7CDD6',
        },
        tertiary: {
          DEFAULT: '#6B7280',
          dark: '#99A3B2',
        },
        muted: {
          DEFAULT: '#9CA3AF',
          dark: '#748091',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'section-title': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'metric': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'body': ['0.875rem', { lineHeight: '1.375rem', fontWeight: '500' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        'label': ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
        'caption': ['0.6875rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      borderRadius: {
        'control': '10px',
        'card': '16px',
        'modal': '18px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
