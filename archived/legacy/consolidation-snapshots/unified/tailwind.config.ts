import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Si vous utilisez le package ui-kit
    '../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs traduites depuis :root
        marine: {
          DEFAULT: '#0D1B2E',
          '2': '#142338',
          '3': '#1C2F48',
          '4': '#243A58',
        },
        champ: {
          DEFAULT: '#C8A97E',
          light: '#DFC49A',
          dark: '#A8874E',
          pale: '#F2E8D8',
        },
        ivoire: '#F8F4EE',
        creme: '#FAF7F2',
        blanc: '#FDFCFA',
        sable: {
          DEFAULT: '#EDE3D0',
          dark: '#D8C8A8',
        },
        // Text colors
        txt: {
          '0': '#F8F4EE',
          '1': 'rgba(248,244,238,0.80)',
          '2': 'rgba(248,244,238,0.52)',
          '3': 'rgba(248,244,238,0.28)',
        },
        // Dark text colors
        dk: {
          '0': '#0D1B2E',
          '1': '#1C2F48',
          '2': '#4A6280',
          '3': '#8A9CB0',
        }
      },
      fontFamily: {
        // Polices traduites depuis :root
        disp: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Rayons traduits depuis :root
        s: '4px',
        m: '10px',
        l: '18px',
        xl: '32px',
      },
    },
  },
  plugins: [],
}
export default config