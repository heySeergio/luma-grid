'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2, User } from 'lucide-react'
import { DEFAULT_SYMBOLS } from '@/lib/data/defaultSymbols'
import { getLocalProfiles, getLocalSymbols, saveLocalProfiles, saveLocalSymbols } from '@/lib/localGridStore'
import { applyProfileGenders, setProfileGender } from '@/lib/profileGender'
import type { Grid, PosType, Profile, ProfileGender, Symbol } from '@/lib/supabase/types'

type EditableSymbol = Symbol

const POS_OPTIONS: PosType[] = ['pronoun', 'verb', 'noun', 'adj', 'adverb', 'other']
const POS_LABELS: Record<PosType, string> = {
  pronoun: 'Pronombre',
  verb: 'Verbo',
  noun: 'Sustantivo',
  adj: 'Adjetivo',
  adverb: 'Adverbio',
  other: 'Otro',
}

const EMPTY_SYMBOL: Omit<EditableSymbol, 'id' | 'grid_id' | 'created_at' | 'updated_at'> = {
  label: '',
  emoji: '',
  image_url: '',
  category: 'General',
  pos_type: 'noun',
  position_x: 0,
  position_y: 0,
  color: '#f8fafc',
  hidden: false,
  arasaac_id: undefined,
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [grid, setGrid] = useState<Grid | null>(null)
  const [symbols, setSymbols] = useState<EditableSymbol[]>([])
  const [newSymbol, setNewSymbol] = useState(EMPTY_SYMBOL)
  const [status, setStatus] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [uploadingNewImage, setUploadingNewImage] = useState(false)
  const [uploadingSymbolIds, setUploadingSymbolIds] = useState<Record<string, boolean>>({})

  const selectedProfile = useMemo(
    () => profiles.find(profile => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  )

  const loadProfiles = useCallback(async () => {
    setLoadingData(true)
    setStatus('')
    const fetchedProfiles = applyProfileGenders(getLocalProfiles())
    setProfiles(fetchedProfiles)
    if (fetchedProfiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(fetchedProfiles[0].id)
    }
    setIsDemoMode(true)
    setStatus('Editor en modo local.')
    setLoadingData(false)
  }, [selectedProfileId])

  const loadGridAndSymbols = useCallback(async (profileId: string) => {
    if (!profileId) return
    setGrid({
      id: 'local-grid-1',
      profile_id: profileId,
      name: 'Grid principal local',
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setSymbols(getLocalSymbols())
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    if (!selectedProfileId) return
    loadGridAndSymbols(selectedProfileId)
  }, [loadGridAndSymbols, selectedProfileId])

  const updateSymbol = async (symbol: EditableSymbol) => {
    if (isDemoMode || symbol.id.startsWith('demo-')) {
      setStatus(`Simbolo actualizado en demo: ${symbol.label}`)
      return
    }
    saveLocalSymbols(symbols)
    setStatus(`Simbolo guardado: ${symbol.label}`)
  }

  const uploadImage = async (file: File, _prefix: string) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('No se pudo leer la imagen.'))
      }
      reader.onerror = () => reject(new Error('Error leyendo archivo de imagen.'))
      reader.readAsDataURL(file)
    })
  }

  const createSymbol = async () => {
    if (!grid || !newSymbol.label.trim()) {
      setStatus('Escribe al menos una etiqueta para crear el simbolo.')
      return
    }

    if (isDemoMode || grid.id === 'demo-grid') {
      const created: EditableSymbol = {
        id: `demo-new-${Date.now()}`,
        grid_id: grid.id,
        label: newSymbol.label.trim(),
        emoji: newSymbol.emoji || undefined,
        image_url: newSymbol.image_url || undefined,
        category: newSymbol.category || 'General',
        pos_type: newSymbol.pos_type,
        position_x: Number(newSymbol.position_x) || 0,
        position_y: Number(newSymbol.position_y) || 0,
        color: newSymbol.color || '#f8fafc',
        hidden: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setSymbols(previous => [...previous, created])
      setNewSymbol(EMPTY_SYMBOL)
      setStatus('Simbolo creado en demo local.')
      return
    }

    const created: EditableSymbol = {
      id: `local-new-${Date.now()}`,
      grid_id: grid.id,
      label: newSymbol.label.trim(),
      emoji: newSymbol.emoji || undefined,
      image_url: newSymbol.image_url || undefined,
      category: newSymbol.category || 'General',
      pos_type: newSymbol.pos_type,
      position_x: Number(newSymbol.position_x) || 0,
      position_y: Number(newSymbol.position_y) || 0,
      color: newSymbol.color || '#f8fafc',
      hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const updated = [...symbols, created]
    setSymbols(updated)
    saveLocalSymbols(updated)
    setNewSymbol(EMPTY_SYMBOL)
    setStatus('Simbolo creado correctamente en local.')
  }

  const uploadImageForNewSymbol = async (file: File) => {
    if (!newSymbol.label.trim()) {
      setStatus('Escribe primero la etiqueta del simbolo para subir la imagen.')
      return
    }
    try {
      setUploadingNewImage(true)
      const imageUrl = await uploadImage(file, `new-${newSymbol.label}`)
      setNewSymbol(previous => ({ ...previous, image_url: imageUrl }))
      setStatus('Icono subido correctamente para nuevo simbolo.')
    } catch (err) {
      setStatus(`Error al subir icono: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setUploadingNewImage(false)
    }
  }

  const uploadImageForSymbol = async (symbolId: string, file: File) => {
    const symbol = symbols.find(item => item.id === symbolId)
    if (!symbol) return
    try {
      setUploadingSymbolIds(previous => ({ ...previous, [symbolId]: true }))
      const imageUrl = await uploadImage(file, `symbol-${symbol.label}`)
      setSymbols(previous =>
        previous.map(item => (item.id === symbolId ? { ...item, image_url: imageUrl } : item))
      )
      setStatus(`Icono subido para "${symbol.label}". Pulsa Guardar para confirmar.`)
    } catch (err) {
      setStatus(`Error al subir icono: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      setUploadingSymbolIds(previous => ({ ...previous, [symbolId]: false }))
    }
  }

  const deleteSymbol = async (symbolId: string) => {
    const target = symbols.find(symbol => symbol.id === symbolId)
    if (isDemoMode || symbolId.startsWith('demo-')) {
      setSymbols(previous => previous.filter(symbol => symbol.id !== symbolId))
      setStatus(`Simbolo eliminado en demo: ${target?.label ?? symbolId}`)
      return
    }
    const updated = symbols.filter(symbol => symbol.id !== symbolId)
    setSymbols(updated)
    saveLocalSymbols(updated)
    setStatus(`Simbolo eliminado: ${target?.label ?? symbolId}`)
  }

  const updateProfileGender = (gender: ProfileGender) => {
    if (!selectedProfile) return
    setProfileGender(selectedProfile.id, gender)
    setProfiles(previous => {
      const updatedProfiles = previous.map(profile =>
        profile.id === selectedProfile.id ? { ...profile, communication_gender: gender } : profile
      )
      saveLocalProfiles(updatedProfiles)
      return updatedProfiles
    })
    setStatus(`Genero de comunicacion actualizado: ${gender === 'female' ? 'chica' : 'chico'}`)
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl gap-4 p-4">
        <aside className="w-72 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Perfiles</h2>
          <div className="space-y-2">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
                  selectedProfileId === profile.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                }`}
              >
                <User size={16} />
                <span className="truncate font-medium">{profile.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Editor de grid</h1>
            <p className="mt-1 text-sm text-slate-600">
              Perfil: <span className="font-semibold">{selectedProfile?.name ?? 'Sin seleccionar'}</span>
              {' · '}
              Grid: <span className="font-semibold">{grid?.name ?? 'Sin grid'}</span>
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm font-medium text-slate-700">Genero de comunicacion:</span>
              <select
                value={selectedProfile?.communication_gender ?? 'male'}
                onChange={event => updateProfileGender(event.target.value as ProfileGender)}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="male">Chico (masculino)</option>
                <option value="female">Chica (femenino)</option>
              </select>
            </div>
            {status && <p className="mt-2 text-sm text-indigo-700">{status}</p>}
            {loadingData && <p className="mt-2 text-sm text-slate-500">Cargando datos...</p>}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Nuevo simbolo</h2>
            <div className="grid gap-2 md:grid-cols-4">
              <input
                value={newSymbol.label}
                onChange={event => setNewSymbol(previous => ({ ...previous, label: event.target.value }))}
                placeholder="Etiqueta"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                value={newSymbol.emoji}
                onChange={event => setNewSymbol(previous => ({ ...previous, emoji: event.target.value }))}
                placeholder="Emoji"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                value={newSymbol.category}
                onChange={event => setNewSymbol(previous => ({ ...previous, category: event.target.value }))}
                placeholder="Categoria"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <select
                value={newSymbol.pos_type}
                onChange={event => setNewSymbol(previous => ({ ...previous, pos_type: event.target.value as PosType }))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                {POS_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {POS_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <input
                value={newSymbol.image_url ?? ''}
                onChange={event => setNewSymbol(previous => ({ ...previous, image_url: event.target.value }))}
                placeholder="URL icono/imagen (opcional)"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <label className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                {uploadingNewImage ? 'Subiendo icono...' : 'Subir icono'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingNewImage}
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) uploadImageForNewSymbol(file)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newSymbol.category === 'Carpetas'}
                  onChange={event =>
                    setNewSymbol(previous => ({
                      ...previous,
                      category: event.target.checked ? 'Carpetas' : previous.category || 'General',
                      pos_type: event.target.checked ? 'other' : previous.pos_type,
                    }))
                  }
                />
                Es carpeta
              </label>
            </div>
            <button
              onClick={createSymbol}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Plus size={16} />
              Crear simbolo
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Emoji</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Icono</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Etiqueta</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Categoria</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">POS</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">X</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Y</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {symbols.map(symbol => (
                    <tr key={symbol.id}>
                      <td className="px-3 py-2">
                        <input
                          value={symbol.emoji ?? ''}
                          onChange={event => {
                            const value = event.target.value
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, emoji: value } : item))
                            )
                          }}
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={symbol.image_url ?? ''}
                            onChange={event => {
                              const value = event.target.value
                              setSymbols(previous =>
                                previous.map(item => (item.id === symbol.id ? { ...item, image_url: value } : item))
                              )
                            }}
                            placeholder="URL"
                            className="w-40 rounded border border-slate-300 px-2 py-1"
                          />
                          <label className="inline-flex items-center rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                            {uploadingSymbolIds[symbol.id] ? 'Subiendo...' : 'Subir'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={Boolean(uploadingSymbolIds[symbol.id])}
                              onChange={event => {
                                const file = event.target.files?.[0]
                                if (file) uploadImageForSymbol(symbol.id, file)
                                event.currentTarget.value = ''
                              }}
                            />
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={symbol.label}
                          onChange={event => {
                            const value = event.target.value
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, label: value } : item))
                            )
                          }}
                          className="w-40 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={symbol.category}
                          onChange={event => {
                            const value = event.target.value
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, category: value } : item))
                            )
                          }}
                          className="w-32 rounded border border-slate-300 px-2 py-1"
                        />
                        <label className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={symbol.category === 'Carpetas'}
                            onChange={event => {
                              const checked = event.target.checked
                              setSymbols(previous =>
                                previous.map(item =>
                                  item.id === symbol.id
                                    ? {
                                      ...item,
                                      category: checked ? 'Carpetas' : item.category === 'Carpetas' ? 'General' : item.category,
                                      pos_type: checked ? 'other' : item.pos_type,
                                    }
                                    : item
                                )
                              )
                            }}
                          />
                          Carpeta
                        </label>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={symbol.pos_type}
                          onChange={event => {
                            const value = event.target.value as PosType
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, pos_type: value } : item))
                            )
                          }}
                          className="rounded border border-slate-300 px-2 py-1"
                        >
                          {POS_OPTIONS.map(option => (
                            <option key={option} value={option}>
                              {POS_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={symbol.position_x}
                          onChange={event => {
                            const value = Number(event.target.value)
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, position_x: value } : item))
                            )
                          }}
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={symbol.position_y}
                          onChange={event => {
                            const value = Number(event.target.value)
                            setSymbols(previous =>
                              previous.map(item => (item.id === symbol.id ? { ...item, position_y: value } : item))
                            )
                          }}
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateSymbol(symbol)}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                          >
                            <Save size={13} />
                            Guardar
                          </button>
                          <button
                            onClick={() => deleteSymbol(symbol.id)}
                            className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                          >
                            <Trash2 size={13} />
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
