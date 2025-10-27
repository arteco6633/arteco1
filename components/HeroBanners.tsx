interface Banner {
  id: number
  title: string
  image_url: string
  link_url?: string
}

export default function HeroBanners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null

  return (
    <section className="py-6">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-lg overflow-hidden shadow-md">
              {banner.link_url ? (
                <a href={banner.link_url}>
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform"
                  />
                </a>
              ) : (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

