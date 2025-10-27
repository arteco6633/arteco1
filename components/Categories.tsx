interface Category {
  id: number
  name: string
  description?: string
  image_url?: string
}

export default function Categories({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null

  return (
    <section className="py-12 bg-gray-50">
      <div className="container">
        <h2 className="text-3xl font-bold mb-8 text-center">Категории</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold text-lg">{category.name}</h3>
              {category.description && (
                <p className="text-gray-600 text-sm mt-2">{category.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

