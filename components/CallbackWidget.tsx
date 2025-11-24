'use client'

import { useState } from 'react'

export default function CallbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    comment: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Пожалуйста, заполните имя и телефон')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при отправке заявки')
      }

      setIsSuccess(true)
      setFormData({ name: '', phone: '', comment: '' })
      
      // Закрываем форму через 3 секунды после успешной отправки
      setTimeout(() => {
        setIsSuccess(false)
        setIsOpen(false)
      }, 3000)
    } catch (error: any) {
      console.error('Ошибка отправки заявки:', error)
      alert(error.message || 'Не удалось отправить заявку. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Кнопка для открытия формы */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-28 md:bottom-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-black text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Консультация менеджера"
      >
        <svg 
          className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 group-hover:rotate-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {/* Индикатор пульсации */}
        <span className="absolute inset-0 rounded-full bg-black animate-ping opacity-20" />
      </button>

      {/* Форма обратного звонка */}
      {isOpen && (
        <div className="fixed right-4 bottom-44 md:bottom-28 z-50 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 animate-in slide-in-from-bottom-5 duration-300">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Заявка отправлена!</h3>
              <p className="text-sm text-gray-600">Менеджер свяжется с вами в ближайшее время</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Консультация менеджера</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="callback-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ваше имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="callback-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    placeholder="Иван Иванов"
                  />
                </div>
                
                <div>
                  <label htmlFor="callback-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="callback-phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                
                <div>
                  <label htmlFor="callback-comment" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    id="callback-comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none resize-none"
                    placeholder="Укажите удобное время для звонка или тему консультации"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Отправка...</span>
                    </>
                  ) : (
                    'Заказать звонок'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}

