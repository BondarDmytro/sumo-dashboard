import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: 'nvmyfpgv',
  dataset: 'production',
  apiVersion: '2026-05-21',
  useCdn: false,
})

export async function getTournament() {
  return client.fetch(`*[_type == "tournament"][0]`)
}

export async function getRikishi() {
  return client.fetch(`*[_type == "rikishi"] | order(order asc)`)
}

export async function getMatches() {
  return client.fetch(`*[_type == "match"] | order(order asc)`)
}
