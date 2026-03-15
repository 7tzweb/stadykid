import { useEffect, useRef } from 'react'
import type { Scene } from 'phaser'

import { getLevelTypeMeta } from '@/game/engine/level-registry'
import type { GameLevel } from '@/game/engine/level-schema'

type PhaserRuntime = typeof import('phaser')

function createStageSceneConfig(
  Phaser: PhaserRuntime,
  level: GameLevel,
  meta: { label: string; icon: string; accentColor: string },
) {
  return {
    key: `stage-${level.id}`,
    create(this: Scene) {
      const width = 960
      const height = 420
      const accentColor = Phaser.Display.Color.HexStringToColor(meta.accentColor).color

      const backdrop = this.add.graphics()
      backdrop.fillGradientStyle(0xffffff, 0xffffff, 0xfdf2e8, 0xfff7ed, 0.95)
      backdrop.fillRoundedRect(18, 18, width - 36, height - 36, 32)
      backdrop.lineStyle(3, accentColor, 0.15)
      backdrop.strokeRoundedRect(18, 18, width - 36, height - 36, 32)

      const title = this.add
        .text(width / 2, 90, `${meta.icon} ${level.title}`, {
          fontFamily: 'Secular One, Rubik, sans-serif',
          fontSize: '34px',
          color: '#172033',
        })
        .setOrigin(0.5)

      const subtitle = this.add
        .text(width / 2, 145, level.instructions, {
          fontFamily: 'Rubik, sans-serif',
          fontSize: '22px',
          align: 'center',
          color: '#475569',
          wordWrap: { width: width - 180 },
        })
        .setOrigin(0.5)

      const label = this.add
        .text(width / 2, 210, meta.label, {
          fontFamily: 'Rubik, sans-serif',
          fontSize: '18px',
          color: meta.accentColor,
          backgroundColor: '#ffffff',
          padding: { x: 14, y: 8 },
        })
        .setOrigin(0.5)

      this.tweens.add({
        targets: [title, subtitle, label],
        y: '-=6',
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      for (let index = 0; index < 14; index += 1) {
        const orb = this.add.circle(
          Phaser.Math.Between(70, width - 70),
          Phaser.Math.Between(50, height - 50),
          Phaser.Math.Between(8, 24),
          accentColor,
          0.12,
        )

        this.tweens.add({
          targets: orb,
          y: orb.y - Phaser.Math.Between(16, 48),
          x: orb.x + Phaser.Math.Between(-18, 18),
          alpha: 0.4,
          duration: Phaser.Math.Between(1600, 2800),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      const footer = this.add.graphics()
      footer.fillStyle(accentColor, 0.12)
      footer.fillRoundedRect(96, 292, width - 192, 72, 22)
      footer.lineStyle(2, accentColor, 0.2)
      footer.strokeRoundedRect(96, 292, width - 192, 72, 22)

      this.add
        .text(width / 2, 328, 'מנוע Phaser פעיל כאן כרקע אינטראקטיבי למסך המשחק', {
          fontFamily: 'Rubik, sans-serif',
          fontSize: '18px',
          color: '#334155',
        })
        .setOrigin(0.5)
    },
  }
}

export function PhaserStageCanvas({ level }: { level: GameLevel }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const meta = getLevelTypeMeta(level.type)
    const parent = containerRef.current
    parent.innerHTML = ''
    let isDisposed = false
    let game: { destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null = null

    void import('phaser').then((module) => {
      if (isDisposed) {
        return
      }

      const Phaser = module.default as unknown as PhaserRuntime

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: 960,
        height: 420,
        backgroundColor: 'rgba(0,0,0,0)',
        transparent: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [createStageSceneConfig(Phaser, level, meta)],
      })
    })

    return () => {
      isDisposed = true
      game?.destroy(true)
    }
  }, [level])

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/55 p-3 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="min-h-[220px]" ref={containerRef} />
    </div>
  )
}
