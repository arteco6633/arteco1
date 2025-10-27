interface Product {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  category_id: number
}

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="products-grid">
      {products.map((product) => (
        <div key={product.id} className="product-card">
          <img
            src={product.image_url || '/placeholder.jpg'}
            alt={product.name}
            className="product-image"
          />
          <div className="product-info">
            <h3 className="product-title">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {product.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="product-price">{product.price} ₽</span>
              <button className="btn btn-primary">В корзину</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

