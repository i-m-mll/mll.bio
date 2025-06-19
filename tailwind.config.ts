import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'tablet': '701px',
      'desktop': '1051px',
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['et-book', 'serif'],
      },

      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      fontSize: {
        'note': '0.85rem',
        'code': '0.8em',
      },
      lineHeight: {
        'note': '1.4',
        'code': '1.7',
      },
      colors: {
        stone: {
          75: '#f8f8f7',
          925: '#141210'
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            '--prose-body': 'hsl(var(--foreground))',
            '--prose-headings': 'hsl(var(--foreground))',
            '--prose-lead': 'hsl(var(--foreground))',
            '--prose-links': 'hsl(var(--primary))',
            '--prose-bold': 'hsl(var(--foreground))',
            '--prose-counters': 'hsl(var(--muted-foreground))',
            '--prose-bullets': 'hsl(var(--muted-foreground))',
            '--prose-hr': 'hsl(var(--border))',
            '--prose-quotes': 'hsl(var(--foreground))',
            '--prose-quote-borders': 'hsl(var(--border))',
            '--prose-captions': 'hsl(var(--muted-foreground))',
            '--prose-code': 'hsl(var(--foreground))',
            '--prose-pre-code': 'hsl(var(--foreground))',
            '--prose-pre-bg': 'transparent',
            '--prose-th-borders': 'hsl(var(--border))',
            '--prose-td-borders': 'hsl(var(--border))',
            '--prose-invert-body': 'hsl(var(--background))',
            '--prose-invert-headings': 'hsl(var(--background))',
            '--prose-invert-lead': 'hsl(var(--background))',
            '--prose-invert-links': 'hsl(var(--primary))',
            '--prose-invert-bold': 'hsl(var(--background))',
            '--prose-invert-counters': 'hsl(var(--muted-foreground))',
            '--prose-invert-bullets': 'hsl(var(--muted-foreground))',
            '--prose-invert-hr': 'hsl(var(--border))',
            '--prose-invert-quotes': 'hsl(var(--background))',
            '--prose-invert-quote-borders': 'hsl(var(--border))',
            '--prose-invert-captions': 'hsl(var(--muted-foreground))',
            '--prose-invert-code': 'hsl(var(--background))',
            '--prose-invert-pre-code': 'hsl(var(--background))',
            '--prose-invert-pre-bg': 'transparent',
            '--prose-invert-th-borders': 'hsl(var(--border))',
            '--prose-invert-td-borders': 'hsl(var(--border))',
            
            // Set the max-width for the prose container
            maxWidth: '48rem',

            // Base styles
            fontSize: '1.1rem',
            lineHeight: '1.6',

            // Heading margin multipliers
            '--heading-margin-top-factor': '0.6',
            '--heading-margin-bottom-factor': '0.6',

            // Headings
            h1: { 
              fontSize: '1.9em', 
              scrollMargin: 'var(--spacing-20, 5rem)',
              marginTop: `calc(0em * var(--heading-margin-top-factor))`,
              marginBottom: `calc(1em * var(--heading-margin-bottom-factor))`,
            },
            h2: { 
              fontSize: '1.4em', 
              scrollMargin: 'var(--spacing-20, 5rem)',
              marginTop: `calc(1.8em * var(--heading-margin-top-factor))`,
              marginBottom: `calc(0.9em * var(--heading-margin-bottom-factor))`,
            },
            h3: { 
              fontSize: '1.2em', 
              scrollMargin: 'var(--spacing-20, 5rem)',
              marginTop: `calc(1.6em * var(--heading-margin-top-factor))`,
              marginBottom: `calc(0.8em * var(--heading-margin-bottom-factor))`,
            },
            h4: { 
              fontSize: '1.1em', 
              scrollMargin: 'var(--spacing-20, 5rem)',
              marginTop: `calc(1.5em * var(--heading-margin-top-factor))`,
              marginBottom: `calc(0.7em * var(--heading-margin-bottom-factor))`,
            },

            // Paragraphs
            p: {
              fontWeight: theme('fontWeight.medium'),
              marginTop: '0.6em',
              marginBottom: `0.6em`,
            },

            // Links
            a: {
              fontWeight: theme('fontWeight.medium'),
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            },

            // Blockquotes
            blockquote: {
              borderLeftWidth: '4px',
              paddingLeft: theme('spacing.4'),
              fontStyle: 'italic',
            },
            
            // Images
            img: {
              borderRadius: theme('borderRadius.md'),
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'left',
            },
            
            // Tables
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            thead: {
              backgroundColor: 'var(--muted)',
            },
            'th, td': {
              border: `1px solid ${'var(--border)'}`,
              padding: theme('spacing.2'),
              textAlign: 'left',
            },
            
            // Remove default before/after content for code blocks
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function({ addUtilities }: any) {
      const newUtilities = {
        '.clip-sr-only': {
          clip: 'rect(0, 0, 0, 0)',
        },
        '.clip-auto': {
          clip: 'auto',
        },
        '.clip-path-sr-only': {
          'clip-path': 'inset(50%)',
        },
                 '.clip-path-none': {
           'clip-path': 'none',
         },
         '.no-decoration': {
           'text-decoration': 'none !important',
         },
         '.no-decoration:hover': {
           'text-decoration': 'none !important',
         },
         '.no-decoration:focus': {
           'text-decoration': 'none !important',
         },
         '.no-decoration:active': {
           'text-decoration': 'none !important',
         },
         '.no-decoration:visited': {
           'text-decoration': 'none !important',
         },
       };
       addUtilities(newUtilities);
    },
  ],
} satisfies Config

export default config
