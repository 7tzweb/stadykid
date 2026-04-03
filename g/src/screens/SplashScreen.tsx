import { ArrowLeft, Lock, Sparkles, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepGuide } from '@/components/ui/StepGuide'
import { useGame } from '@/hooks/useGame'

export function SplashScreen() {
  const navigate = useNavigate()
  const { currentUser, experienceMode } = useGame()

  return (
    <ScreenLayout contentClassName="flex flex-col justify-between" tone="sunrise">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-3 rounded-full bg-white/75 px-4 py-3 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f26a4b] text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-2xl text-slate-900">עולם החכמה</p>
            <p className="text-sm text-slate-500">מסע משחקי לילדים ולהורים</p>
          </div>
        </div>

        <div className="rounded-full bg-white/75 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {currentUser ? `מְחֻבָּר: ${currentUser.name}` : 'מוּכָן לְהַתְחָלַת מִשְׂחָק'}
        </div>
      </header>

      <main className="grid flex-1 items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600">
              <Star className="h-4 w-4 text-[#f59e0b]" />
              פלטפורמת משחקים לימודית מבוססת JSON
            </p>
            <h1 className="font-display text-5xl leading-[0.98] text-slate-900 sm:text-7xl">
              עולם צבעוני של
              <br />
              למידה והרפתקה
            </h1>
            <p className="max-w-xl text-lg text-slate-600 sm:text-xl">
              בּוֹחֲרִים יֶלֶד, נכנסים לעולם, לוחצים על משחק ומתחילים ללמוד דרך משימות קצרות וברורות.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="min-w-[220px]"
              onClick={() => navigate(experienceMode === 'player' && !currentUser ? '/auth' : '/profiles')}
            >
              מַתְחִילִים לְשַׂחֵק
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate('/auth')} variant="secondary">
              כניסה עם חֶשְׁבּוֹן
            </Button>
            <Button onClick={() => navigate('/parent-gate')} variant="secondary">
              אֵזוֹר הוֹרִים
              <Lock className="h-5 w-5" />
            </Button>
          </div>

          <StepGuide
            accent="#f26a4b"
            items={[
              {
                title: 'בּוֹחֲרִים יֶלֶד',
                description: 'לוֹחֲצִים עַל הַכַּרְטִיס עִם הַשֵּׁם שֶׁלָּכֶם.',
              },
              {
                title: 'בּוֹחֲרִים עוֹלָם',
                description: 'נכנסים לעולם פָּתוּחַ עם ציור גדול וצבעוני.',
              },
              {
                title: 'מַתְחִילִים לְשַׂחֵק',
                description: 'לוֹחֲצִים עַל הַמְּשִׂימָה שֶׁרוֹצִים וּמְשַׂחֲקִים.',
              },
            ]}
            title="שְׁלוֹשָׁה צְעָדִים פְּשׁוּטִים לְהַתְחָלָה"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: '5 עוֹלָמוֹת', subtitle: 'מספרים, קְרִיאָה, אַנְגְּלִית, לוֹגִיקָה וזִיכָּרוֹן' },
              { title: '4 סוּגֵי מִשְׂחָק', subtitle: 'בחירה, גרירה, התאמה וכרטיסי זִיכָּרוֹן' },
              { title: 'שמירת הִתְקַדְּמוּת', subtitle: 'הַמִּשְׂחָק זוֹכֵר פְּרוֹפִילִים, פְּרָסִים וּשְׁלָבִים' },
            ].map((item) => (
              <Card className="rounded-[24px] p-4" key={item.title}>
                <p className="font-display text-2xl text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-xl items-end justify-center gap-4 py-6">
          {[
            { name: 'מִינִי', color: '#FFD166', size: 'h-40 w-32', delay: '0s' },
            { name: 'זוּם', color: '#7BDFF2', size: 'h-56 w-40', delay: '0.5s' },
            { name: 'נוֹבָה', color: '#CDB4FF', size: 'h-44 w-36', delay: '1s' },
          ].map((friend) => (
            <div
              className="float-soft relative flex flex-col items-center gap-3 rounded-[36px] border border-white/60 bg-white/75 p-4 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
              key={friend.name}
              style={{ animationDelay: friend.delay }}
            >
              <div
                className={`relative ${friend.size} rounded-[32px] shadow-inner`}
                style={{ background: `linear-gradient(180deg, ${friend.color} 0%, #ffffff 100%)` }}
              >
                <div className="absolute inset-x-6 top-8 h-4 rounded-full bg-slate-900/10" />
                <div className="absolute left-8 top-16 h-5 w-5 rounded-full bg-slate-900" />
                <div className="absolute right-8 top-16 h-5 w-5 rounded-full bg-slate-900" />
                <div className="absolute inset-x-10 bottom-12 h-6 rounded-full bg-white/50" />
              </div>
              <p className="font-bold text-slate-800">{friend.name}</p>
            </div>
          ))}
        </div>
      </main>
    </ScreenLayout>
  )
}
