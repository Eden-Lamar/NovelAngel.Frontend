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
        'admin-register-img': "url('./src/assets/South-Asian-Novels-To-Add-To-Your-Shelf_Website--1500-x-1024-.jpg')"
      }
    },
  },
  plugins: [
    daisyui,
  ],
}

