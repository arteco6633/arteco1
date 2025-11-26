import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Загружаем активные шаги квиза с вариантами ответов
    const { data: steps, error: stepsError } = await supabase
      .from('kitchen_quiz_steps')
      .select('*')
      .eq('is_active', true)
      .order('step_number', { ascending: true })

    if (stepsError) throw stepsError

    // Для каждого шага загружаем варианты ответов (если это вопрос типа choice)
    const stepsWithOptions = await Promise.all(
      (steps || []).map(async (step) => {
        if (step.question_type === 'choice') {
          const { data: options, error: optionsError } = await supabase
            .from('kitchen_quiz_options')
            .select('*')
            .eq('step_id', step.id)
            .order('sort_order', { ascending: true })

          if (!optionsError && options) {
            return { ...step, options }
          }
        }
        return step
      })
    )

    return NextResponse.json({
      success: true,
      steps: stepsWithOptions,
    })
  } catch (error: any) {
    console.error('Ошибка загрузки шагов квиза:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка загрузки квиза' },
      { status: 500 }
    )
  }
}




