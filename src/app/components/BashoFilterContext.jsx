'use client'
/* basho_filter_v2: спільний стейт обраного басьо між хедером і табами */
import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
import { currentBashoId } from '../lib/bashoCalendar' /* auto_current_v1 */
export const CURRENT_BASHO = currentBashoId()

export function BashoFilterProvider({ children }) {
  const [selBasho, setSelBasho] = useState(CURRENT_BASHO)
  const [division, setDivision] = useState('Makuuchi')  /* division_ctx_v1 */
  return <Ctx.Provider value={{ selBasho, setSelBasho, division, setDivision }}>{children}</Ctx.Provider>
}
export function useBashoFilter() {
  return useContext(Ctx) || { selBasho: CURRENT_BASHO, setSelBasho: () => {}, division: 'Makuuchi', setDivision: () => {} }
}
