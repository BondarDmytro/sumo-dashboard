import { sanityFetch } from './lib/live'

export async function getTournament() {
  const { data } = await sanityFetch({
    query: `*[_type == "tournament"][0]`
  })
  return data
}

export async function getRikishi() {
  const { data } = await sanityFetch({
    query: `*[_type == "rikishi"] | order(order asc)`
  })
  return data
}

export async function getMatches() {
  const { data } = await sanityFetch({
    query: `*[_type == "match"] | order(order asc)`
  })
  return data
}
