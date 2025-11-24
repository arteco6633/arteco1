'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

type Props = {
  isOpen?: boolean
  open?: boolean  // Альтернативное имя для совместимости
  onClose: () => void
}

interface QuizStep {
  id: number
  step_number: number
  title: string
  question_type: string
  options?: QuizOption[]
}

interface QuizOption {
  id: number
  label: string
  image_url?: string | null
  value: string
}

export default function KitchenMatchmakerQuiz({ isOpen, open, onClose }: Props) {
  const isOpenState = isOpen !== undefined ? isOpen : (open !== undefined ? open : false)
  const [step, setStep] = useState(1)
  const [steps, setSteps] = useState<QuizStep[]>([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpenState) {
      loadQuizSteps()
    }
  }, [isOpenState])

  async function loadQuizSteps() {
    try {
      setLoading(true)
      const response = await fetch('/api/kitchen-quiz/steps')
      const data = await response.json()
      if (data.success) {
        setSteps(data.steps || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки шагов квиза:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = steps.length + 1 // +1 для формы контактов
  const isContactForm = step > steps.length
  const currentStep = isContactForm ? null : steps.find(s => s.step_number === step)

  const handleAnswer = (value: string) => {
    if (currentStep) {
      const stepKey = `step_${currentStep.id}`
      setAnswers({ ...answers, [stepKey]: value })
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    // Для формы контактов (последний шаг) проверяем обязательные поля
    if (isContactForm) {
      return formData.name.trim() !== '' && 
             formData.phone.trim() !== '' && 
             formData.email.trim() !== '' &&
             /^\+?\d[\d\s\-()]{9,}$/.test(formData.phone.replace(/\D/g, '')) &&
             /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    }
    
    // Для остальных шагов проверяем, что выбран ответ
    if (!currentStep) return false
    const stepKey = `step_${currentStep.id}`
    return answers[stepKey] !== undefined && answers[stepKey] !== null && answers[stepKey] !== ''
  }

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 1) formatted = `+${digits[0]} ${digits.slice(1)}`
    if (digits.length >= 4) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4)}`
    if (digits.length >= 7) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
    if (digits.length >= 9) formatted = `+${digits[0]} (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9,11)}`
    setFormData({ ...formData, phone: formatted })
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setSubmitting(true)
    try {
      const payload = {
        answers,
        ...formData,
      }

      const response = await fetch('/api/kitchen-quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        alert('Спасибо! Мы получили вашу заявку и скоро свяжемся с вами.')
        onClose()
        // Сброс формы
        setStep(1)
        setAnswers({})
        setFormData({ name: '', phone: '', email: '', city: '', comment: '' })
      } else {
        alert(data.message || 'Ошибка отправки. Попробуйте позже.')
      }
    } catch (error) {
      console.error('Ошибка отправки заявки:', error)
      alert('Ошибка сети. Попробуйте позже.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpenState) return null

  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        {/* Прогресс-бар */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Заголовок */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isContactForm ? 'Заполните данные' : (currentStep?.title || 'Квиз подбора кухни')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Шаг {step} / {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Загрузка квиза...</div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {isContactForm ? (
                /* Форма контактов (последний шаг) */
                <motion.div
                  key="contact-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 max-w-2xl mx-auto"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Ваше имя <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Город
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                        placeholder="Москва"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Телефон <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                        placeholder="ivan@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Комментарий
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none resize-none"
                      placeholder="Дополнительная информация..."
                    />
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      id="consent"
                      defaultChecked
                      className="mt-1"
                    />
                    <label htmlFor="consent">
                      Я согласен на обработку <strong>персональных данных</strong> и принимаю условия <strong>публичной оферты</strong>
                    </label>
                  </div>
                </motion.div>
              ) : currentStep ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Вопросы с вариантами ответов */}
                  {currentStep.question_type === 'choice' && currentStep.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentStep.options.map((option) => {
                        const stepKey = `step_${currentStep.id}`
                        const isSelected = answers[stepKey] === option.value
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleAnswer(option.value)
                            }}
                            className={`relative border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                              isSelected
                                ? 'border-black ring-2 ring-black/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {option.image_url && (
                              <div className="relative w-full h-48 bg-gray-100">
                                <Image
                                  src={option.image_url}
                                  alt={option.label}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{option.label}</span>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    isSelected
                                      ? 'border-black bg-black'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}
        </div>

        {/* Навигация */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-4">
          <button
            disabled={step === 1}
            onClick={handleBack}
            className="px-5 py-2.5 rounded-full border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Назад
          </button>
          {!isContactForm ? (
            <button
              disabled={!canProceed()}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Далее
            </button>
          ) : (
            <button
              disabled={!canProceed() || submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-full bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

