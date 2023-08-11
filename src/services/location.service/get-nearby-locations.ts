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
    .leftJoin('climbingTypesLocations', 'climbingTypesLocations.locationId', 'locations.id')
    .leftJoin('climbingTypes', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id')
    .where(sql`point(longitude, latitude) <@> point(${longitude}, ${latitude}) < ${maxRadiusMiles}`)
    .where('locations.id', '!=', locationId)
    .select([
      'locations.id',
      'locations.latitude',
      'locations.longitude',
      'locations.slug',
      'locations.name',
      'locations.homeThumbFileName',
      'locations.country',
      sql<string>`point(longitude, latitude) <@> point(${longitude}, ${latitude})`. as(`distance`),
      'climbingTypes.name as climbingTypeName',
      'climbingTypes.id as climbingTypeId',
      'climbingTypes.iconFileName as climbingTypeUrl',
    ])
    .execute()

  if (!closeLocations?.length) {
    return []
  }

  // get date ranges for close locations
  const locationIds = closeLocations.map(location => location.id)
  const { ranges } = await getDateRanges({ locationIds })

  const groupedLocations =  closeLocations.reduce((hash, currLocation) => {
    if (!hash[currLocation.id]) {
      const { dateRange } = ranges.find(range => range.locationId === currLocation.id)
      const {latitude, longitude, slug, name, homeThumbFileName, country, distance, } = currLocation
      hash[currLocation.id] = {
        latitude,
        longitude,
        slug,
        name,
        homeThumb: homeThumbFileName,
        country,
        distance: Number(distance),
        climbingTypes: [],
        dateRange,
      }
    }

    hash[currLocation.id].climbingTypes.push({ url: currLocation.climbingTypeUrl, name: currLocation.climbingTypeName, id: currLocation.climbingTypeId})

    return hash
  }, {} as {[key: number]: NearbyLocation})

  return Object.values(groupedLocations).sort((a, b) => a.distance - b.distance);
}


export {
  getNearbyLocations
}