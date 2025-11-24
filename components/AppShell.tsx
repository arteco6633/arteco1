'use client'

import { PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageLoader from '@/components/PageLoader'
import MobileBottomNav from '@/components/MobileBottomNav'
import CartDrawer from '@/components/CartDrawer'
import CallbackWidget from '@/components/CallbackWidget'
import { Suspense } from 'react'

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const isCRM = pathname?.startsWith('/crm')
  const isAdmin = pathname?.startsWith('/admin')

  // Для CRM и админ-панели не показываем Navbar и Footer
  if (isCRM || isAdmin) {
    return (
      <div className="w-full">
        <Suspense fallback={<div className="min-h-[50vh] w-full grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="text-3xl font-bold tracking-wide">ART × CO</div><div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" /></div></div>}>
          {children}
        </Suspense>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto w-full px-1 md:px-2 xl:px-4 2xl:px-6">
        <Navbar />
        <PageLoader />
        <Suspense fallback={<div className="min-h-[50vh] w-full grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="text-3xl font-bold tracking-wide">ART × CO</div><div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" /></div></div>}>
          {children}
        </Suspense>
      </div>
      <footer className="bg-gray-900 text-white py-10 mt-0">
        <div className="w-full max-w-[1680px] 2xl:max-w-[1880px] mx-auto px-4 md:px-6 xl:px-8 2xl:px-10">
          <div className="text-center text-sm sm:text-base font-light tracking-wide">
            <p className="break-words">&copy; 2025 ARTECO. Все права защищены.</p>
          </div>
        </div>
      </footer>
      <MobileBottomNav />
      <CartDrawer />
      <CallbackWidget />
    </div>
  )
}


