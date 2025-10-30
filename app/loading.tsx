export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-3xl font-bold tracking-wide">ART × CO</div>
        <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black animate-spin" aria-label="loading" />
      </div>
    </div>
  )
}


