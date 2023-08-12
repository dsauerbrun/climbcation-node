import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { LocationName } from "./types.js"



interface LocationNamesResponse extends ServiceResponseError {
  names?: LocationName[] 
}

export const getAllLocationNames = async (): Promise<LocationNamesResponse> => {

  try {
    const dbLocations = await db.selectFrom('locations')
      .select([
        'name',
        'slug',
      ]
      ).execute()

    if (!dbLocations?.length) {
      return { error: 'no locations found.' }
    }

    return {
      names: dbLocations
    }

  } catch (err) {
    const error = err as Error
    console.error('Error fetching location names', err)
    return { error: error.message }
  }

}
