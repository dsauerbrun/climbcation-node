import db from "../../db/index.js";
import { getDateRanges } from "./get-date-ranges.js";
import { NearbyLocation } from "./types.js";
import {sql} from 'kysely'

interface NearbyLocationArgs {
  locationId: number;
}
const getNearbyLocations = async ({ locationId }: NearbyLocationArgs): Promise<NearbyLocation[]> => {
  const maxRadiusMiles = 300;
  
  const { latitude, longitude } = await db.selectFrom('locations')
    .select(['latitude', 'longitude'])
    .where('id', '=', locationId).executeTakeFirstOrThrow()

  const closeLocations = await db.selectFrom('locations')
    .leftJoin('climbing_types_locations', 'climbing_types_locations.location_id', 'locations.id')
    .leftJoin('climbing_types', 'climbing_types_locations.climbing_type_id', 'climbing_types.id')
    .where(sql`point(longitude, latitude) <@> point(${longitude}, ${latitude}) < ${maxRadiusMiles}`)
    .where('locations.id', '!=', locationId)
    .select([
      'locations.id',
      'locations.latitude',
      'locations.longitude',
      'locations.slug',
      'locations.name',
      'locations.home_thumb_file_name',
      'locations.country',
      sql<string>`point(longitude, latitude) <@> point(${longitude}, ${latitude})`. as(`distance`),
      'climbing_types.name as climbing_type_name',
      'climbing_types.id as climbing_type_id',
      'climbing_types.icon_file_name as climbing_type_url',
    ])
    .execute()


  // get date ranges for close locations
  const locationIds = closeLocations.map(location => location.id)
  const { ranges } = await getDateRanges({ locationIds })

  const groupedLocations =  closeLocations.reduce((hash, currLocation) => {
    if (!hash[currLocation.id]) {
      const { dateRange } = ranges.find(range => range.locationId === currLocation.id)
      const {latitude, longitude, slug, name, home_thumb_file_name, country, distance, } = currLocation
      hash[currLocation.id] = {
        latitude,
        longitude,
        slug,
        name,
        homeThumb: home_thumb_file_name,
        country,
        distance: Number(distance),
        climbingTypes: [],
        dateRange,
      }
    }

    hash[currLocation.id].climbingTypes.push({ url: currLocation.climbing_type_url, name: currLocation.climbing_type_name, id: currLocation.climbing_type_id})

    return hash
  }, {} as {[key: number]: NearbyLocation})

  return Object.values(groupedLocations).sort((a, b) => a.distance - b.distance);
}


export {
  getNearbyLocations
}