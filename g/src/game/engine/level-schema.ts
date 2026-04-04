import { z } from 'zod'

export const levelTypeSchema = z.enum([
  'multiple_choice',
  'drag_and_drop',
  'match_pairs',
  'memory_cards',
])

export const levelDifficultySchema = z.enum(['easy', 'medium', 'hard'])

const hintSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
})

const rewardsSchema = z.object({
  xp: z.number().min(0),
  coins: z.number().min(0),
  starsPerQuestion: z.number().int().min(0).default(0),
  badgeId: z.string().optional(),
})

const legacyRewardsSchema = z.object({
  xp: z.number().min(0),
  coins: z.number().min(0),
  badgeId: z.string().optional(),
})

const assetSchema = z.object({
  kind: z.enum(['image', 'audio', 'sprite']),
  id: z.string().min(1),
  uri: z.string().min(1),
})

const completionRulesSchema = z.object({
  passingScore: z.number().min(0).max(100),
  maxMistakes: z.number().int().min(0),
})

const baseActivitySchema = z.object({
  id: z.string().min(1),
  type: levelTypeSchema,
  difficulty: levelDifficultySchema,
  hints: z.array(hintSchema).min(1),
})

const multipleChoiceContentSchema = z
  .object({
    prompt: z.string().min(1),
    question: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          emoji: z.string().optional(),
        }),
      )
      .min(2),
    correctOptionId: z.string().min(1),
    explanation: z.string().min(1),
  })
  .superRefine(({ options }, context) => {
    const seenLabels = new Set<string>()

    options.forEach((option, index) => {
      if (seenLabels.has(option.label)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Multiple choice options must have unique labels. Duplicate label: ${option.label}`,
          path: ['options', index, 'label'],
        })
        return
      }

      seenLabels.add(option.label)
    })
  })

const dragAndDropContentSchema = z.object({
  prompt: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(2),
  targets: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        accepts: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(2),
  explanation: z.string().min(1),
})

const matchPairsContentSchema = z.object({
  prompt: z.string().min(1),
  pairs: z
    .array(
      z.object({
        id: z.string().min(1),
        left: z.string().min(1),
        right: z.string().min(1),
      }),
    )
    .min(2),
  explanation: z.string().min(1),
})

const memoryCardsContentSchema = z.object({
  prompt: z.string().min(1),
  pairs: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        emoji: z.string().optional(),
      }),
    )
    .min(3),
  explanation: z.string().min(1),
})

export const multipleChoiceActivitySchema = baseActivitySchema.extend({
  type: z.literal('multiple_choice'),
  content: multipleChoiceContentSchema,
})

export const dragAndDropActivitySchema = baseActivitySchema.extend({
  type: z.literal('drag_and_drop'),
  content: dragAndDropContentSchema,
})

export const matchPairsActivitySchema = baseActivitySchema.extend({
  type: z.literal('match_pairs'),
  content: matchPairsContentSchema,
})

export const memoryCardsActivitySchema = baseActivitySchema.extend({
  type: z.literal('memory_cards'),
  content: memoryCardsContentSchema,
})

export const gameActivitySchema = z.discriminatedUnion('type', [
  multipleChoiceActivitySchema,
  dragAndDropActivitySchema,
  matchPairsActivitySchema,
  memoryCardsActivitySchema,
])

export const stageLevelSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  worldId: z.string().min(1),
  missionId: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  instructions: z.string().min(1),
  difficulty: levelDifficultySchema,
  rewards: rewardsSchema,
  completionRules: completionRulesSchema,
  assets: z.array(assetSchema),
  activities: z.array(gameActivitySchema).min(1),
})

const legacyBaseLevelSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  worldId: z.string().min(1),
  missionId: z.string().min(1),
  type: levelTypeSchema,
  title: z.string().min(1),
  subject: z.string().min(1),
  instructions: z.string().min(1),
  difficulty: levelDifficultySchema,
  answers: z.array(z.string()).min(1),
  hints: z.array(hintSchema).min(1),
  rewards: legacyRewardsSchema,
  completionRules: completionRulesSchema,
  assets: z.array(assetSchema),
})

const legacyMultipleChoiceLevelSchema = legacyBaseLevelSchema.extend({
  type: z.literal('multiple_choice'),
  content: multipleChoiceContentSchema,
})

const legacyDragAndDropLevelSchema = legacyBaseLevelSchema.extend({
  type: z.literal('drag_and_drop'),
  content: dragAndDropContentSchema,
})

const legacyMatchPairsLevelSchema = legacyBaseLevelSchema.extend({
  type: z.literal('match_pairs'),
  content: matchPairsContentSchema,
})

const legacyMemoryCardsLevelSchema = legacyBaseLevelSchema.extend({
  type: z.literal('memory_cards'),
  content: memoryCardsContentSchema,
})

export const legacyGameLevelSchema = z.discriminatedUnion('type', [
  legacyMultipleChoiceLevelSchema,
  legacyDragAndDropLevelSchema,
  legacyMatchPairsLevelSchema,
  legacyMemoryCardsLevelSchema,
])

export type StageLevel = z.infer<typeof stageLevelSchema>
export type LegacyGameLevel = z.infer<typeof legacyGameLevelSchema>
export type GameLevel = StageLevel
export type GameActivity = z.infer<typeof gameActivitySchema>
export type MultipleChoiceActivity = z.infer<typeof multipleChoiceActivitySchema>
export type DragAndDropActivity = z.infer<typeof dragAndDropActivitySchema>
export type MatchPairsActivity = z.infer<typeof matchPairsActivitySchema>
export type MemoryCardsActivity = z.infer<typeof memoryCardsActivitySchema>
export type LevelType = z.infer<typeof levelTypeSchema>

export function normalizeLegacyGameLevel(level: LegacyGameLevel): StageLevel {
  const baseActivity = {
    id: `${level.id}-activity-1`,
    difficulty: level.difficulty,
    hints: level.hints,
  }

  const activity =
    level.type === 'multiple_choice'
      ? {
          ...baseActivity,
          type: 'multiple_choice' as const,
          content: level.content,
        }
      : level.type === 'drag_and_drop'
        ? {
            ...baseActivity,
            type: 'drag_and_drop' as const,
            content: level.content,
          }
        : level.type === 'match_pairs'
          ? {
              ...baseActivity,
              type: 'match_pairs' as const,
              content: level.content,
            }
          : {
              ...baseActivity,
              type: 'memory_cards' as const,
              content: level.content,
            }

  return {
    version: level.version,
    id: level.id,
    worldId: level.worldId,
    missionId: level.missionId,
    title: level.title,
    subject: level.subject,
    instructions: level.instructions,
    difficulty: level.difficulty,
    rewards: {
      ...level.rewards,
      starsPerQuestion: 0,
    },
    completionRules: level.completionRules,
    assets: level.assets,
    activities: [activity],
  }
}
