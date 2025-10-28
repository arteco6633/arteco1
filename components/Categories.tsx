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
    <section className="pt-12 pb-2">
      <div className="max-w-[1400px] mx-auto px-3">
        <div className="md:hidden flex items-center gap-2 text-gray-500 text-sm px-1 mb-3">
          <span>Прокрутите категории</span>
          <span className="inline-block animate-pulse">→</span>
        </div>
        <div className="flex gap-5 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory px-1 sm:px-0 no-scrollbar">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog/${category.slug}`}
              className="text-center hover:opacity-80 transition-opacity flex-none w-[300px] snap-start sm:flex-1 sm:w-auto sm:min-w-0 sm:snap-none"
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
    </section>
  )
}

