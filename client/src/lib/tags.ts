export const MAX_TAGS = 8
export const MAX_TAG_LENGTH = 24

const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u

// Turns user input like " #Work " into "work", or null when it is not a valid tag.
export function normalizeTag(raw: string) {
  const tag = raw.trim().replace(/^#/, '').toLowerCase()
  return tag.length > 0 && tag.length <= MAX_TAG_LENGTH && TAG_PATTERN.test(tag) ? tag : null
}

// "Buy milk #groceries #home" -> { title: "Buy milk", tags: ["groceries", "home"] }
export function parseQuickAdd(raw: string) {
  const words = raw.trim().split(/\s+/).filter(Boolean)
  const tags: string[] = []
  const rest: string[] = []

  for (const word of words) {
    const tag = word.startsWith('#') ? normalizeTag(word) : null
    if (tag && tags.length < MAX_TAGS) {
      if (!tags.includes(tag)) tags.push(tag)
    } else {
      rest.push(word)
    }
  }

  // A line that is only tags keeps its text as the title instead of becoming empty.
  if (rest.length === 0) return { title: words.join(' '), tags: [] as string[] }
  return { title: rest.join(' '), tags }
}
