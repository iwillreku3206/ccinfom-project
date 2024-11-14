import fs from 'fs/promises'
import path from 'path'

const cache: { [key: string]: string } = {}
const ENABLE_CACHE = false

export async function loadTemplate(name: string): Promise<string> {
  if (ENABLE_CACHE) {
  if (cache[name]) return cache[name]
  }
  const buf = await fs.readFile(path.join(__dirname, '..', 'views', name + '.html'))
  return cache[name] = buf.toString('utf8')
}
