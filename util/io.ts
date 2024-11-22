import { type Response } from 'express'
import fs from 'fs/promises'
import mustache from 'mustache'
import path from 'path';

const cache: { [key: string]: string } = {}
const ENABLE_CACHE = false

/**
 * Loads a file into memory.
 * Caches the file when caching is enabled.
 * 
 * @param name  The name of the file to load.
 * @returns     The contents of the file.
 */
const load = async(name: string): Promise<string> => {
  if (ENABLE_CACHE) {
    if (cache[name]) 
      return cache[name]
  }
  
  const buf = await fs.readFile(path.join(__dirname, '..', 'views', name + '.html'))
  return cache[name] = buf.toString('utf8')
}

/**
 * Renders the given page on the client side with the mustache tags replaced.
 * 
 * @param res       The response object to call. 
 * @param name      The name of the file (template) to use.
 * @param opts      The options for populating the file with values (thru mustache).
 */
export const render = async(res: Response, name: string, opts: {}) => 
  res.send(mustache.render(await load(name), opts))
