import { useEffect, useState } from 'react'
import { Dices, Sparkles } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepGuide } from '@/components/ui/StepGuide'
import { avatarCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import type { AvatarSelection } from '@/types/models'

const bodyColors = ['#FFD166', '#7BDFF2', '#CDB4FF', '#FBCFE8', '#A7F3D0']
const avatarTabs = [
  { id: 'hair', label: 'שֵׂעָר' },
  { id: 'eyes', label: 'עֵינַיִם' },
  { id: 'clothes', label: 'בְּגָדִים' },
  { id: 'pets', label: 'חַיַּת מַחְמָד' },
] as const

type AvatarTab = (typeof avatarTabs)[number]['id']

export function AvatarBuilderScreen() {
  const navigate = useNavigate()
  const { childId } = useParams()
  const { childProfiles, updateAvatar, setCurrentChildProfile } = useGame()
  const profile = childProfiles.find((entry) => entry.id === childId)
  const [activeTab, setActiveTab] = useState<AvatarTab>('hair')
  const [avatarSeed, setAvatarSeed] = useState<AvatarSelection>(
    profile?.avatarSeed ?? {
      bodyColor: bodyColors[0],
      hair: avatarCatalog.hair[0],
      eyes: avatarCatalog.eyes[0],
      outfit: avatarCatalog.clothes[0],
      pet: avatarCatalog.pets[0],
    },
  )

  useEffect(() => {
    if (!profile) {
      navigate('/profiles')
    }
  }, [navigate, profile])

  if (!profile) {
    return null
  }

  const activeOptions =
    activeTab === 'hair'
      ? avatarCatalog.hair
      : activeTab === 'eyes'
        ? avatarCatalog.eyes
        : activeTab === 'clothes'
          ? avatarCatalog.clothes
          : avatarCatalog.pets

  function assignOption(option: string) {
    setAvatarSeed((current) => {
      if (activeTab === 'hair') {
        return { ...current, hair: option }
      }

      if (activeTab === 'eyes') {
        return { ...current, eyes: option }
      }

      if (activeTab === 'clothes') {
        return { ...current, outfit: option }
      }

      return { ...current, pet: option }
    })
  }

  function randomizeAvatar() {
    setAvatarSeed({
      bodyColor: bodyColors[Math.floor(Math.random() * bodyColors.length)],
      hair: avatarCatalog.hair[Math.floor(Math.random() * avatarCatalog.hair.length)],
      eyes: avatarCatalog.eyes[Math.floor(Math.random() * avatarCatalog.eyes.length)],
      outfit: avatarCatalog.clothes[Math.floor(Math.random() * avatarCatalog.clothes.length)],
      pet: avatarCatalog.pets[Math.floor(Math.random() * avatarCatalog.pets.length)],
    })
  }

  return (
    <ScreenLayout
      eyebrow="בְּנִיַּת דְּמוּת"
      subtitle="בּוֹחֲרִים אֵיךְ הַדְּמוּת נִרְאֵית וְאָז מַמְשִׁיכִים יָשָׁר לְמַפַּת הַמִּשְׂחָקִים."
      title={`בְּנִיַּת דְּמוּת עבור ${profile.name}`}
      tone="lilac"
    >
      <div className="space-y-6">
        <StepGuide
          accent="#8b5cf6"
          items={[
            {
              title: 'בּוֹחֲרִים קָטֵגוֹרְיָה',
              description: 'שֵׂעָר, עֵינַיִם, בְּגָדִים או חַיַּת מַחְמָד.',
            },
            {
              title: 'לוֹחֲצִים עַל מַה שֶׁאוֹהֲבִים',
              description: 'כָּל לְחִיצָה מְשַׁנָּה מִיָּד אֶת הַדְּמוּת.',
            },
            {
              title: 'מְסַיְּמִים וּמַמְשִׁיכִים',
              description: 'בַּסּוֹף לוֹחֲצִים עַל הַכַּפְתּוֹר לְהַתְחָלַת הַהַרְפַּתְקָה.',
            },
          ]}
          title="אֵיךְ בּוֹנִים אֶת הַדְּמוּת?"
        />

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-slate-500">תצוגה מקדימה</p>
                <h2 className="font-display text-3xl text-slate-900">הדמות שלך</h2>
              </div>
              <Button onClick={randomizeAvatar} size="md" variant="secondary">
                <Dices className="h-5 w-5" />
                ערבוב מהיר
              </Button>
            </div>

            <div className="rounded-[32px] bg-[#faf5ff] p-6 text-center">
              <div
                className="mx-auto flex h-72 w-56 flex-col items-center justify-center rounded-[40px] border border-white/80 shadow-inner"
                style={{ background: `linear-gradient(180deg, ${avatarSeed.bodyColor} 0%, #ffffff 100%)` }}
              >
                <div className="text-6xl">🧒</div>
                <div className="mt-6 space-y-2">
                  <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700">
                    {avatarSeed.hair}
                  </p>
                  <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700">
                    {avatarSeed.eyes}
                  </p>
                  <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700">
                    {avatarSeed.outfit}
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                חַיַּת מַחְמָד נבחרת: {avatarSeed.pet}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600">צבע גוף</p>
              <div className="flex flex-wrap gap-3">
                {bodyColors.map((color) => (
                  <button
                    className="h-12 w-12 rounded-full border-4 border-white shadow-sm"
                    key={color}
                    onClick={() => setAvatarSeed((current) => ({ ...current, bodyColor: color }))}
                    style={{
                      background: color,
                      outline: avatarSeed.bodyColor === color ? '3px solid #312e81' : 'none',
                    }}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {avatarTabs.map((tab) => (
                <button
                  className={`rounded-[22px] px-4 py-3 text-sm font-semibold transition ${
                    activeTab === tab.id ? 'bg-[#8b5cf6] text-white' : 'bg-[#f8fafc] text-slate-600'
                  }`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {activeOptions.map((option) => (
                <button
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-right transition hover:border-[#8b5cf6] hover:bg-[#faf5ff]"
                  key={option}
                  onClick={() => assignOption(option)}
                  type="button"
                >
                  <p className="text-lg font-bold text-slate-900">{option}</p>
                  <p className="text-sm text-slate-500">לחיצה אחת מעדכנת את התצוגה המקדימה</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-3">
              <Button
                onClick={() => {
                  updateAvatar(profile.id, avatarSeed)
                  setCurrentChildProfile(profile.id)
                  navigate('/worlds')
                }}
              >
                שומרים ומַתְחִילִים לְשַׂחֵק
              </Button>
              <Button onClick={() => navigate('/profiles')} variant="secondary">
                חזרה לפרופילים
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </ScreenLayout>
  )
}
