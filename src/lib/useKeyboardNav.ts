/**
 * Keyboard Navigation Hook
 * Provides keyboard navigation support for improved accessibility
 */

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardNavOptions {
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: () => void
  disabled?: boolean
}

/**
 * Hook to handle keyboard navigation
 */
export function useKeyboardNav(options: KeyboardNavOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onSpace,
    onEscape,
    onTab,
    disabled = false,
  } = options

  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          onArrowUp?.()
          break
        case 'ArrowDown':
          e.preventDefault()
          onArrowDown?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onArrowLeft?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          onArrowRight?.()
          break
        case 'Enter':
          e.preventDefault()
          onEnter?.()
          break
        case ' ':
          e.preventDefault()
          onSpace?.()
          break
        case 'Escape':
          e.preventDefault()
          onEscape?.()
          break
        case 'Tab':
          if (onTab) {
            e.preventDefault()
            onTab()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onSpace, onEscape, onTab, disabled])
}

/**
 * Hook for grid-based keyboard navigation
 */
export function useGridKeyboardNav(
  rows: number,
  cols: number,
  onCellSelect: (row: number, col: number) => void,
  disabled: boolean = false
) {
  const currentRow = useRef(0)
  const currentCol = useRef(0)

  const moveUp = useCallback(() => {
    if (currentRow.current > 0) {
      currentRow.current--
      onCellSelect(currentRow.current, currentCol.current)
    }
  }, [onCellSelect])

  const moveDown = useCallback(() => {
    if (currentRow.current < rows - 1) {
      currentRow.current++
      onCellSelect(currentRow.current, currentCol.current)
    }
  }, [rows, onCellSelect])

  const moveLeft = useCallback(() => {
    if (currentCol.current > 0) {
      currentCol.current--
      onCellSelect(currentRow.current, currentCol.current)
    }
  }, [onCellSelect])

  const moveRight = useCallback(() => {
    if (currentCol.current < cols - 1) {
      currentCol.current++
      onCellSelect(currentRow.current, currentCol.current)
    }
  }, [cols, onCellSelect])

  useKeyboardNav({
    onArrowUp: moveUp,
    onArrowDown: moveDown,
    onArrowLeft: moveLeft,
    onArrowRight: moveRight,
    disabled,
  })

  return {
    currentRow: currentRow.current,
    currentCol: currentCol.current,
    setPosition: (row: number, col: number) => {
      currentRow.current = row
      currentCol.current = col
    },
  }
}
