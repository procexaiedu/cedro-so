import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  callback: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const matchCtrl = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
        const matchShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const matchAlt = shortcut.altKey ? event.altKey : !event.altKey
        const matchMeta = shortcut.metaKey ? event.metaKey : !event.metaKey

        if (matchKey && matchCtrl && matchShift && matchAlt && matchMeta) {
          event.preventDefault()
          shortcut.callback()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function getKeyboardShortcutText(shortcut: KeyboardShortcut): string {
  const parts: string[] = []
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.shiftKey) parts.push('Shift')
  if (shortcut.altKey) parts.push('Alt')
  if (shortcut.metaKey) parts.push('Cmd')
  parts.push(shortcut.key.toUpperCase())
  return parts.join(' + ')
}
