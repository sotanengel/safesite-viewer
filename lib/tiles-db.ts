/**
 * Lazy singleton for the local SQLite tile cache.
 * Returns null when tiles.db does not exist (graceful degradation).
 */
import Database from 'better-sqlite3'
import path from 'path'

let _db: Database.Database | null | undefined = undefined

const DB_PATH =
  process.env.LOCAL_TILES_DB ?? path.join(process.cwd(), 'tiles.db')

export function getTilesDb(): Database.Database | null {
  if (_db !== undefined) return _db
  try {
    _db = new Database(DB_PATH, { readonly: true, fileMustExist: true })
  } catch {
    _db = null
  }
  return _db
}
