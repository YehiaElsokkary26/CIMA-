import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
}

// Newsprint (light) is the default look; dark is the "screening room".
export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      toggleDarkMode: () => {
        const next = !get().isDarkMode
        set({ isDarkMode: next })
        document.documentElement.classList.toggle('dark', next)
      },
      setDarkMode: (dark) => {
        set({ isDarkMode: dark })
        document.documentElement.classList.toggle('dark', dark)
      },
    }),
    { name: 'klaket-ui' }
  )
)
