import { Kysely, sql } from 'kysely'
import { DB } from 'kysely-codegen';

export async function up(db: Kysely<DB>): Promise<void> {
  const accommodations = await db.selectFrom('accommodations').selectAll('accommodations').execute()
  for (const accommodation of accommodations) {
    const { id, iconFileName } = accommodation
    const newIconFileName = `https://climbcation.s3.amazonaws.com/accommodations/icons/000/000/${String(id).padStart(3, '0')}/original/${iconFileName}`
    await db.updateTable('accommodations').set({ iconFileName: newIconFileName }).where('id', '=', id).execute()
  }

  const climbingTypes = await db.selectFrom('climbingTypes').selectAll('climbingTypes').execute()
  for (const climbingType of climbingTypes) {
    const { id, iconFileName } = climbingType
    const newIconFileName = `https://climbcation.s3.amazonaws.com/climbing_types/icons/000/000/${String(id).padStart(3, '0')}/original/${iconFileName}`
    await db.updateTable('climbingTypes').set({ iconFileName: newIconFileName }).where('id', '=', id).execute()
  }

  const locations = await db.selectFrom('locations').selectAll('locations').execute()
  for (const location of locations) {
    const { id, homeThumbFileName } = location
    const newIconFileName = `https://climbcation.s3.amazonaws.com/locations/home_thumbs/000/000/${String(id).padStart(3, '0')}/original/${homeThumbFileName}`
    await db.updateTable('locations').set({ homeThumbFileName: newIconFileName }).where('id', '=', id).execute()
  }
}

export async function down(db: Kysely<DB>): Promise<void> {
  const accommodations = await db.selectFrom('accommodations').selectAll('accommodations').execute()
  for (const accommodation of accommodations) {
    const { id, iconFileName } = accommodation
    // get last part of the url after last slash
    const iconFileNameParts = iconFileName.split('/')
    const iconFileNameLastPart = iconFileNameParts[iconFileNameParts.length - 1]
    await db.updateTable('accommodations').set({ iconFileName: iconFileNameLastPart }).where('id', '=', id).execute()
  }

  const climbingTypes = await db.selectFrom('climbingTypes').selectAll('climbingTypes').execute()
  for (const climbingType of climbingTypes) {
    const { id, iconFileName } = climbingType
    // get last part of the url after last slash
    const iconFileNameParts = iconFileName.split('/')
    const iconFileNameLastPart = iconFileNameParts[iconFileNameParts.length - 1]
    await db.updateTable('climbingTypes').set({ iconFileName: iconFileNameLastPart }).where('id', '=', id).execute()
  }

  const locations = await db.selectFrom('locations').selectAll('locations').execute()
  for (const location of locations) {
    const { id, homeThumbFileName } = location
    // get last part of the url after last slash
    const homeThumbFileNameParts = homeThumbFileName.split('/')
    const homeThumbFileNameLastPart = homeThumbFileNameParts[homeThumbFileNameParts.length - 1]
    await db.updateTable('locations').set({ homeThumbFileName: homeThumbFileNameLastPart }).where('id', '=', id).execute()
  }
}