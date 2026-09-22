'use client'

import Image, { ImageProps } from 'next/image'

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string // Must be a path like '/snitch.png'
  fallback?: string
}

/**
 * OptimizedImage component
 * Automatically uses WebP format with PNG fallback for better performance
 * Next.js will serve the best format based on browser support
 */
export default function OptimizedImage({ src, fallback, ...props }: OptimizedImageProps) {
  // Convert .png to .webp for modern browsers
  // Next.js Image component handles format negotiation automatically
  const webpSrc = src.replace(/\.png$/, '.webp')
  
  return (
    <picture>
      {/* Modern browsers will use WebP (85% smaller) */}
      <source srcSet={webpSrc} type="image/webp" />
      {/* Fallback to PNG for older browsers */}
      <Image src={src} {...props} />
    </picture>
  )
}
