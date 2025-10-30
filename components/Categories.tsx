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
      <div className="max-w-[1680px] 2xl:max-w-none mx-auto px-4 md:px-2 xl:px-4 2xl:px-6 max-w-full">
        <div className="md:hidden flex items-center gap-2 text-gray-500 text-sm px-0 mb-3">
          <span>Прокрутите категории</span>
          <span className="inline-block animate-pulse">→</span>
        </div>
        {/* Ширина дорожки ровно равна ширине вьюпорта, независимо от паддингов контейнера */}
        <div className="relative md:static left-1/2 right-1/2 md:left-auto md:right-auto -ml-[50vw] -mr-[50vw] md:ml-0 md:mr-0 w-screen md:w-full px-4 md:px-0 overflow-x-hidden">
          <div className="flex gap-4 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar w-screen md:w-full touch-pan-y overscroll-x-none">
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

