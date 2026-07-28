'use client'
/* basho_filter_v2: спільний стейт обраного башьо між хедером і табами */
import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
import { currentBashoId } from '../lib/bashoCalendar' /* auto_current_v1 */
export const CURRENT_BASHO = currentBashoId()  /* ctx_live_basho_v1: deprecated - zastyhaie na bildi; novyi kod - currentBashoId() napriamu */

export function BashoFilterProvider({ children }) {
  const [selBasho, setSelBasho] = useState(() => currentBashoId())  /* ctx_live_basho_v1 */
  const [division, setDivision] = useState('Makuuchi')  /* division_ctx_v1 */
  return <Ctx.Provider value={{ selBasho, setSelBasho, division, setDivision }}>{children}</Ctx.Provider>
}
export function useBashoFilter() {
  return useContext(Ctx) || { selBasho: currentBashoId(), setSelBasho: () => {}, division: 'Makuuchi', setDivision: () => {} }  /* ctx_live_basho_v1 */
}
