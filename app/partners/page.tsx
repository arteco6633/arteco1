'use client'

import Link from 'next/link'

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-1 md:px-2 xl:px-4 2xl:px-6 py-8 md:py-12">
        {/* Заголовок */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Партнерская программа ARTECO</h1>
          <p className="text-lg md:text-xl text-gray-600">Развивайте свой бизнес вместе с нами</p>
        </div>

        {/* Хлебные крошки */}
        <nav className="flex mb-6 md:mb-8 text-xs sm:text-sm text-gray-500 flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-gray-700">Главная</Link>
          <span>/</span>
          <span className="text-gray-900">Партнерам</span>
        </nav>

        {/* Секция 1: Архитекторы и дизайнеры */}
        <section className="mb-12 md:mb-16">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                <span className="text-2xl md:text-3xl">🎨</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Для архитекторов и дизайнеров</h2>
                <p className="text-base md:text-lg text-gray-700 mb-4">
                  Рекомендуйте нашу мебель своим клиентам и получайте комиссию с каждого заказа
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-4">💰 Комиссия 10%</h3>
                <p className="text-gray-600 mb-4">
                  Получайте 10% комиссии с каждого заказа, который вы привели. Выплаты производятся ежемесячно.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Прозрачная система учета</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Автоматические выплаты</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Отслеживание в личном кабинете</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-4">🤝 Сопровождение клиента</h3>
                <p className="text-gray-600 mb-4">
                  Мы полностью сопровождаем вашего клиента на каждом этапе заказа
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Консультации и помощь в выборе</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Замеры и проектирование</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Доставка и сборка</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Гарантийное обслуживание</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 md:mt-8">
              <button className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold text-base md:text-lg">
                Стать партнером
              </button>
            </div>
          </div>
        </section>

        {/* Секция 2: Личный кабинет партнера */}
        <section className="mb-12 md:mb-16">
          <div className="bg-white border-2 border-gray-200 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                <span className="text-2xl md:text-3xl">👤</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Личный кабинет партнера</h2>
                <p className="text-base md:text-lg text-gray-700">
                  Отслеживайте статус заказов ваших клиентов в реальном времени
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Статистика</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Просматривайте количество привлеченных клиентов, объем продаж и начисленные комиссии
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Статусы заказов</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Отслеживайте статус каждого заказа: от оформления до доставки и сборки
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-4">💳</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Выплаты</h3>
                <p className="text-gray-600 text-sm md:text-base">
                  История выплат комиссий, начислений и детализация по каждому заказу
                </p>
              </div>
            </div>

            <div className="mt-6 md:mt-8">
              <Link href="/partners/login" className="inline-block w-full md:w-auto px-8 py-4 bg-black text-white rounded-[50px] hover:bg-gray-800 transition-colors font-semibold text-base md:text-lg text-center">
                Войти в личный кабинет
              </Link>
            </div>
          </div>
        </section>

        {/* Секция 3: Производители */}
        <section className="mb-12 md:mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <span className="text-2xl md:text-3xl">🏭</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Для производителей</h2>
                <p className="text-base md:text-lg text-gray-700">
                  Продавайте свою продукцию через ARTECO и расширяйте охват аудитории
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-4">📈 Увеличение продаж</h3>
                <p className="text-gray-600 mb-4">
                  Получите доступ к нашей базе клиентов и увеличивайте объемы продаж
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Широкая аудитория покупателей</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Профессиональная маркетинговая поддержка</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Продвижение вашего бренда</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <h3 className="text-xl md:text-2xl font-semibold mb-4">⚙️ Удобная интеграция</h3>
                <p className="text-gray-600 mb-4">
                  Мы организуем все процессы: от размещения товаров до доставки клиентам
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Простая система загрузки товаров</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Автоматизация заказов</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>Прозрачная отчетность</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 md:mt-8">
              <button className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-[50px] hover:bg-blue-700 transition-colors font-semibold text-base md:text-lg">
                Стать партнером-производителем
              </button>
            </div>
          </div>
        </section>

        {/* Секция 4: Риелторы, застройщики и прорабы */}
        <section className="mb-12 md:mb-16">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12">
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                <span className="text-2xl md:text-3xl">🏗️</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Для риелторов, застройщиков и прорабов</h2>
                <p className="text-base md:text-lg text-gray-700">
                  Предлагайте готовые решения по меблировке для ваших клиентов
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-4">🏠</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Для риелторов</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">
                  Предлагайте меблировку новым владельцам квартир и получайте комиссию
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Комплексные решения</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Специальные условия</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-4">🏢</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Для застройщиков</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">
                  Меблируйте квартиры в новостройках и увеличивайте стоимость объектов
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Оптовые цены</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Сроки поставки</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-4">🔨</div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">Для прорабов</h3>
                <p className="text-gray-600 text-sm md:text-base mb-4">
                  Рекомендуйте мебель для ремонта и получайте вознаграждение
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Партнерские цены</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">✓</span>
                    <span>Гибкие условия</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 md:mt-8">
              <button className="w-full md:w-auto px-8 py-4 bg-orange-600 text-white rounded-[50px] hover:bg-orange-700 transition-colors font-semibold text-base md:text-lg">
                Стать партнером
              </button>
            </div>
          </div>
        </section>

        {/* Контакты */}
        <section className="bg-black text-white rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Хотите стать партнером?</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            Свяжитесь с нами для обсуждения условий сотрудничества
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+79999999999" 
              className="px-8 py-4 bg-white text-black rounded-[50px] hover:bg-gray-100 transition-colors font-semibold text-base md:text-lg"
            >
              📞 Позвонить
            </a>
            <a 
              href="mailto:partners@arteco.ru" 
              className="px-8 py-4 border-2 border-white text-white rounded-[50px] hover:bg-white hover:text-black transition-colors font-semibold text-base md:text-lg"
            >
              ✉️ Написать
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

