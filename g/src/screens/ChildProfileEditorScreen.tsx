import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, WandSparkles } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { avatarCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import type { ChildProfile } from '@/types/models'

const starterColors = ['#FFD166', '#7BDFF2', '#CDB4FF', '#A7F3D0']

export function ChildProfileEditorScreen() {
  const navigate = useNavigate()
  const { childId } = useParams()
  const { childProfiles, addChildProfile, updateChildProfile } = useGame()
  const existingProfile = childProfiles.find((profile) => profile.id === childId)
  const [name, setName] = useState(existingProfile?.name ?? '')
  const [age, setAge] = useState(existingProfile?.age.toString() ?? '6')
  const [favoriteSubject, setFavoriteSubject] = useState(existingProfile?.favoriteSubject ?? 'חֶשְׁבּוֹן')
  const [petName, setPetName] = useState(existingProfile?.petName ?? 'טוֹפִי')
  const [bodyColor, setBodyColor] = useState(existingProfile?.avatarSeed.bodyColor ?? starterColors[0])

  useEffect(() => {
    if (!existingProfile && childId) {
      navigate('/profiles')
    }
  }, [childId, existingProfile, navigate])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextProfile: ChildProfile = {
      id: existingProfile?.id ?? `child-${Date.now()}`,
      name: name.trim() || 'חָבֵר חָדָשׁ',
      age: Number(age) || 6,
      level: existingProfile?.level ?? 1,
      favoriteSubject,
      petName,
      completedLevelIds: existingProfile?.completedLevelIds ?? [],
      equippedItems: existingProfile?.equippedItems ?? [],
      avatarSeed: existingProfile?.avatarSeed ?? {
        bodyColor,
        hair: avatarCatalog.hair[0],
        eyes: avatarCatalog.eyes[0],
        outfit: avatarCatalog.clothes[0],
        pet: avatarCatalog.pets[0],
      },
    }

    if (existingProfile) {
      updateChildProfile({
        ...existingProfile,
        ...nextProfile,
      })
    } else {
      addChildProfile(nextProfile)
    }

    navigate(`/avatar-builder/${nextProfile.id}`)
  }

  return (
    <ScreenLayout
      eyebrow="עֲרִיכַת פְּרוֹפִיל"
      subtitle="יוֹצְרִים אוֹ עוֹרְכִים פְּרוֹפִיל יֶלֶד לִפְנֵי בְּחִירַת הַדְּמוּת וְהַתְחָלַת הַמִּשְׂחָק."
      title={existingProfile ? 'עֲרִיכַת פְּרוֹפִיל ילד' : 'יְצִירַת פְּרוֹפִיל חָדָשׁ'}
      tone="sand"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">שם הילד/ה</span>
              <input
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                onChange={(event) => setName(event.target.value)}
                placeholder="לְמָשָׁל: מָאיָה"
                value={name}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">גיל</span>
              <input
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                min="4"
                onChange={(event) => setAge(event.target.value)}
                type="number"
                value={age}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">נושא אהוב</span>
              <select
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                onChange={(event) => setFavoriteSubject(event.target.value)}
                value={favoriteSubject}
              >
                {['חֶשְׁבּוֹן', 'קְרִיאָה', 'אַנְגְּלִית', 'לוֹגִיקָה', 'זִיכָּרוֹן'].map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">שם חיית המחמד</span>
              <input
                className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                onChange={(event) => setPetName(event.target.value)}
                value={petName}
              />
            </label>

            {!existingProfile && (
              <div className="space-y-3">
                <span className="text-sm font-semibold text-slate-600">צבע בסיס לדמות</span>
                <div className="flex flex-wrap gap-3">
                  {starterColors.map((color) => (
                    <button
                      className="h-12 w-12 rounded-full border-4 border-white shadow-sm"
                      key={color}
                      onClick={() => setBodyColor(color)}
                      style={{
                        background: color,
                        outline: color === bodyColor ? '3px solid #1f2a37' : 'none',
                      }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                המשך לבניית אווטאר
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button onClick={() => navigate('/profiles')} type="button" variant="secondary">
                חזרה לפרופילים
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4 bg-[#fff8f2]">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-white text-[#f59e0b] shadow-sm">
            <WandSparkles className="h-8 w-8" />
          </div>
          <h2 className="font-display text-3xl text-slate-900">מה יקרה בשלב הבא?</h2>
          <p className="text-slate-600">
            אחרי שמירת הפרופיל עוברים למסך בְּנִיַּת דְּמוּת. שם בוחרים שֵׂעָר, עֵינַיִם, בְּגָדִים וחיית
            מחמד, ואז ממשיכים ישר למפת העולם.
          </p>
          <div
            className="mx-auto mt-4 flex h-52 w-44 flex-col items-center justify-center rounded-[36px] border border-white/70 shadow-inner"
            style={{ background: `linear-gradient(180deg, ${bodyColor} 0%, #ffffff 100%)` }}
          >
            <div className="text-5xl">🧒</div>
            <p className="mt-4 rounded-full bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700">
              {name || 'חָבֵר חָדָשׁ'}
            </p>
          </div>
        </Card>
      </div>
    </ScreenLayout>
  )
}
