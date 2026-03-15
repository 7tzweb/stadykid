import { z } from 'zod'

export const levelTypeSchema = z.enum([
  'multiple_choice',
  'drag_and_drop',
  'match_pairs',
  'memory_cards',
])

const hintSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
})

const rewardsSchema = z.object({
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

const baseLevelSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  worldId: z.string().min(1),
  missionId: z.string().min(1),
  type: levelTypeSchema,
  title: z.string().min(1),
  subject: z.string().min(1),
  instructions: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  answers: z.array(z.string()).min(1),
  hints: z.array(hintSchema).min(1),
  rewards: rewardsSchema,
  completionRules: completionRulesSchema,
  assets: z.array(assetSchema),
})

const multipleChoiceContentSchema = z.object({
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

export const multipleChoiceLevelSchema = baseLevelSchema.extend({
  type: z.literal('multiple_choice'),
  content: multipleChoiceContentSchema,
})

export const dragAndDropLevelSchema = baseLevelSchema.extend({
  type: z.literal('drag_and_drop'),
  content: dragAndDropContentSchema,
})

export const matchPairsLevelSchema = baseLevelSchema.extend({
  type: z.literal('match_pairs'),
  content: matchPairsContentSchema,
})

export const memoryCardsLevelSchema = baseLevelSchema.extend({
  type: z.literal('memory_cards'),
  content: memoryCardsContentSchema,
})

export const gameLevelSchema = z.discriminatedUnion('type', [
  multipleChoiceLevelSchema,
  dragAndDropLevelSchema,
  matchPairsLevelSchema,
  memoryCardsLevelSchema,
])

export type GameLevel = z.infer<typeof gameLevelSchema>
export type LevelType = z.infer<typeof levelTypeSchema>
export type MultipleChoiceLevel = z.infer<typeof multipleChoiceLevelSchema>
export type DragAndDropLevel = z.infer<typeof dragAndDropLevelSchema>
export type MatchPairsLevel = z.infer<typeof matchPairsLevelSchema>
export type MemoryCardsLevel = z.infer<typeof memoryCardsLevelSchema>
