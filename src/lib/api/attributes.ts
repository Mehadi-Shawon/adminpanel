import type { AttributeType, GlobalAttribute } from "@/types"
import { stripHtml } from "@/lib/format"
import { wcDelete, wcGetList, wcPost } from "./wc-client"

interface WcAttribute {
  id: number
  name: string
  slug: string
  type: string
}

function mapAttribute(a: WcAttribute): GlobalAttribute {
  return {
    id: a.id,
    name: stripHtml(a.name),
    slug: a.slug,
    type: a.type === "text" ? "text" : "select",
  }
}

export async function getAttributes(): Promise<GlobalAttribute[]> {
  const { data } = await wcGetList<WcAttribute>("products/attributes")
  return data.map(mapAttribute).sort((a, b) => a.name.localeCompare(b.name))
}

export interface AttributeInput {
  name: string
  type: AttributeType
}

export async function createAttribute(input: AttributeInput): Promise<GlobalAttribute> {
  const wc = await wcPost<WcAttribute>("products/attributes", {
    name: input.name,
    type: input.type,
  })
  return mapAttribute(wc)
}

// force=true — taxonomy attributes have no trash, so deletion is permanent.
export async function deleteAttribute(id: number): Promise<void> {
  await wcDelete(`products/attributes/${id}`, { force: true })
}
