'use client'
/* basho_filter_v2: спільний стейт обраного басьо між хедером і табами */
import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
import { currentBashoId } from '../lib/bashoCalendar' /* auto_current_v1 */
export const CURRENT_BASHO = currentBashoId()

export function BashoFilterProvider({ children }) {
  const [selBasho, setSelBasho] = useState(CURRENT_BASHO)
  return <Ctx.Provider value={{ selBasho, setSelBasho }}>{children}</Ctx.Provider>
}
export function useBashoFilter() {
  return useContext(Ctx) || { selBasho: CURRENT_BASHO, setSelBasho: () => {} }
}
