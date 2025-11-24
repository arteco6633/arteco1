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
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-lg overflow-hidden shadow-md">
              {banner.link_url ? (
                <a href={banner.link_url}>
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-44 sm:h-48 object-cover hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-44 sm:h-48 object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

