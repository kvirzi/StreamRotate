/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a24',
          hover: '#1e1e2e',
          border: '#2a2a3a',
        },
        accent: {
          orange: '#e8734a',
          'orange-hover': '#d4623a',
          teal: '#3db8a0',
          'teal-hover': '#2da890',
          purple: '#a78bfa',
          'purple-hover': '#9070ea',
        },
        text: {
          primary: '#f0f0f8',
          secondary: '#a0a0b8',
          muted: '#606080',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
