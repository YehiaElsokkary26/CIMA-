import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
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
    { name: 'cima-ui' }
  )
)
