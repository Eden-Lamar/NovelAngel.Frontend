/* @type {import('tailwindcss').Config}  */
import daisyui from "daisyui"


export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'custom-striped': 'repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(0, 0, 0, 0.3) 14px, rgba(0, 0, 0, 0.3) 15px)',
        'admin-register-img': "url('/assets/download (1).jfif')",
        'admin-login-img': "url('/assets/download.jfif')"
      },
      colors: {
        gold: '#FFD700', // Define your gold color here
      },
      fontFamily: {
        vibes: ['"Great Vibes"', 'cursive'],
      },
    },
  },
  variants: {
    extend: {
      textColor: ['group-hover'],
    },
  },
  plugins: [
    daisyui,
  ],
}

