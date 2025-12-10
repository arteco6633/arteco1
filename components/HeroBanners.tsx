'use client'

import Image from 'next/image'
import Link from 'next/link'

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
          {banners.map((banner, index) => (
            <div key={banner.id} className="rounded-lg overflow-hidden shadow-md relative h-44 sm:h-48">
              {banner.link_url ? (
                <Link href={banner.link_url}>
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform"
                    loading={index < 3 ? "eager" : "lazy"}
                    unoptimized
                  />
                </Link>
              ) : (
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                  unoptimized
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

