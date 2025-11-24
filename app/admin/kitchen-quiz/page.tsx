'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

interface QuizStep {
  id: number
  quiz_id: number
  step_number: number
  title: string
  question_type: string
  is_active: boolean
  sort_order: number
  options?: QuizOption[]
}

interface QuizOption {
  id: number
  step_id: number
  label: string
  image_url: string | null
  value: string
  sort_order: number
}

export default function AdminKitchenQuizPage() {
  const [steps, setSteps] = useState<QuizStep[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStep, setEditingStep] = useState<QuizStep | null>(null)
  const [selectedImageFiles, setSelectedImageFiles] = useState<Record<string, File>>({})
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    step_number: '',
    title: '',
    question_type: 'choice',
    is_active: true,
    options: [] as Array<{ label: string; value: string; image_url: string; tempId?: number }>,
  })

  useEffect(() => {
    loadSteps()
  }, [])

  async function loadSteps() {
    try {
      setLoading(true)
      const { data: stepsData, error: stepsError } = await supabase
        .from('kitchen_quiz_steps')
        .select('*')
        .order('step_number', { ascending: true })

      if (stepsError) throw stepsError

      // Загружаем варианты для каждого шага
      const stepsWithOptions = await Promise.all(
        (stepsData || []).map(async (step) => {
          const { data: optionsData } = await supabase
            .from('kitchen_quiz_options')
            .select('*')
            .eq('step_id', step.id)
            .order('sort_order', { ascending: true })

          return { ...step, options: optionsData || [] }
        })
      )

      setSteps(stepsWithOptions)
    } catch (error) {
      console.error('Ошибка загрузки шагов квиза:', error)
      alert('Ошибка загрузки шагов квиза')
    } finally {
      setLoading(false)
    }
  }

  async function uploadImage(file: File, stepId: number, optionIndex: number): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `kitchen-quiz/${stepId}/${optionIndex}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error: any) {
      console.error('Ошибка загрузки изображения:', error)
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)

    try {
      const stepData = {
        quiz_id: 1,
        step_number: parseInt(formData.step_number),
        title: formData.title,
        question_type: formData.question_type,
        is_active: formData.is_active,
      }

      let stepId: number

      if (editingStep) {
        // Обновление существующего шага
        const { data, error } = await supabase
          .from('kitchen_quiz_steps')
          .update(stepData)
          .eq('id', editingStep.id)
          .select()
          .single()

        if (error) throw error
        stepId = editingStep.id

        // Удаляем старые варианты
        await supabase.from('kitchen_quiz_options').delete().eq('step_id', stepId)
      } else {
        // Создание нового шага
        const { data, error } = await supabase
          .from('kitchen_quiz_steps')
          .insert([stepData])
          .select()
          .single()

        if (error) throw error
        stepId = data.id
      }

      // Загружаем изображения и создаем варианты
      const optionsToInsert = await Promise.all(
        formData.options.map(async (option, index) => {
          let imageUrl = option.image_url

          // Загружаем новое изображение, если есть
          const fileKey = `${stepId}-${option.tempId || index}`
          if (selectedImageFiles[fileKey]) {
            imageUrl = await uploadImage(selectedImageFiles[fileKey], stepId, index)
          }

          return {
            step_id: stepId,
            label: option.label,
            value: option.value,
            image_url: imageUrl || null,
            sort_order: index,
          }
        })
      )

      if (optionsToInsert.length > 0) {
        const { error: optionsError } = await supabase
          .from('kitchen_quiz_options')
          .insert(optionsToInsert)

        if (optionsError) throw optionsError
      }

      alert('Шаг квиза успешно сохранен!')
      setShowModal(false)
      resetForm()
      loadSteps()
    } catch (error: any) {
      console.error('Ошибка сохранения шага:', error)
      alert(`Ошибка: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  function resetForm() {
    setFormData({
      step_number: '',
      title: '',
      question_type: 'choice',
      is_active: true,
      options: [],
    })
    setEditingStep(null)
    setSelectedImageFiles({})
  }

  function openEditModal(step: QuizStep) {
    setEditingStep(step)
    setFormData({
      step_number: step.step_number.toString(),
      title: step.title,
      question_type: step.question_type,
      is_active: step.is_active,
      options:
        step.options?.map((opt, idx) => ({
          label: opt.label,
          value: opt.value,
          image_url: opt.image_url || '',
          tempId: idx,
        })) || [],
    })
    setShowModal(true)
  }

  function addOption() {
    setFormData({
      ...formData,
      options: [...formData.options, { label: '', value: '', image_url: '' }],
    })
  }

  function removeOption(index: number) {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  function updateOption(index: number, field: string, value: string) {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData({ ...formData, options: newOptions })
  }

  function handleImageSelect(stepId: number, optionIndex: number, file: File | null) {
    if (file) {
      setSelectedImageFiles({ ...selectedImageFiles, [`${stepId}-${optionIndex}`]: file })
    }
  }

  async function deleteStep(stepId: number) {
    if (!confirm('Вы уверены, что хотите удалить этот шаг? Все варианты ответов также будут удалены.')) {
      return
    }

    try {
      const { error } = await supabase.from('kitchen_quiz_steps').delete().eq('id', stepId)
      if (error) throw error

      alert('Шаг успешно удален!')
      loadSteps()
    } catch (error: any) {
      console.error('Ошибка удаления шага:', error)
      alert(`Ошибка: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Назад в админ-панель
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Управление квизом Kitchen Matchmaker</h1>
            <p className="text-gray-600 mt-1">Редактирование шагов квиза и вариантов ответов</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Добавить шаг
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {steps.map((step) => (
              <div key={step.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-500">Шаг {step.step_number}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          step.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {step.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Тип: {step.question_type === 'choice' ? 'Выбор варианта' : 'Текстовое поле'}</p>
                    {step.options && step.options.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {step.options.map((option) => (
                          <div key={option.id} className="border rounded-lg overflow-hidden">
                            {option.image_url && (
                              <div className="relative w-full h-32 bg-gray-100">
                                <Image src={option.image_url} alt={option.label} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-sm font-medium truncate">{option.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(step)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteStep(step.id)}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Модальное окно для редактирования/создания шага */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">
                  {editingStep ? 'Редактировать шаг' : 'Добавить новый шаг'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Номер шага <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.step_number}
                      onChange={(e) => setFormData({ ...formData, step_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Тип вопроса
                    </label>
                    <select
                      value={formData.question_type}
                      onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="choice">Выбор варианта</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Заголовок шага <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Выберите форму кухни"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Шаг активен
                  </label>
                </div>

                {/* Варианты ответов */}
                {formData.question_type === 'choice' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Варианты ответов</label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        + Добавить вариант
                      </button>
                    </div>
                    {formData.options.map((option, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Название варианта
                            </label>
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => updateOption(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                              placeholder="Прямая"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Значение
                            </label>
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) => updateOption(index, 'value', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                              placeholder="straight"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Изображение
                          </label>
                          <div className="flex items-center gap-3">
                            {option.image_url && (
                              <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                <Image src={option.image_url} alt="" fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleImageSelect(editingStep?.id || 0, index, file)
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    updateOption(index, 'image_url', reader.result as string)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Удалить вариант
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

