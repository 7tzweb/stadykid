export function shuffleItems<T>(items: T[]) {
  const draft = [...items]

  for (let index = draft.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1))
    ;[draft[index], draft[nextIndex]] = [draft[nextIndex], draft[index]]
  }

  return draft
}
