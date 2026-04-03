import { useEffect } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenLayout } from '@/components/layout/ScreenLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getWorldById, missionCatalog } from '@/game/content/catalog'
import { useGame } from '@/hooks/useGame'
import { getCompletedLevelIdsForTrack, getResolvedActiveLevelTrack } from '@/services/levelTrackService'

export function MissionSelectionScreen() {
  const navigate = useNavigate()
  const { worldId } = useParams()
  const { currentChildProfile, startMission, unlockedWorlds } = useGame()
  const activeLevelTrack = getResolvedActiveLevelTrack(currentChildProfile)
  const completedLevelIds = getCompletedLevelIdsForTrack(currentChildProfile, activeLevelTrack)
  const world = worldId ? getWorldById(worldId) : undefined

  useEffect(() => {
    if (!world) {
      navigate('/worlds')
    }
  }, [navigate, world])

  if (!world) {
    return null
  }

  const missions = missionCatalog.filter((mission) => mission.worldId === world.id)

  return (
    <ScreenLayout
      actions={
        <Button onClick={() => navigate('/worlds')} variant="secondary">
          חזרה למפה
        </Button>
      }
      eyebrow="בְּחִירַת מְשִׂימָה"
      subtitle={world.description}
      title={world.name}
      tone="sand"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((mission, index) => {
            const previousMission = missions[index - 1]
            const unlockedByProgress =
              !mission.isLocked ||
              !previousMission ||
              completedLevelIds.includes(previousMission.levelId) ||
              false
            const isUnlocked = unlockedWorlds.includes(world.id) && unlockedByProgress

            return (
              <Card
                className="flex h-full flex-col justify-between gap-4"
                key={mission.id}
                style={{ background: `${world.themeGradient}` }}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-4xl">{mission.icon}</p>
                      <h2 className="mt-3 font-display text-3xl text-slate-900">{mission.name}</h2>
                    </div>
                    <span className="rounded-full bg-white/75 px-3 py-2 text-xs font-bold text-slate-600">
                      {mission.difficulty} / 3
                    </span>
                  </div>
                  <p className="text-slate-600">{mission.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-1 text-xl">
                    {Array.from({ length: 3 }, (_, starIndex) => (
                      <span key={starIndex}>{starIndex < mission.difficulty ? '⭐' : '☆'}</span>
                    ))}
                  </div>

                  {isUnlocked ? (
                    <Button
                      className="w-full"
                      onClick={() => {
                        startMission(mission.levelId)
                        navigate(`/game/${mission.levelId}`)
                      }}
                    >
                      אני רוצה לשחק בזה
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[24px] bg-white/80 px-4 py-4 text-sm font-semibold text-slate-600">
                      <Lock className="h-5 w-5" />
                      צריך להשלים את המשימה הקודמת כדי לפָּתוּחַ
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </ScreenLayout>
  )
}
