import matter from "gray-matter"
import { v4 as uuidv4 } from "uuid"

export function parseFrontmatter(rawText: string) {
  const parsed = matter(rawText)

  let id = parsed.data.id
  let created_at = parsed.data.created_at

  if (!id) {
    id = uuidv4()
    created_at = Date.now()

    const newRaw = matter.stringify(parsed.content, {
      ...parsed.data,
      id,
      created_at,
    })

    return {
      id,
      created_at,
      content: parsed.content,
      newRaw,
      injected: true,
    }
  }

  return {
    id,
    created_at: created_at || Date.now(),
    content: parsed.content,
    newRaw: rawText,
    injected: false,
  }
}