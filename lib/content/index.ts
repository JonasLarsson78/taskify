import { enContent } from './en'
import { svContent } from './sv'

export const SUPPORTED_LANGUAGES = ['sv', 'en'] as const

export type UiLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function normalizeLanguage(value: unknown): UiLanguage {
  if (typeof value !== 'string') return 'sv'
  const normalized = value.trim().toLowerCase()
  return normalized === 'en' ? 'en' : 'sv'
}

const content = {
  sv: svContent,
  en: enContent,
} as const

export type AppContent = (typeof content)['sv'] | (typeof content)['en']
export type SettingsProfileContent = AppContent['settings']['profile']

export function getContent(language: unknown): AppContent {
  const normalized = normalizeLanguage(language)
  return content[normalized]
}
