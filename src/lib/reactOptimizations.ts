/**
 * React Optimization Utilities
 * Advanced memoization and rendering optimizations
 */

import { useEffect, useRef, useMemo, useCallback } from 'react'

/**
 * Deep comparison for useMemo/useCallback dependencies
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T }>({ deps: [], value: undefined as any })

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    }
  }

  return ref.current.value
}

/**
 * Deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }

  return true
}

/**
 * Memoize expensive calculations with cache
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: any[],
  cacheKey?: string
): T {
  const cache = useMemo(() => new Map<string, T>(), [])
  const key = cacheKey || JSON.stringify(deps)

  return useMemo(() => {
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const value = factory()
    cache.set(key, value)
    return value
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Debounced value hook
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        lastRun.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined as any)
  
  useEffect(() => {
    ref.current = value
  }, [value])
  
  return ref.current
}

/**
 * Stable callback that doesn't change on re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  )
}

/**
 * Memoized selector from state
 */
export function useMemoizedSelector<T, R>(
  state: T,
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const selectedRef = useRef<R>(undefined as any)

  const selected = useMemo(() => selector(state), [state, selector])

  if (selectedRef.current === undefined || !equalityFn(selectedRef.current, selected)) {
    selectedRef.current = selected
  }

  return selectedRef.current
}

/**
 * Only re-render when condition is true
 */
export function useConditionalEffect(
  effect: () => void | (() => void),
  deps: any[],
  condition: boolean
) {
  const prevCondition = usePrevious(condition)

  useEffect(() => {
    if (condition && condition !== prevCondition) {
      return effect()
    }
  }, [...deps, condition]) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Batch state updates
 */
export function useBatchedState<T>(
  initialState: T
): [T, (updater: (prev: T) => T) => void, () => void] {
  const [state, setState] = useState(initialState)
  const queueRef = useRef<Array<(prev: T) => T>>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const flush = useCallback(() => {
    if (queueRef.current.length > 0) {
      setState(prev => {
        let newState = prev
        queueRef.current.forEach(updater => {
          newState = updater(newState)
        })
        queueRef.current = []
        return newState
      })
    }
  }, [])

  const batchedSetState = useCallback((updater: (prev: T) => T) => {
    queueRef.current.push(updater)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(flush, 0)
  }, [flush])

  return [state, batchedSetState, flush]
}

/**
 * Intersection Observer hook for lazy rendering
 */
export function useInView(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, options])

  return inView
}

/**
 * Virtual list helper for large lists
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight)
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight,
    }))
  }, [items, visibleRange, itemHeight])

  return {
    visibleItems,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
  }
}

// Add useState import
import { useState } from 'react'
