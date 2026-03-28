'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { LayoutGrid, List, LockKeyhole, Mail, Monitor, Moon, Pencil, Plus, Save, Settings, Sun, Trash2, X, FolderOpen, ArrowLeft, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { getAccountSettings, updateAccountSettings } from '@/app/actions/account'
import { getProfileLexiconCoverage, previewLexemeDetection } from '@/app/actions/lexicon'
import { computeMainGrid } from '@/lib/data/defaultSymbols'
import { createProfile, deleteProfile, getProfiles, updateProfile, updateProfileGender, updateProfileGridSize } from '@/app/actions/profiles'
import { getProfileSymbols, saveSymbols, deleteSymbolAction } from '@/app/actions/symbols'
import { setProfileGender } from '@/lib/profileGender'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import BrandLockup from '@/components/site/BrandLockup'
import type { Symbol as BoardSymbol } from '@/lib/supabase/types'
import {
  DEFAULT_SYMBOL_COLOR,
  PRESET_SYMBOL_COLORS,
  getColorInputValue,
  getSymbolTextColor,
  normalizeSymbolColor,
  resolveSymbolColor,
} from '@/lib/ui/symbolColors'

type AdminProfile = {
  id: string
  userId?: string
  name: string
  gender?: string
  communication_gender?: string
  isDemo?: boolean
  gridRows?: number
  gridCols?: number
  createdAt?: Date | string
  updatedAt?: Date | string
}

type AdminSymbol = {
  id: string
  gridId?: string | null
  grid_id?: string | null
  profileId?: string
  sourceSymbolId?: string
  label: string
  normalizedLabel?: string | null
  emoji?: string | null
  imageUrl?: string | null
  image_url?: string | null
  category: string
  posType: string
  pos_type?: string | null
  posConfidence?: number | null
  manualGrammarOverride?: boolean
  lexemeId?: string | null
  lexeme_id?: string | null
  positionX?: number | null
  positionY?: number | null
  position_x?: number | null
  position_y?: number | null
  color: string
  hidden?: boolean
  state?: string | null
  createdAt?: Date | string
  updatedAt?: Date | string
  created_at?: string
  updated_at?: string
}

const STATE_OPTIONS = [
  { value: 'visible', label: 'Visible (Normal)' },
  { value: 'locked', label: 'Bloqueado (No clickeable)' },
  { value: 'hidden', label: 'Oculto (Invisible)' },
]

const SYMBOL_POS_OPTIONS = [
  { value: 'pronoun', label: 'Pronombre' },
  { value: 'verb', label: 'Verbo' },
  { value: 'noun', label: 'Sustantivo' },
  { value: 'adj', label: 'Adjetivo' },
  { value: 'adverb', label: 'Adverbio' },
  { value: 'prep', label: 'Preposición' },
  { value: 'other', label: 'Otro' },
] as const

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Seguir sistema', icon: Monitor },
] as const

const DYSLEXIA_FONT_OPTIONS = [
  { value: false, label: 'Desactivado' },
  { value: true, label: 'Activado' },
] as const

type ThemePreference = 'light' | 'dark' | 'system'

const PRESET_COLORS = PRESET_SYMBOL_COLORS

const EMOJI_OPTIONS = [
  '😀', '😊', '😍', '😢', '😡', '👍', '👎', '✅',
  '❌', '➕', '💬', '❤️', '💙', '⭐', '🏠', '🏫',
  '🛏️', '🚽', '🌳', '🍎', '🥤', '🍞', '🍪', '🍽️',
  '🎮', '🧩', '📚', '🧍', '👨', '👩', '👤', '👥',
  '🚗', '🚌', '✈️', '⏰', '📅', '🎨', '🐶', '🐱',
]

const EMPTY_SYMBOL: Omit<AdminSymbol, 'id' | 'createdAt' | 'updatedAt' | 'gridId' | 'hidden'> = {
  label: '',
  emoji: '',
  imageUrl: '',
  category: 'General',
  posType: 'noun',
  posConfidence: null,
  manualGrammarOverride: false,
  lexemeId: null,
  positionX: 0,
  positionY: 0,
  color: DEFAULT_SYMBOL_COLOR,
  state: 'visible',
}

function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

type LexemeAlternative = {
  lexemeId: string
  lemma: string
  primaryPos: string
  symbolPosType: string
  confidence: number
  method: string
}

type LexemePreview = {
  lexemeId: string | null
  detectedLemma: string | null
  primaryPos: string | null
  symbolPosType: string
  confidence: number
  method: string
  normalizedLabel: string
  matchedForm?: {
    surface: string
    formType: string
    person: number | null
    tense: string | null
    mood: string | null
    number: string | null
    gender: string | null
  } | null
  alternatives: LexemeAlternative[]
}

type LexiconCoverage = {
  totalSymbols: number
  manualOverrideCount: number
  linkedLexemeCount: number
  highConfidenceCount: number
  resolvedCount: number
  reviewNeededCount: number
  coverageRatio: number
  reviewItems: Array<{
    id: string
    label: string
    posType: string
    posConfidence: number | null
    lexemeId: string | null
    manualGrammarOverride: boolean
    suggestedLemma: string | null
    suggestedPosType: string
    suggestedConfidence: number
    reason: 'sin_lexema' | 'baja_confianza' | 'tipo_generico' | 'normalizacion_pendiente'
  }>
}

function getSymbolPosition(symbol: Pick<AdminSymbol, 'positionX' | 'positionY' | 'position_x' | 'position_y'>) {
  return {
    x: symbol.positionX ?? symbol.position_x ?? 0,
    y: symbol.positionY ?? symbol.position_y ?? 0,
  }
}

function isMovableSymbol(symbol: Pick<AdminSymbol, 'id'> | null | undefined) {
  return Boolean(
    symbol?.id &&
    !String(symbol.id).startsWith('fixed-left') &&
    !String(symbol.id).startsWith('template') &&
    !String(symbol.id).startsWith('folder-item-')
  )
}

function updateSymbolCoordinates(symbol: AdminSymbol, x: number, y: number): AdminSymbol {
  return {
    ...symbol,
    positionX: x,
    positionY: y,
    position_x: x,
    position_y: y,
  }
}

function sortSymbolsByPosition(a: AdminSymbol, b: AdminSymbol) {
  const aPos = getSymbolPosition(a)
  const bPos = getSymbolPosition(b)
  if (aPos.y !== bPos.y) return aPos.y - bPos.y
  return aPos.x - bPos.x
}

function DroppableGridCell({
  cellId,
  className,
  style,
  children,
}: {
  cellId: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id: cellId })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className ?? ''} ${isOver ? 'rounded-lg ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50' : ''}`.trim()}
    >
      {children}
    </div>
  )
}

function DraggableGridItem({
  symbol,
  children,
}: {
  symbol: AdminSymbol
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: symbol.id,
    disabled: !isMovableSymbol(symbol),
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 30 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isMovableSymbol(symbol) ? 'touch-none cursor-grab active:cursor-grabbing' : undefined}
    >
      {children}
    </div>
  )
}

export default function AdminPage() {
  const { update: updateSession } = useSession()
  const { setTheme } = useTheme()
  const [accountSettings, setAccountSettings] = useState<{
    id: string
    name: string | null
    email: string
    preferredTheme: ThemePreference
    preferredDyslexiaFont: boolean
  } | null>(null)
  const [accountName, setAccountName] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPreferredTheme, setAccountPreferredTheme] = useState<ThemePreference>('system')
  const [accountPreferredDyslexiaFont, setAccountPreferredDyslexiaFont] = useState(false)
  const [showChangePasswordFields, setShowChangePasswordFields] = useState(false)
  const [accountCurrentPassword, setAccountCurrentPassword] = useState('')
  const [accountNewPassword, setAccountNewPassword] = useState('')
  const [accountConfirmPassword, setAccountConfirmPassword] = useState('')
  const [accountGender, setAccountGender] = useState<'male' | 'female'>('male')
  const [savingAccountSettings, setSavingAccountSettings] = useState(false)
  const [profiles, setProfiles] = useState<AdminProfile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [symbols, setSymbols] = useState<AdminSymbol[]>([])
  const [lexiconCoverage, setLexiconCoverage] = useState<LexiconCoverage | null>(null)
  const [loadingLexiconCoverage, setLoadingLexiconCoverage] = useState(false)
  const [status, setStatus] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [savingGrid, setSavingGrid] = useState(false)
  const [editingSymbol, setEditingSymbol] = useState<AdminSymbol | null>(null)
  const [lexemePreview, setLexemePreview] = useState<LexemePreview | null>(null)
  const [detectingLexeme, setDetectingLexeme] = useState(false)
  const [listSearch, setListSearch] = useState('')
  const [listStateFilter, setListStateFilter] = useState<'all' | 'visible' | 'locked' | 'hidden'>('all')

  // Nested Folder state
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false)
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [profileBeingEdited, setProfileBeingEdited] = useState<AdminProfile | null>(null)
  const [editProfileName, setEditProfileName] = useState('')
  const [markEditedProfileAsDefault, setMarkEditedProfileAsDefault] = useState(false)
  const [savingProfileChanges, setSavingProfileChanges] = useState(false)
  const [deletingProfileId, setDeletingProfileId] = useState('')
  const [profilePendingDeletion, setProfilePendingDeletion] = useState<AdminProfile | null>(null)
  const [deleteProfileNameConfirmation, setDeleteProfileNameConfirmation] = useState('')
  const [activeDraggedSymbolId, setActiveDraggedSymbolId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [fetchedProfiles, fetchedAccountSettings] = await Promise.all([
        getProfiles(),
        getAccountSettings()
      ])
      const normalizedAccountSettings = fetchedAccountSettings
        ? {
            ...fetchedAccountSettings,
            preferredTheme: normalizeThemePreference(fetchedAccountSettings.preferredTheme),
          }
        : null
      setProfiles(fetchedProfiles)
      setAccountSettings(normalizedAccountSettings)
      setAccountName(normalizedAccountSettings?.name ?? '')
      setAccountEmail(normalizedAccountSettings?.email ?? '')
      setAccountPreferredTheme(normalizedAccountSettings?.preferredTheme ?? 'system')
      setAccountPreferredDyslexiaFont(Boolean(normalizedAccountSettings?.preferredDyslexiaFont))
      if (fetchedProfiles.length === 0) {
        setSelectedProfileId('')
      } else if (!selectedProfileId || !fetchedProfiles.some(profile => profile.id === selectedProfileId)) {
        setSelectedProfileId(fetchedProfiles[0].id)
      }
    } catch (error) {
      console.error(error)
      setStatus('Error al cargar perfiles')
    }
    setLoadingData(false)
  }, [selectedProfileId])

  const resetPasswordFields = useCallback(() => {
    setShowChangePasswordFields(false)
    setAccountCurrentPassword('')
    setAccountNewPassword('')
    setAccountConfirmPassword('')
  }, [])

  const closeAccountSettingsModal = useCallback(() => {
    resetPasswordFields()
    setShowAccountSettingsModal(false)
  }, [resetPasswordFields])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedProfileId) {
      setLexiconCoverage(null)
      return
    }
    const fetchSymbols = async () => {
      setStatus('Cargando...')
      setLoadingLexiconCoverage(true)
      try {
        const [syms, coverage] = await Promise.all([
          getProfileSymbols(selectedProfileId),
          getProfileLexiconCoverage(selectedProfileId),
        ])
        setSymbols(syms)
        setLexiconCoverage(coverage)
        setStatus('Datos cargados.')
      } catch (error) {
        console.error(error)
        setStatus('Error al cargar datos léxicos del perfil.')
      } finally {
        setLoadingLexiconCoverage(false)
      }
    }
    fetchSymbols()
  }, [selectedProfileId])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)

  useEffect(() => {
    if (!selectedProfile) return
    setAccountGender(selectedProfile.gender === 'female' ? 'female' : 'male')
  }, [selectedProfile])

  useEffect(() => {
    if (!editingSymbol) {
      setLexemePreview(null)
      setDetectingLexeme(false)
      return
    }

    const label = typeof editingSymbol.label === 'string' ? editingSymbol.label.trim() : ''
    if (!label) {
      setLexemePreview(null)
      setDetectingLexeme(false)
      return
    }

    let isCancelled = false
    setDetectingLexeme(true)

    const timeoutId = setTimeout(async () => {
      try {
        const detection = await previewLexemeDetection(label)
        if (!isCancelled) {
          setLexemePreview(detection)
        }
      } catch {
        if (!isCancelled) {
          setLexemePreview(null)
        }
      } finally {
        if (!isCancelled) {
          setDetectingLexeme(false)
        }
      }
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [editingSymbol])

  const handleGridSizeUpdate = async (rows: number, cols: number) => {
    if (!selectedProfile) return
    setSavingGrid(true)
    try {
      await updateProfileGridSize(selectedProfile.id, rows, cols)
      const data = await getProfiles()
      setProfiles(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingGrid(false)
    }
  }

  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountName.trim() || !accountEmail.trim()) {
      setStatus('❌ El nombre y el correo electrónico son obligatorios.')
      return
    }

    if (accountNewPassword && accountNewPassword !== accountConfirmPassword) {
      setStatus('❌ La nueva contraseña y su confirmación no coinciden.')
      return
    }

    setSavingAccountSettings(true)
    setStatus('')
    try {
      const updatedAccount = await updateAccountSettings({
        name: accountName,
        email: accountEmail,
        preferredTheme: accountPreferredTheme,
        preferredDyslexiaFont: accountPreferredDyslexiaFont,
        currentPassword: accountCurrentPassword,
        newPassword: accountNewPassword,
      })

      if (selectedProfile) {
        await updateProfileGender(selectedProfile.id, accountGender)
        setProfileGender(selectedProfile.id, accountGender)
      }

      const normalizedPreferredTheme = normalizeThemePreference(updatedAccount.preferredTheme)
      setAccountSettings({
        ...updatedAccount,
        preferredTheme: normalizedPreferredTheme,
      })
      setAccountName(updatedAccount.name ?? '')
      setAccountEmail(updatedAccount.email)
      setAccountPreferredTheme(normalizedPreferredTheme)
      setAccountPreferredDyslexiaFont(Boolean(updatedAccount.preferredDyslexiaFont))
      resetPasswordFields()
      setTheme(normalizedPreferredTheme)
      await updateSession({
        user: {
          name: updatedAccount.name ?? '',
          email: updatedAccount.email,
          preferredTheme: normalizedPreferredTheme,
          preferredDyslexiaFont: Boolean(updatedAccount.preferredDyslexiaFont),
        },
      })
      await loadData()
      closeAccountSettingsModal()
      setStatus('✅ Configuración de la cuenta actualizada correctamente.')
    } catch (error) {
      console.error(error)
      setStatus(error instanceof Error ? `❌ ${error.message}` : '❌ No se pudo actualizar la cuenta.')
    } finally {
      setSavingAccountSettings(false)
    }
  }

  const handleSaveAll = async () => {
    if (!selectedProfileId) return
    setStatus('Guardando cambios en la nube...')
    try {
      await saveSymbols(selectedProfileId, symbols)
      const [freshSymbols, coverage] = await Promise.all([
        getProfileSymbols(selectedProfileId),
        getProfileLexiconCoverage(selectedProfileId),
      ])
      setSymbols(freshSymbols)
      setLexiconCoverage(coverage)
      setStatus('✅ Cambios guardados correctamente.')
    } catch (err) {
      console.error(err)
      setStatus('❌ Error al guardar.')
    }
  }

  const deleteSymbol = async (symbolId: string) => {
    if (symbolId.startsWith('new-') || symbolId.startsWith('fixed-') || symbolId.startsWith('template-')) {
      setSymbols(prev => prev.filter(s => s.id !== symbolId))
      return
    }
    try {
      await deleteSymbolAction(selectedProfileId, symbolId)
      setSymbols(prev => prev.filter(s => s.id !== symbolId))
      const coverage = await getProfileLexiconCoverage(selectedProfileId)
      setLexiconCoverage(coverage)
      setStatus('Símbolo eliminado.')
    } catch {
      setStatus('Error al eliminar símbolo.')
    }
  }

  const handleEditSave = () => {
    if (!editingSymbol) return
    setSymbols(prev => {
      const existing = prev.find(s => s.id === editingSymbol.id)
      if (existing) {
        return prev.map(s => s.id === editingSymbol.id ? editingSymbol : s)
      } else {
        // Create new
        const newSym = { ...editingSymbol, id: `new-${Date.now()}` }
        return [...prev, newSym]
      }
    })
    setEditingSymbol(null)
  }

  const handleDeleteEditingSymbol = async () => {
    if (!editingSymbol) return

    const symbolId = String(editingSymbol.id ?? '')
    if (!symbolId) return

    if (symbolId.startsWith('new-') || symbolId.startsWith('fixed-') || symbolId.startsWith('template-')) {
      setSymbols(prev => prev.filter(s => s.id !== editingSymbol.id))
      setEditingSymbol(null)
      setStatus('Símbolo eliminado.')
      return
    }

    try {
      await deleteSymbolAction(selectedProfileId, symbolId)
      setSymbols(prev => prev.filter(s => s.id !== editingSymbol.id))
      const coverage = await getProfileLexiconCoverage(selectedProfileId)
      setLexiconCoverage(coverage)
      setEditingSymbol(null)
      setStatus('Símbolo eliminado.')
    } catch (error) {
      console.error(error)
      setStatus('Error al eliminar símbolo.')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingSymbol) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingSymbol({ ...editingSymbol, imageUrl: reader.result })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfileName.trim()) return

    setCreatingProfile(true)
    setStatus('')
    try {
      const profile = await createProfile({
        name: newProfileName,
        gender: 'male',
      })
      await loadData()
      setSelectedProfileId(profile.id)
      setShowCreateProfileModal(false)
      setNewProfileName('')
      setStatus('✅ Perfil creado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo crear el perfil.')
    } finally {
      setCreatingProfile(false)
    }
  }

  const openEditProfileModal = (profile: AdminProfile) => {
    setProfileBeingEdited(profile)
    setEditProfileName(profile.name)
    setMarkEditedProfileAsDefault(false)
  }

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileBeingEdited || !editProfileName.trim()) return

    setSavingProfileChanges(true)
    setStatus('')
    try {
      await updateProfile({
        profileId: profileBeingEdited.id,
        name: editProfileName,
        makeDefault: !profileBeingEdited.isDemo && markEditedProfileAsDefault,
      })
      await loadData()
      setProfileBeingEdited(null)
      setEditProfileName('')
      setMarkEditedProfileAsDefault(false)
      setStatus('✅ Perfil actualizado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo actualizar el perfil.')
    } finally {
      setSavingProfileChanges(false)
    }
  }

  const handleDeleteProfile = async (profile: AdminProfile) => {
    if (profile.isDemo) return

    setProfilePendingDeletion(profile)
    setDeleteProfileNameConfirmation('')
  }

  const confirmDeleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profilePendingDeletion) return
    if (deleteProfileNameConfirmation.trim() !== profilePendingDeletion.name) return

    setDeletingProfileId(profilePendingDeletion.id)
    setStatus('')
    try {
      await deleteProfile(profilePendingDeletion.id)
      await loadData()
      setProfilePendingDeletion(null)
      setDeleteProfileNameConfirmation('')
      setStatus('✅ Perfil eliminado correctamente.')
    } catch (error) {
      console.error(error)
      setStatus('❌ No se pudo eliminar el perfil.')
    } finally {
      setDeletingProfileId('')
    }
  }

  const shouldUseDefaultGridTemplate = Boolean(selectedProfile?.isDemo)
  const mainGridSymbols = shouldUseDefaultGridTemplate
    ? computeMainGrid(symbols as unknown as BoardSymbol[], activeFolder) as AdminSymbol[]
    : symbols
  const draggableSymbolsById = useMemo(() => {
    return new Map(mainGridSymbols.filter((symbol) => isMovableSymbol(symbol)).map((symbol) => [symbol.id, symbol]))
  }, [mainGridSymbols])
  const activeDraggedSymbol = activeDraggedSymbolId ? draggableSymbolsById.get(activeDraggedSymbolId) ?? null : null
  const listSymbols = useMemo(() => {
    const normalizedQuery = listSearch.trim().toLowerCase()

    return [...mainGridSymbols]
      .sort(sortSymbolsByPosition)
      .filter((symbol) => {
        if (listStateFilter !== 'all' && (symbol.state ?? 'visible') !== listStateFilter) {
          return false
        }

        if (!normalizedQuery) return true

        const searchableText = [
          symbol.label,
          symbol.category,
          symbol.posType,
          symbol.emoji,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(normalizedQuery)
      })
  }, [listSearch, listStateFilter, mainGridSymbols])

  const handleDragStart = (event: DragStartEvent) => {
    if (activeFolder) return
    setActiveDraggedSymbolId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDraggedSymbolId(null)
    if (activeFolder) return

    const overId = event.over?.id
    if (!overId || typeof overId !== 'string' || !overId.startsWith('cell-')) return

    const draggedSymbol = draggableSymbolsById.get(String(event.active.id))
    if (!draggedSymbol || !isMovableSymbol(draggedSymbol)) return

    const [, targetX, targetY] = overId.split('-')
    const x = Number(targetX)
    const y = Number(targetY)

    if (Number.isNaN(x) || Number.isNaN(y)) return

    const sourcePosition = getSymbolPosition(draggedSymbol)
    if (sourcePosition.x === x && sourcePosition.y === y) return

    const targetSymbol = mainGridSymbols.find((symbol) => {
      if (!isMovableSymbol(symbol) || symbol.id === draggedSymbol.id) return false
      const position = getSymbolPosition(symbol)
      return position.x === x && position.y === y
    })

    setSymbols((prev) => prev.map((symbol) => {
      if (symbol.id === draggedSymbol.id) {
        return updateSymbolCoordinates(symbol, x, y)
      }

      if (targetSymbol && symbol.id === targetSymbol.id) {
        return updateSymbolCoordinates(symbol, sourcePosition.x, sourcePosition.y)
      }

      return symbol
    }))
  }

  const handleCreateSymbolFromList = () => {
    const gridCols = selectedProfile?.gridCols || 14
    const gridRows = selectedProfile?.gridRows || 8
    let nextPosition = { x: 0, y: 0 }

    let foundEmptySlot = false
    for (let y = 0; y < gridRows; y += 1) {
      for (let x = 0; x < gridCols; x += 1) {
        const occupied = mainGridSymbols.some((symbol) => {
          const position = getSymbolPosition(symbol)
          return position.x === x && position.y === y
        })

        if (!occupied) {
          nextPosition = { x, y }
          foundEmptySlot = true
          break
        }
      }

      if (foundEmptySlot) break
    }

    if (!foundEmptySlot) {
      const sortedSymbols = [...mainGridSymbols].sort(sortSymbolsByPosition)
      const lastSymbol = sortedSymbols[sortedSymbols.length - 1]
      const lastPosition = lastSymbol ? getSymbolPosition(lastSymbol) : { x: 0, y: 0 }
      const nextIndex = lastPosition.y * gridCols + lastPosition.x + 1
      nextPosition = {
        x: nextIndex % gridCols,
        y: Math.floor(nextIndex / gridCols),
      }
    }

    setEditingSymbol({
      id: `draft-${Date.now()}`,
      ...EMPTY_SYMBOL,
      positionX: nextPosition.x,
      positionY: nextPosition.y,
    })
  }

  const applyLexemeAlternative = (alternative: LexemeAlternative) => {
    if (!editingSymbol) return

    setEditingSymbol({
      ...editingSymbol,
      color: normalizeSymbolColor(editingSymbol.color),
      posType: alternative.symbolPosType,
      lexemeId: alternative.lexemeId,
      posConfidence: alternative.confidence,
      manualGrammarOverride: true,
    })
  }

  return (
    <div className="theme-page-shell min-h-screen p-4 text-slate-900 dark:text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="app-panel mb-8 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <BrandLockup
              href="/"
              iconSize={44}
              wordmarkWidth={156}
              priority
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Panel de Administración</h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Personaliza el comunicador para cada perfil.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/tablero" className="ui-secondary-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition">
              <ArrowLeft className="mr-2 h-4 w-4" /> VOLVER AL TABLERO
            </Link>
            <button
              onClick={handleSaveAll}
              className="ui-primary-button inline-flex h-10 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </button>
          </div>
        </header>

        {status && (
          <div className="mb-6 rounded-xl border border-emerald-200/70 bg-emerald-50/90 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            {status}
          </div>
        )}

        {loadingData ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-1">
              <div className="app-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <User size={16} /> Perfiles
                  </h2>
                  <button
                    onClick={() => setShowCreateProfileModal(true)}
                    className="ui-soft-badge inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:brightness-105"
                    type="button"
                  >
                    <Plus size={14} />
                    Crear
                  </button>
                </div>
                <div className="space-y-2">
                  {profiles.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-2xl p-2 transition"
                      style={{
                        background: selectedProfileId === p.id ? 'var(--app-predicted)' : 'var(--app-surface-muted)',
                        boxShadow: selectedProfileId === p.id ? '0 0 0 1px var(--app-predicted-border)' : 'none',
                      }}
                    >
                      <button
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold ${selectedProfileId === p.id ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}
                        type="button"
                      >
                        {p.name} {p.isDemo ? '(DEMO)' : ''}
                      </button>
                      <button
                        onClick={() => openEditProfileModal(p)}
                        className="ui-icon-button inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 dark:text-slate-300"
                        type="button"
                        aria-label={`Editar perfil ${p.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(p)}
                        disabled={p.isDemo || deletingProfileId === p.id}
                        className="ui-icon-button inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300"
                        type="button"
                        aria-label={`Eliminar perfil ${p.name}`}
                        title={p.isDemo ? 'El perfil por defecto no se puede eliminar' : 'Eliminar perfil'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="app-panel rounded-2xl p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--app-muted-foreground)]">
                  <Settings size={16} /> Configuración
                </h2>

                <button
                  type="button"
                  onClick={() => setShowAccountSettingsModal(true)}
                  className="ui-secondary-button flex w-full rounded-2xl px-4 py-3 text-left transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--app-foreground)]">Configuración de la cuenta</p>
                    <p className="mt-1 text-xs text-[var(--app-muted-foreground)]">Nombre, correo, contraseña, género y tema.</p>
                  </div>
                </button>
              </div>

              {selectedProfile && (
                <div className="app-panel rounded-2xl p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--app-muted-foreground)]">
                        Cobertura léxica
                      </h2>
                      <p className="mt-1 text-xs text-[var(--app-muted-foreground)]">
                        Calidad del análisis gramatical del perfil actual.
                      </p>
                    </div>
                    <span className="ui-soft-badge rounded-full px-3 py-1 text-xs font-semibold text-[var(--app-foreground)] dark:text-indigo-100">
                      {loadingLexiconCoverage
                        ? '...'
                        : `${Math.round((lexiconCoverage?.coverageRatio ?? 0) * 100)}%`}
                    </span>
                  </div>

                  <div className="mb-4 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
                    <div
                      className="h-2 rounded-full bg-[var(--app-primary-button)]"
                      style={{ width: `${Math.round((lexiconCoverage?.coverageRatio ?? 0) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="ui-floating-panel rounded-2xl px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                        Resueltos
                      </p>
                      <p className="mt-1 text-lg font-bold text-[var(--app-foreground)]">
                        {lexiconCoverage?.resolvedCount ?? 0}
                      </p>
                    </div>
                    <div className="ui-floating-panel rounded-2xl px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                        Revisar
                      </p>
                      <p className="mt-1 text-lg font-bold text-[var(--app-foreground)]">
                        {lexiconCoverage?.reviewNeededCount ?? 0}
                      </p>
                    </div>
                    <div className="ui-floating-panel rounded-2xl px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                        Con lexema
                      </p>
                      <p className="mt-1 text-lg font-bold text-[var(--app-foreground)]">
                        {lexiconCoverage?.linkedLexemeCount ?? 0}
                      </p>
                    </div>
                    <div className="ui-floating-panel rounded-2xl px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                        Overrides
                      </p>
                      <p className="mt-1 text-lg font-bold text-[var(--app-foreground)]">
                        {lexiconCoverage?.manualOverrideCount ?? 0}
                      </p>
                    </div>
                  </div>

                  {Boolean(lexiconCoverage?.reviewItems.length) && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted-foreground)]">
                        Revisión sugerida
                      </p>
                      {lexiconCoverage?.reviewItems.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const targetSymbol = symbols.find((symbol) => symbol.id === item.id)
                            if (!targetSymbol) return
                            const position = getSymbolPosition(targetSymbol)
                            setEditingSymbol({
                              ...targetSymbol,
                              color: normalizeSymbolColor(targetSymbol.color),
                              positionX: position.x,
                              positionY: position.y,
                              state: targetSymbol.state || 'visible',
                            })
                          }}
                          className="ui-secondary-button flex w-full items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left transition"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--app-foreground)]">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-[var(--app-muted-foreground)]">
                              {item.reason === 'sin_lexema'
                                ? 'Sin lexema enlazado'
                                : item.reason === 'baja_confianza'
                                  ? 'Confianza baja'
                                  : item.reason === 'tipo_generico'
                                    ? 'Tipo demasiado genérico'
                                    : 'Normalización pendiente'}
                            </p>
                            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-200">
                              Sugerencia: {item.suggestedLemma ?? item.label} · {item.suggestedPosType} · {Math.round(item.suggestedConfidence * 100)}%
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-[var(--app-foreground)]/88">
                            Abrir
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="app-panel rounded-2xl p-5">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vista</h2>
                <div className="ui-floating-panel flex overflow-hidden rounded-2xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${viewMode === 'grid' ? 'ui-secondary-button text-indigo-600 shadow-sm dark:text-indigo-300' : 'text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300'
                      }`}
                  >
                    <LayoutGrid size={16} /> Grid
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition ${viewMode === 'table' ? 'ui-secondary-button text-indigo-600 shadow-sm dark:text-indigo-300' : 'text-slate-600 hover:bg-[var(--app-hover)] dark:text-slate-300'
                      }`}
                  >
                    <List size={16} /> Lista
                  </button>
                </div>
              </div>

              {selectedProfile && !selectedProfile.isDemo && (
                <div className="app-panel rounded-2xl p-5">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dimensiones</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Filas</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={selectedProfile.gridRows || 8}
                        onChange={(e) => handleGridSizeUpdate(parseInt(e.target.value) || 1, selectedProfile.gridCols || 14)}
                        disabled={savingGrid}
                        className="app-input w-16 rounded-md py-1 text-center text-sm disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Columnas</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={selectedProfile.gridCols || 14}
                        onChange={(e) => handleGridSizeUpdate(selectedProfile.gridRows || 8, parseInt(e.target.value) || 1)}
                        disabled={savingGrid}
                        className="app-input w-16 rounded-md py-1 text-center text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Area */}
            <div className="lg:col-span-3">
              {viewMode === 'grid' ? (
                <div className="app-panel rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {activeFolder ? `Editando carpeta: ${activeFolder}` : 'Vista Previa del Grid'}
                      </h2>
                      {activeFolder && (
                        <button onClick={() => setActiveFolder(null)} className="mt-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300">
                          &larr; Volver al grid principal
                        </button>
                      )}
                    </div>
                  </div>

                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="aac-grid-surface grid min-h-[500px] content-start gap-2 rounded-[1.8rem] p-4"
                      style={{ gridTemplateColumns: `repeat(${selectedProfile?.gridCols || 14}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: (selectedProfile?.gridCols || 14) * (selectedProfile?.gridRows || 8) }).map((_, index) => {
                        const gridCols = selectedProfile?.gridCols || 14
                        const x = index % gridCols
                        const y = Math.floor(index / gridCols)

                        const symbol = mainGridSymbols.find((s) => (s.positionX === x && s.positionY === y) || (s.position_x === x && s.position_y === y))

                        if (symbol) {
                          return (
                            <DroppableGridCell
                              key={`cell-${x}-${y}`}
                              cellId={`cell-${x}-${y}`}
                              className="h-20"
                              style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                            >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative h-20"
                              >
                                <DraggableGridItem symbol={symbol}>
                                  <button
                                    onClick={() => setEditingSymbol({
                                      ...symbol,
                                      color: normalizeSymbolColor(symbol.color),
                                      positionX: x,
                                      positionY: y,
                                      state: symbol.state || 'visible'
                                    })}
                                    type="button"
                                    className={`symbol-cell flex h-full w-full flex-col items-center justify-center rounded-[1.35rem] border p-1 transition ${symbol.state === 'locked' ? 'opacity-50 grayscale' : ''} ${symbol.state === 'hidden' ? 'opacity-20 striping-bg' : ''}`}
                                    style={{
                                      backgroundColor: resolveSymbolColor(symbol.color),
                                      borderColor: 'var(--app-border)',
                                      color: getSymbolTextColor(symbol.color),
                                    }}
                                  >
                                    <div className="text-xl mb-1">
                                      {symbol.imageUrl ? (
                                        <img src={symbol.imageUrl} alt={symbol.label} className="h-8 w-8 object-contain" />
                                      ) : (
                                        symbol.emoji || '❓'
                                      )}
                                    </div>
                                    <span className="text-center text-[10px] font-bold leading-tight line-clamp-1">
                                      {symbol.label}
                                    </span>
                                  </button>
                                </DraggableGridItem>
                                {isMovableSymbol(symbol) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteSymbol(symbol.id)
                                    }}
                                    type="button"
                                    className="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-rose-500 text-white shadow-sm group-hover:grid z-10"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </motion.div>
                            </DroppableGridCell>
                          )
                        }

                        return (
                          <DroppableGridCell
                            key={`cell-${x}-${y}`}
                            cellId={`cell-${x}-${y}`}
                            className="h-20"
                            style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                          >
                            <button
                              onClick={() => setEditingSymbol({ id: `draft-${Date.now()}`, ...EMPTY_SYMBOL, positionX: x, positionY: y })}
                              type="button"
                            className="ui-empty-slot group flex h-20 w-full items-center justify-center rounded-[1.35rem] transition hover:border-[var(--app-predicted-border)] hover:bg-[var(--app-predicted)]"
                            >
                              <Plus size={14} className="text-slate-300 group-hover:text-indigo-400 dark:text-slate-600" />
                            </button>
                          </DroppableGridCell>
                        )
                      })}
                    </div>

                    <DragOverlay>
                      {activeDraggedSymbol ? (
                        <div
                          className="ui-floating-panel flex h-20 w-20 flex-col items-center justify-center rounded-[1.35rem] p-1"
                          style={{
                            backgroundColor: resolveSymbolColor(activeDraggedSymbol.color),
                            color: getSymbolTextColor(activeDraggedSymbol.color),
                          }}
                        >
                          <div className="text-xl mb-1">
                            {activeDraggedSymbol.imageUrl ? (
                              <img src={activeDraggedSymbol.imageUrl} alt={activeDraggedSymbol.label} className="h-8 w-8 object-contain" />
                            ) : (
                              activeDraggedSymbol.emoji || '❓'
                            )}
                          </div>
                          <span className="text-center text-[10px] font-bold leading-tight line-clamp-1">
                            {activeDraggedSymbol.label}
                          </span>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              ) : (
                <div className="app-panel overflow-hidden rounded-2xl">
                  <div className="border-b border-[var(--app-border)] px-6 py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Vista de Lista</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Edita y revisa los símbolos del perfil en formato tabla.
                        </p>
                        {activeFolder && (
                          <button
                            onClick={() => setActiveFolder(null)}
                            className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                            type="button"
                          >
                            &larr; Volver al grid principal
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ui-chip rounded-full px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {listSymbols.length} símbolo{listSymbols.length === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCreateSymbolFromList}
                          className="ui-primary-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir símbolo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 border-b border-[var(--app-border)] px-6 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
                    <input
                      type="text"
                      value={listSearch}
                      onChange={(e) => setListSearch(e.target.value)}
                      placeholder="Buscar por etiqueta, categoría, tipo o emoji..."
                      className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    />

                    <select
                      value={listStateFilter}
                      onChange={(e) => setListStateFilter(e.target.value as 'all' | 'visible' | 'locked' | 'hidden')}
                      className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="visible">Visible</option>
                      <option value="locked">Bloqueado</option>
                      <option value="hidden">Oculto</option>
                    </select>
                  </div>

                  {listSymbols.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                        No hay símbolos que coincidan con los filtros actuales.
                      </p>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Ajusta la búsqueda, cambia el filtro de estado o crea un símbolo nuevo.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-[var(--app-surface-muted)]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Símbolo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Categoría</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Posición</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {listSymbols.map((symbol) => {
                            const position = getSymbolPosition(symbol)
                            return (
                              <tr key={`row-${symbol.id}`} className="bg-[color-mix(in_srgb,var(--app-surface-elevated)_55%,transparent)]">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="ui-floating-panel grid h-11 w-11 place-items-center rounded-2xl text-lg"
                                      style={{ backgroundColor: resolveSymbolColor(symbol.color) }}
                                    >
                                      {symbol.imageUrl ? '🖼️' : symbol.emoji || '❓'}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 dark:text-slate-100">{symbol.label || 'Sin etiqueta'}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{symbol.posType || 'Sin tipo'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{symbol.category || 'General'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    symbol.state === 'hidden'
                                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      : symbol.state === 'locked'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                  }`}>
                                    {symbol.state || 'visible'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{position.x + 1}, {position.y + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingSymbol({
                                        ...symbol,
                                        color: normalizeSymbolColor(symbol.color),
                                        positionX: position.x,
                                        positionY: position.y,
                                        state: symbol.state || 'visible',
                                      })}
                                      className="ui-secondary-button inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-700 transition dark:text-slate-200"
                                    >
                                      Editar
                                    </button>
                                    {isMovableSymbol(symbol) && (
                                      <button
                                        type="button"
                                        onClick={() => deleteSymbol(symbol.id)}
                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAccountSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                if (!savingAccountSettings) {
                  closeAccountSettingsModal()
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="ui-modal-panel relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configuración de la cuenta</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gestiona tus datos, la voz gramatical y la preferencia visual.</p>
                </div>
                <button
                  type="button"
                  onClick={closeAccountSettingsModal}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  disabled={savingAccountSettings}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAccountSettings} className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nombre</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <Mail size={14} /> Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="tu@email.com"
                      />
                    </div>

                    {!showChangePasswordFields ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setShowChangePasswordFields(true)}
                          className="ui-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition dark:text-slate-200"
                        >
                          <LockKeyhole size={14} />
                          Cambiar contraseña
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Solo se mostrará el formulario de contraseña cuando quieras modificarla.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <LockKeyhole size={14} />
                            Cambiar contraseña
                          </p>
                          <button
                            type="button"
                            onClick={resetPasswordFields}
                            className="text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Cancelar cambio
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña actual</label>
                          <input
                            type="password"
                            value={accountCurrentPassword}
                            onChange={(e) => setAccountCurrentPassword(e.target.value)}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                            placeholder="Tu contraseña actual"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Nueva contraseña</label>
                          <input
                            type="password"
                            value={accountNewPassword}
                            onChange={(e) => setAccountNewPassword(e.target.value)}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                            placeholder="Mínimo 8 caracteres"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Confirmar nueva contraseña</label>
                          <input
                            type="password"
                            value={accountConfirmPassword}
                            onChange={(e) => setAccountConfirmPassword(e.target.value)}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                            placeholder="Repite la nueva contraseña"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Género de comunicación</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAccountGender('male')}
                          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${accountGender === 'male' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                          style={{ borderColor: accountGender === 'male' ? 'var(--app-predicted-border)' : undefined }}
                        >
                          Masculino
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountGender('female')}
                          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${accountGender === 'female' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                          style={{ borderColor: accountGender === 'female' ? 'var(--app-predicted-border)' : undefined }}
                        >
                          Femenino
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Se aplica al perfil seleccionado{selectedProfile ? `: ${selectedProfile.name}` : ''}.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {THEME_OPTIONS.map((option) => {
                          const Icon = option.icon
                          const isActive = accountPreferredTheme === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setAccountPreferredTheme(option.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                              style={{ borderColor: isActive ? 'var(--app-predicted-border)' : undefined }}
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-semibold">{option.label}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">La preferencia se guarda en tu cuenta y se aplica en toda la app.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tipografía adaptada a dislexia
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {DYSLEXIA_FONT_OPTIONS.map((option) => {
                          const isActive = accountPreferredDyslexiaFont === option.value
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setAccountPreferredDyslexiaFont(option.value)}
                              className={`rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200' : 'ui-secondary-button text-slate-600 dark:text-slate-300'}`}
                              style={{ borderColor: isActive ? 'var(--app-predicted-border)' : undefined }}
                            >
                              <div className="text-sm font-semibold">
                                {option.value ? (
                                  <span className="font-dyslexia-preview">Activado</span>
                                ) : (
                                  'Desactivado'
                                )}
                              </div>
                              <p className={`mt-1 text-xs ${option.value ? 'font-dyslexia-preview' : ''}`}>
                                {option.value ? 'Usar OpenDyslexic en toda la interfaz.' : 'Mantener la tipografía actual de Luma Grid.'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Por defecto está desactivada. Si la activas, la app completa utilizará OpenDyslexic.
                      </p>
                    </div>

                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-[var(--app-border)] pt-6">
                  <button
                    type="button"
                    onClick={closeAccountSettingsModal}
                    className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
                    disabled={savingAccountSettings}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAccountSettings || !accountSettings}
                    className="ui-primary-button rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-70"
                  >
                    {savingAccountSettings ? 'Guardando...' : 'Guardar configuración'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Editing Modal */}
      <AnimatePresence>
        {editingSymbol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => setEditingSymbol(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative w-full max-w-xl overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {editingSymbol.id ? 'Editar Símbolo' : 'Nuevo Símbolo'}
                </h3>
                <button onClick={() => setEditingSymbol(null)} className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Etiqueta</label>
                      <input
                        type="text"
                        value={editingSymbol.label}
                        onChange={e => setEditingSymbol({
                          ...editingSymbol,
                          label: e.target.value,
                          manualGrammarOverride: false,
                          lexemeId: null,
                          posConfidence: null,
                        })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="Ej. Comer"
                      />
                      <div className="ui-floating-panel mt-3 rounded-2xl px-4 py-3">
                        {detectingLexeme ? (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Analizando palabra...
                          </p>
                        ) : lexemePreview ? (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                                {lexemePreview.primaryPos ?? lexemePreview.symbolPosType}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {Math.round(lexemePreview.confidence * 100)}%
                              </span>
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                                {lexemePreview.method}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Lema detectado: <span className="font-semibold">{lexemePreview.detectedLemma ?? 'sin coincidencia'}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Normalizado: {lexemePreview.normalizedLabel || 'sin texto'}
                            </p>
                            {lexemePreview.matchedForm && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Forma detectada: <span className="font-semibold">{lexemePreview.matchedForm.surface}</span>
                                {' · '}
                                {lexemePreview.matchedForm.formType}
                                {lexemePreview.matchedForm.tense ? ` · ${lexemePreview.matchedForm.tense}` : ''}
                                {lexemePreview.matchedForm.number ? ` · ${lexemePreview.matchedForm.number}` : ''}
                              </p>
                            )}
                            {lexemePreview.alternatives.length > 1 && (
                              <div className="pt-1">
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Alternativas detectadas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {lexemePreview.alternatives.slice(0, 4).map((alternative) => (
                                    <button
                                      key={`${alternative.lexemeId || alternative.lemma}-${alternative.method}`}
                                      type="button"
                                      onClick={() => applyLexemeAlternative(alternative)}
                                      className="ui-chip rounded-full px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:text-indigo-700 dark:text-slate-200 dark:hover:text-indigo-200"
                                    >
                                      {alternative.lemma} · {alternative.primaryPos}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            El sistema intentará detectar automáticamente el tipo de palabra al guardar.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Emoji / Icono texto</label>
                      <input
                        type="text"
                        value={editingSymbol.emoji || ''}
                        onChange={e => setEditingSymbol({ ...editingSymbol, emoji: e.target.value })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                        placeholder="🍎"
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Selector de emoji</span>
                        <button
                          type="button"
                          onClick={() => setEditingSymbol({ ...editingSymbol, emoji: '' })}
                          className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Quitar emoji
                        </button>
                      </div>
                      <div className="ui-floating-panel mt-2 grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-2xl p-3 sm:grid-cols-7">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditingSymbol({ ...editingSymbol, emoji })}
                            className={`grid h-10 w-full place-items-center rounded-lg border text-xl leading-none transition ${
                              editingSymbol.emoji === emoji
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'ui-icon-button border-transparent'
                            }`}
                            aria-label={`Seleccionar emoji ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Categoría</label>
                      <input
                        type="text"
                        value={editingSymbol.category || ''}
                        onChange={e => setEditingSymbol({ ...editingSymbol, category: e.target.value })}
                        className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>

                    <div className="ui-floating-panel space-y-3 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Control gramatical</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Usa la detección automática o fija manualmente el tipo de palabra.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSymbol({
                            ...editingSymbol,
                            manualGrammarOverride: !editingSymbol.manualGrammarOverride,
                            ...(editingSymbol.manualGrammarOverride
                              ? {
                                  lexemeId: null,
                                  posConfidence: null,
                                }
                              : {}),
                          })}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            editingSymbol.manualGrammarOverride
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                          }`}
                        >
                          {editingSymbol.manualGrammarOverride ? 'Manual' : 'Automático'}
                        </button>
                      </div>

                      {editingSymbol.manualGrammarOverride ? (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Tipo de palabra
                          </label>
                          <select
                            value={editingSymbol.posType || 'other'}
                            onChange={(e) => setEditingSymbol({
                              ...editingSymbol,
                              posType: e.target.value,
                              lexemeId: null,
                              posConfidence: 1,
                              manualGrammarOverride: true,
                            })}
                            className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                          >
                            {SYMBOL_POS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            El override manual tendrá prioridad sobre la detección automática al guardar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Tipo actual: <span className="font-semibold">{lexemePreview?.symbolPosType ?? editingSymbol.posType ?? 'other'}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {lexemePreview
                              ? `El sistema usará el lema ${lexemePreview.detectedLemma ?? 'sin coincidencia'} y la confianza ${Math.round(lexemePreview.confidence * 100)}%.`
                              : 'Cuando haya una detección válida se aplicará automáticamente al guardar.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Nested Folder Action */}
                    {editingSymbol.category === 'Carpetas' && (
                      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          onClick={() => {
                            setActiveFolder(editingSymbol.label)
                            setEditingSymbol(null)
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-100 px-4 py-3 font-semibold text-orange-700 transition hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:hover:bg-orange-500/25"
                        >
                          <FolderOpen size={18} /> Editar contenido de la carpeta
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Imagen Personalizada</label>
                      <div className="ui-floating-panel flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-4 transition hover:border-indigo-400">
                        {editingSymbol.imageUrl ? (
                          <img src={editingSymbol.imageUrl} alt="Preview" className="h-16 w-16 object-contain" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <Plus size={24} />
                          </div>
                        )}
                        <label className="ui-secondary-button cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm dark:text-indigo-300">
                          Subir imagen
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Color de fondo</label>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setEditingSymbol({ ...editingSymbol, color: preset.value })}
                            className={`h-9 w-9 rounded-full border-2 transition ${
                              normalizeSymbolColor(editingSymbol.color) === preset.value
                                ? 'scale-105 border-slate-900 dark:border-slate-100'
                                : 'border-white hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-500'
                            }`}
                            style={{ backgroundColor: preset.cssVar }}
                            aria-label={`Seleccionar color ${preset.value}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={getColorInputValue(editingSymbol.color ?? DEFAULT_SYMBOL_COLOR)}
                          onChange={e => setEditingSymbol({ ...editingSymbol, color: e.target.value })}
                          className="h-10 w-14 cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-elevated)]"
                        />
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Color personalizado</span>
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{normalizeSymbolColor(editingSymbol.color)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Estado en Tablero</label>
                      <div className="space-y-2">
                        {STATE_OPTIONS.map(opt => (
                          <label key={opt.value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${editingSymbol.state === opt.value ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'ui-secondary-button'}`} style={{ borderColor: editingSymbol.state === opt.value ? 'var(--app-predicted-border)' : undefined }}>
                            <input
                              type="radio"
                              name="state"
                              value={opt.value}
                              checked={editingSymbol.state === opt.value}
                              onChange={() => setEditingSymbol({ ...editingSymbol, state: opt.value })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                {editingSymbol.id && !String(editingSymbol.id).startsWith('folder-item-') && (
                  <button
                    onClick={handleDeleteEditingSymbol}
                    type="button"
                    className="mr-auto rounded-2xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25"
                  >
                    Eliminar símbolo
                  </button>
                )}
                <button onClick={() => setEditingSymbol(null)} className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition dark:text-slate-300">
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  className="ui-primary-button rounded-2xl px-6 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Guardar en Grid
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!creatingProfile) {
                  setShowCreateProfileModal(false)
                  setNewProfileName('')
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative w-full max-w-md overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Crear perfil</h3>
                <button
                  onClick={() => {
                    if (!creatingProfile) {
                      setShowCreateProfileModal(false)
                      setNewProfileName('')
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProfile} className="p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del perfil</label>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Ej. María"
                    autoFocus
                    required
                  />
                </div>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Se creará un perfil nuevo vacío para personalizar su grid desde este panel.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateProfileModal(false)
                      setNewProfileName('')
                    }}
                    className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
                    disabled={creatingProfile}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="ui-primary-button rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70"
                    disabled={creatingProfile || !newProfileName.trim()}
                  >
                    {creatingProfile ? 'Creando...' : 'Crear perfil'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profileBeingEdited && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!savingProfileChanges) {
                  setProfileBeingEdited(null)
                  setEditProfileName('')
                  setMarkEditedProfileAsDefault(false)
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative w-full max-w-md overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar perfil</h3>
                <button
                  onClick={() => {
                    if (!savingProfileChanges) {
                      setProfileBeingEdited(null)
                      setEditProfileName('')
                      setMarkEditedProfileAsDefault(false)
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditProfile} className="p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del perfil</label>
                  <input
                    type="text"
                    value={editProfileName}
                    onChange={(e) => setEditProfileName(e.target.value)}
                    className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Nombre del perfil"
                    autoFocus
                    required
                  />
                </div>

                {!profileBeingEdited.isDemo && (
                  <label className="ui-secondary-button mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={markEditedProfileAsDefault}
                      onChange={(e) => setMarkEditedProfileAsDefault(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Establecer este perfil como por defecto.</span>
                  </label>
                )}

                {profileBeingEdited.isDemo && (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Este es el perfil por defecto actual y no se puede eliminar.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileBeingEdited(null)
                      setEditProfileName('')
                      setMarkEditedProfileAsDefault(false)
                    }}
                    className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
                    disabled={savingProfileChanges}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="ui-primary-button rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-70"
                    disabled={savingProfileChanges || !editProfileName.trim()}
                  >
                    {savingProfileChanges ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profilePendingDeletion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-xl"
              style={{ background: 'var(--app-modal-backdrop)' }}
              onClick={() => {
                if (!deletingProfileId) {
                  setProfilePendingDeletion(null)
                  setDeleteProfileNameConfirmation('')
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="ui-modal-panel relative w-full max-w-md overflow-hidden rounded-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-slate-100/80 bg-[var(--app-surface-muted)] p-6 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Eliminar perfil</h3>
                <button
                  onClick={() => {
                    if (!deletingProfileId) {
                      setProfilePendingDeletion(null)
                      setDeleteProfileNameConfirmation('')
                    }
                  }}
                  className="ui-icon-button rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={confirmDeleteProfile} className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Esta acción eliminará el perfil y sus símbolos. Para confirmar, escribe exactamente:
                </p>
                <p className="mt-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
                  {profilePendingDeletion.name}
                </p>

                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nombre del perfil</label>
                  <input
                    type="text"
                    value={deleteProfileNameConfirmation}
                    onChange={(e) => setDeleteProfileNameConfirmation(e.target.value)}
                    className="app-input w-full rounded-xl px-4 py-2.5 text-sm focus:border-rose-500 focus:ring-rose-500"
                    placeholder="Escribe el nombre exacto"
                    autoFocus
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePendingDeletion(null)
                      setDeleteProfileNameConfirmation('')
                    }}
                    className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition dark:text-slate-300"
                    disabled={Boolean(deletingProfileId)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-70"
                    disabled={Boolean(deletingProfileId) || deleteProfileNameConfirmation.trim() !== profilePendingDeletion.name}
                  >
                    {deletingProfileId ? 'Eliminando...' : 'Eliminar perfil'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
