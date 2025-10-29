import Link from 'next/link'

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url: string | null
}

export default function Categories({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null

  return (
    <section className="pt-12 pb-2 overflow-x-hidden max-w-full">
      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 max-w-full">
        <div className="md:hidden flex items-center gap-2 text-gray-500 text-sm px-0 mb-3">
          <span>Прокрутите категории</span>
          <span className="inline-block animate-pulse">→</span>
        </div>
        <div className="x-scroll-guard w-full max-w-full">
          <div className="flex gap-4 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory px-0 no-scrollbar max-w-full">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="text-center hover:opacity-80 transition-opacity flex-none w-[260px] sm:w-[300px] snap-start sm:flex-1 sm:min-w-0 sm:snap-none"
            >
              {category.image_url ? (
                <div className="mb-3 aspect-square">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="mb-3 aspect-square flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="text-7xl">📦</span>
                </div>
              )}
              <h3 className="font-semibold text-lg">{category.name}</h3>
              {category.description && (
                <p className="sr-only">{category.description}</p>
              )}
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}

