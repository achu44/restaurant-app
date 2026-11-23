import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Café Fausse` : 'Café Fausse | Fine Dining in Washington, DC'
  }, [title])
}
