export const NAVIGATION_ACTIONS = [
  'folder_enter',
  'folder_back',
  'home',
  'delete_last',
  'clear_phrase',
] as const

export type NavigationAction = (typeof NAVIGATION_ACTIONS)[number]

export type RecordNavigationPayload = {
  profileId: string
  action: NavigationAction
  folderTarget?: string | null
  phraseLength?: number
  folderDepth?: number
}
