'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getOptimizedImageUrl } from '@/lib/image-optimizer'

interface Banner {
  id: number
  title: string
  image_url: string
  link_url?: string
}

export default function HeroBanners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null

  return (
    <section className="py-6 overflow-x-hidden contain-inline">
      <div className="container max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
          {banners.map((banner, index) => {
            // Первый баннер - это LCP элемент, нужен fetchpriority="high"
            const isLCP = index === 0
            return (
              <div key={banner.id} className="rounded-lg overflow-hidden shadow-md relative h-44 sm:h-48">
                {banner.link_url ? (
                  <Link href={banner.link_url}>
                    <Image
                      // ОПТИМИЗАЦИЯ: Используем Supabase Image Transform для сжатия
                      src={getOptimizedImageUrl(
                        banner.image_url, 
                        isLCP ? 1920 : 1200, // LCP элемент - больше, остальные меньше
                        isLCP ? 90 : 85, // LCP элемент - выше качество
                        'webp'
                      )}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform"
                      priority={isLCP}
                      fetchPriority={isLCP ? "high" : "auto"}
                      loading={isLCP ? "eager" : index < 3 ? "eager" : "lazy"}
                      unoptimized
                    />
                  </Link>
                ) : (
                  <Image
                    // ОПТИМИЗАЦИЯ: Используем Supabase Image Transform для сжатия
                    src={getOptimizedImageUrl(
                      banner.image_url, 
                      isLCP ? 1920 : 1200,
                      isLCP ? 90 : 85,
                      'webp'
                    )}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={isLCP}
                    fetchPriority={isLCP ? "high" : "auto"}
                    loading={isLCP ? "eager" : index < 3 ? "eager" : "lazy"}
                    unoptimized
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

