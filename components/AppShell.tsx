'use client'

import { PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageLoader from '@/components/PageLoader'
import MobileBottomNav from '@/components/MobileBottomNav'
import CartDrawer from '@/components/CartDrawer'
import { Suspense } from 'react'

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const isCRM = pathname?.startsWith('/crm')

  if (isCRM) {
    return (
      <div className="w-full">
        <Suspense fallback={<div className="min-h-[50vh] w-full grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="text-3xl font-bold tracking-wide">ART × CO</div><div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" /></div></div>}>
          {children}
        </Suspense>
      </div>
    )
  }

  return (
    <div className="max-w-[1680px] 2xl:max-w-[1880px] mx-auto w-full overflow-x-hidden px-1 md:px-2 xl:px-4 2xl:px-6">
      <Navbar />
      <PageLoader />
      <Suspense fallback={<div className="min-h-[50vh] w-full grid place-items-center"><div className="flex flex-col items-center gap-4"><div className="text-3xl font-bold tracking-wide">ART × CO</div><div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" /></div></div>}>
        {children}
      </Suspense>
      <footer className="bg-gray-800 text-white py-8 mt-12 overflow-x-hidden w-full max-w-full clip-x">
        <div className="w-full max-w-[1400px] 2xl:max-w-none mx-auto px-4 md:px-3 xl:px-6 2xl:px-9 overflow-x-hidden">
          <div className="text-center">
            <p className="break-words">&copy; 2025 ARTECO. Все права защищены.</p>
          </div>
        </div>
      </footer>
      <MobileBottomNav />
      <CartDrawer />
    </div>
  )
}


