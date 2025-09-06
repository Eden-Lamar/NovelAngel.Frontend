/* @type {import('tailwindcss').Config}  */
import daisyui from "daisyui"


export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-striped': 'repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(0, 0, 0, 0.3) 14px, rgba(0, 0, 0, 0.3) 15px)',
        'admin-register-img': "url('./src/assets/South-Asian-Novels-To-Add-To-Your-Shelf_Website--1500-x-1024-.jpg')",
        'admin-login-img': "url('./src/assets/2e1c4271-b77c-4d37-87c8-4f6ff27b3459.jfif')"
      }
    },
  },
  plugins: [
    daisyui,
  ],
}

