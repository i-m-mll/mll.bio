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

      fontSize: {
        'note': '0.85rem',
      },
      lineHeight: {
        'note': '1.4',
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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%",
            color: "var(--foreground)",
            a: {
              color: "var(--primary)",
              "&:hover": {
                color: "var(--primary)",
              },
            },
            '[class~="lead"]': {
              color: "var(--foreground)",
            },
            strong: {
              color: "var(--foreground)",
            },
            "ol > li::marker": {
              color: "var(--foreground)",
            },
            "ul > li::marker": {
              color: "var(--foreground)",
            },
            hr: {
              borderColor: "var(--border)",
            },
            blockquote: {
              color: "var(--foreground)",
              borderLeftColor: "var(--border)",
            },
            h1: {
              color: "var(--foreground)",
            },
            h2: {
              color: "var(--foreground)",
            },
            h3: {
              color: "var(--foreground)",
            },
            h4: {
              color: "var(--foreground)",
            },
            "figure figcaption": {
              color: "var(--muted-foreground)",
            },
            code: {
              color: "var(--foreground)",
              fontWeight: "400",
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            "a code": {
              color: "var(--foreground)",
            },
            pre: {
              color: "var(--foreground)",
              backgroundColor: "var(--muted)",
            },
            thead: {
              color: "var(--foreground)",
              borderBottomColor: "var(--border)",
            },
            "tbody tr": {
              borderBottomColor: "var(--border)",
            },
          },
        },
      },
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
