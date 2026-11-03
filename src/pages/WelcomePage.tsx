import { Link } from 'react-router-dom'
import Still from '@/components/klaket/Still'

// First screen for signed-out visitors: a wall of posters and two ways in.
export default function WelcomePage() {
  return (
    <div className="h-full scroll-container bg-k-ink text-k-paper">
      <div className="min-h-full max-w-md mx-auto flex flex-col">
        <div className="grid grid-cols-3 grid-rows-2 gap-1 p-1 h-[42vh] min-h-[280px] max-h-[380px]" aria-hidden="true">
          <div className="row-span-2 overflow-hidden"><Still kind="smith" /></div>
          <div className="overflow-hidden"><Still kind="tram" /></div>
          <div className="overflow-hidden"><Still kind="koshary" /></div>
          <div className="overflow-hidden"><Still kind="rooftop" /></div>
          <div className="overflow-hidden"><Still kind="mother" /></div>
        </div>

        <div className="relative -mt-5 px-3.5" aria-hidden="true">
          <div className="clap-fixed h-[30px] border-2 border-k-paper -rotate-6 origin-bottom-left" />
          <div className="clap-fixed h-[30px] border-2 border-t-0 border-k-paper" />
        </div>

        <div className="px-4 pt-5 flex flex-col gap-1">
          <h1 className="flex items-baseline gap-3 flex-wrap">
            <span className="k-display text-[64px] leading-[0.85]">KLAKET</span>
            <span lang="ar" className="k-poster text-[50px] leading-[0.9] text-k-mustard">كلاكيت</span>
          </h1>
          <p className="text-[18px] leading-snug mt-2.5 max-w-[30ch]">
            Post your films. Find your crew. One premiere every week.
          </p>
          <div className="grid grid-cols-3 border-[1.5px] border-k-smoke mt-3.5">
            <div className="slate-cell border-e-[1.5px] border-k-smoke text-k-sand">Films<b className="text-k-paper">Student shorts</b></div>
            <div className="slate-cell border-e-[1.5px] border-k-smoke text-k-sand">Vote<b className="text-k-paper">Every week</b></div>
            <div className="slate-cell text-k-sand">Crew<b className="text-k-paper">Call sheets</b></div>
          </div>
        </div>

        <div className="mt-auto px-4 pt-6 pb-8 flex flex-col gap-2 safe-area-bottom">
          <Link
            to="/register"
            className="press flex justify-between items-center min-h-[52px] px-4 bg-k-red text-k-paper font-black text-[16px]"
            style={{ fontStretch: '115%' }}
          >
            <span>CREATE ACCOUNT</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/login"
            className="press flex justify-between items-center min-h-[52px] px-4 border-[1.5px] border-k-paper font-extrabold text-[15px]"
            style={{ fontStretch: '110%' }}
          >
            <span>I HAVE AN ACCOUNT</span>
            <span lang="ar" className="font-arabic font-bold text-[13px]">عندي حساب</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
