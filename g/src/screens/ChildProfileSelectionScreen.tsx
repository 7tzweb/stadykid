import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Sparkles, UserRoundPen } from 'lucide-react'
import { startTransition } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StepGuide } from '@/components/ui/StepGuide'
import { avatarCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import { getCompletedLevelIdsForTrack, getResolvedActiveLevelTrack } from '@/services/levelTrackService'
import type { ChildProfile } from '@/types/models'

const quickCreateColors = ['#FFD166', '#7BDFF2', '#F9A8D4', '#A7F3D0']

function createQuickChildProfile(name: string, age: number): ChildProfile {
  const normalizedAge = Math.min(12, Math.max(4, age || 6))
  const color = quickCreateColors[(normalizedAge - 4) % quickCreateColors.length]

  return {
    id: `child-${Date.now()}`,
    name: name.trim() || 'חָבֵר חָדָשׁ',
    age: normalizedAge,
    level: 1,
    favoriteSubject: 'חֶשְׁבּוֹן',
    petName: 'טוֹפִי',
    completedLevelIds: [],
    advancedCompletedLevelIds: [],
    activeLevelTrack: 'standard',
    equippedItems: [],
    avatarSeed: {
      bodyColor: color,
      hair: avatarCatalog.hair[0],
      eyes: avatarCatalog.eyes[0],
      outfit: avatarCatalog.clothes[0],
      pet: avatarCatalog.pets[0],
    },
  }
}

export function ChildProfileSelectionScreen() {
  const navigate = useNavigate()
  const { addChildProfile, childProfiles, currentUser, isAdminMode, setCurrentChildProfile } = useGame()
  const [quickName, setQuickName] = useState('')
  const [quickAge, setQuickAge] = useState('6')
  const visibleProfiles = childProfiles.filter((profile) =>
    isAdminMode ? true : profile.name.trim() !== 'חָבֵר חָדָשׁ' && profile.name.trim() !== 'חבר חדש',
  )

  useEffect(() => {
    if (!isAdminMode && !currentUser) {
      navigate('/auth')
    }
  }, [currentUser, isAdminMode, navigate])

  function startWithProfile(profile: ChildProfile) {
    setCurrentChildProfile(profile.id)
    startTransition(() => {
      navigate('/worlds')
    })
  }

  function handleQuickCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextProfile = createQuickChildProfile(quickName, Number(quickAge))

    addChildProfile(nextProfile)
    setQuickName('')
    setQuickAge('6')
    startWithProfile(nextProfile)
  }

  function shouldShowProfileSummary(profile: ChildProfile) {
    if (isAdminMode) {
      return true
    }

    return (
      profile.completedLevelIds.length > 0 ||
      profile.advancedCompletedLevelIds.length > 0 ||
      profile.level > 1
    )
  }

  return (
    <ScreenLayout
      eyebrow="בְּחִירַת יְלָדִים"
      subtitle={
        isAdminMode
          ? 'כָּרֶגַע זֶה מַצָּב דֵּמוֹ עִם פְּרוֹפִילִים לְפִי גִּיל. בַּהֶמְשֵׁךְ פְּרוֹפִילֵי הַיְלָדִים יִשָּׁמְרוּ תַּחַת חֶשְׁבּוֹן Google.'
          : 'אחרי ההתחברות מזינים רק שם וגיל, יוצרים את הילד ונכנסים מיד למשחק.'
      }
      title="מִי יוֹצֵא לַהַרְפַּתְקָה עַכְשָׁיו?"
      tone="mint"
      actions={
        <div className="rounded-full bg-white/75 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          {isAdminMode ? 'מַצָּב אַדְמִין' : currentUser ? `מְחֻבָּר: ${currentUser.name}` : 'יוצר/ת משתמש חדש'}
        </div>
      }
    >
      <div className="space-y-6">
        {isAdminMode ? (
          <StepGuide
            accent="#14b8a6"
            items={[
              {
                title: 'מְחַפְּשִׂים אֶת הַשֵּׁם',
                description: 'כָּל יֶלֶד בּוֹחֵר אֶת הַכַּרְטִיס שֶׁלּוֹ.',
              },
              {
                title: 'לוֹחֲצִים עַל הַכַּפְתּוֹר הַגָּדוֹל',
                description: 'הַכַּפְתּוֹר הַכָּתוֹם מַתְחִיל אֶת הַמִּשְׂחָק.',
              },
              {
                title: 'מַגִּיעִים לַבַּיִת הָרָאשִׁי',
                description: 'משם עוברים לחֲדָרִים, לחֲנוּת או לעוֹלַם הַשְּׁאֵלוֹת.',
              },
            ]}
            title="כָּךְ מַתְחִילִים מִכָּאן"
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {visibleProfiles.map((profile) => (
            <Card className="space-y-4" key={profile.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                  <p className="text-sm text-slate-500">
                    גיל {profile.age} · אוהב/ת {profile.favoriteSubject}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff4e8] px-3 py-2 text-sm font-bold text-[#f26a4b]">
                  רמה {profile.level}
                </span>
              </div>

              {shouldShowProfileSummary(profile) && (
                <div className="rounded-[24px] bg-[#f8fafc] p-4 text-sm text-slate-600">
                  חַיַּת מַחְמָד: <strong>{profile.petName}</strong>
                  <br />
                  שלבים שהושלמו:{' '}
                  <strong>{getCompletedLevelIdsForTrack(profile, getResolvedActiveLevelTrack(profile)).length}</strong>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => startWithProfile(profile)}
                >
                  זה אני, מתחילים
                  <Sparkles className="h-5 w-5" />
                </Button>
                {isAdminMode && (
                  <Button onClick={() => navigate(`/profiles/${profile.id}/edit`)} variant="secondary">
                    עריכה
                    <UserRoundPen className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {isAdminMode && (
            <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4 border-dashed bg-white/55 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#14b8a6] shadow-sm">
                <Plus className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-3xl text-slate-900">להוסיף ילד חדש</h2>
                <p className="text-slate-500">יוצרים פרופיל, בוחרים אווטאר ומתחילים מסלול חדש.</p>
              </div>
              <Button onClick={() => navigate('/profiles/new')}>יוצרים ילד חדש</Button>
            </Card>
          )}
        </div>

        {!isAdminMode && (
          <Card className="bg-white/82">
            <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]" onSubmit={handleQuickCreate}>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">שם הילד/ה</span>
                <input
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                  onChange={(event) => setQuickName(event.target.value)}
                  placeholder="לְמָשָׁל: נוֹעָה"
                  value={quickName}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">גיל</span>
                <input
                  className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 outline-none focus:border-[#f26a4b]"
                  max="12"
                  min="4"
                  onChange={(event) => setQuickAge(event.target.value)}
                  type="number"
                  value={quickAge}
                />
              </label>

              <div className="flex items-end">
                <Button className="w-full lg:min-w-[220px]" type="submit">
                  יוצרים וּמַתְחִילִים
                  <Sparkles className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </ScreenLayout>
  )
}
