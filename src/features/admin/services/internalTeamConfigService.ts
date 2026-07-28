import { disputeApi } from "@/lib/axios"

export type InternalTeamKey = "FINANCE_TEAM" | "QUALITY_TEAM" | "LOGISTICS_TEAM"

export interface InternalTeamContact {
  team_key: InternalTeamKey
  display_name: string
  email: string
  updated_at: string
  updated_by: string | null
}

export interface InternalTeamContactUpdate {
  team_key: InternalTeamKey
  email: string
}

export const internalTeamConfigService = {
  listContacts: async (): Promise<InternalTeamContact[]> => {
    const response = await disputeApi.get<InternalTeamContact[]>(
      "/admin/internal-team-contacts"
    )
    return response.data
  },

  updateContacts: async (
    teams: InternalTeamContactUpdate[]
  ): Promise<InternalTeamContact[]> => {
    const response = await disputeApi.put<InternalTeamContact[]>(
      "/admin/internal-team-contacts",
      { teams }
    )
    return response.data
  },
}

export const INTERNAL_TEAM_CATEGORY_HINTS: Record<InternalTeamKey, string> = {
  FINANCE_TEAM: "Default for payment, amendment, and other dispute categories",
  QUALITY_TEAM: "Used when dispute category is Quality",
  LOGISTICS_TEAM: "Used when dispute category is Late delivery",
}
