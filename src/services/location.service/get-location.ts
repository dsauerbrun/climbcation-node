import db from "../../db/index.js"
import { getNearbyLocations } from "./fetchers.js"
import { getDateRanges } from "./get-date-ranges.js"
import { ClimbingType, FullLocation } from "./types.js"
import {sql} from 'kysely'

interface ServiceResponseError {
  error?: string
}

interface LocationRequest {
  locationSlug: string
}

interface LocationResponse extends ServiceResponseError {
  location?: FullLocation
}

export const getLocation = async ({ locationSlug }: LocationRequest): Promise<LocationResponse> => {

  if (!locationSlug) {
    return { error: 'no location slug found.' }
  }

  try {
    // fetch location
    const dbLocation = await db.selectFrom('locations')
      .leftJoin('info_sections', 'info_sections.location_id', 'locations.id')
      .where('slug', '=', locationSlug)
      .selectAll()
      .select([
        'info_sections.id as info_section_id',
        'info_sections.title as info_section_title',
        'info_sections.body as info_section_body',
      ]

      ).execute()

    if (!dbLocation?.length) {
      return { error: 'no location found.' }
    }

    const location = dbLocation[0]
    const infoSections = dbLocation.map(section => {
      return {
        id: section.info_section_id,
        title: section.info_section_title,
        body: section.info_section_body,
      }
    })

    const climbingTypes = await getClimbingTypes({ locationId: location.id })

    

    /*return_map['nearby'] = @location.get_nearby_locations_json
		return_map['location'] = @location.get_location_json 
		return_map['sections'] = @location.get_sections*/
    const { id, latitude, longitude, name } = location
    const {ranges: [dateRange]} = await getDateRanges({ locationIds: [id] });
    const closeLocations = await getNearbyLocations({ locationId: id })
    console.log(closeLocations)

    return {
      location: {
        id,
        name,
        latitude,
        longitude,
        dateRange: dateRange.dateRange,
        nearby: closeLocations,
        infoSections,
        climbingTypes
      }
    }

  } catch (err) {
    const error = err as Error
    console.error('Error fetching location', err)
    return { error: error.message }
  }

}

const getClimbingTypes = async ({ locationId }: { locationId: number }): Promise<ClimbingType[]> => {
  const climbingTypes = await db.selectFrom('climbing_types')
    .innerJoin('climbing_types_locations', 'climbing_types_locations.climbing_type_id', 'climbing_types.id') 
    .select(['climbing_types.id', 'climbing_types.name', 'climbing_types.icon_file_name as url'])
    .where('climbing_types_locations.location_id', '=', locationId)
    .execute()
  return climbingTypes
}