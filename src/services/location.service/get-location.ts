import { DateTime } from "luxon"
import db from "../../db/index.js"
import { getNearbyLocations } from "./get-nearby-locations.js"
import { getDateRanges } from "./get-date-ranges.js"
import { ClimbingType, FullLocation } from "./types.js"
import {sql} from 'kysely'
import { getTransportations } from "./get-transportations.js"
import { getFoodOptions } from "./get-food-options.js"
import { getGrades } from "./get-grades.js"
import { getAccommodations } from "./get-accommodations.js"

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
      .leftJoin('infoSections', 'infoSections.locationId', 'locations.id')
      .where('slug', '=', locationSlug)
      .selectAll('locations')
      .select([
        'infoSections.id as infoSectionId',
        'infoSections.title as infoSectionTitle',
        'infoSections.body as infoSectionBody',
      ]
      ).execute()

    if (!dbLocation?.length) {
      return { error: 'no location found.' }
    }

    const location = dbLocation[0]
    const infoSections = dbLocation.map(section => {
      return {
        id: section.infoSectionId,
        title: section.infoSectionTitle,
        body: section.infoSectionBody,
      }
    }).filter(section => section.id)

    const climbingTypes = await getClimbingTypes({ locationId: location.id })


    const {
      id, latitude, longitude,
      name, airportCode, accommodationNotes, homeThumbFileName,
      closestAccommodation, commonExpensesNotes, country,
      continent, gettingInNotes, active, rating, slug,
      createdAt, updatedAt, savingMoneyTips, soloFriendly, walkingDistance
    } = location
    const {ranges: [dateRange]} = await getDateRanges({ locationIds: [id] });
    const closeLocations = await getNearbyLocations({ locationId: id })

    // get transportations
    const { transportations } = await getTransportations({ locationId: id })
    const bestTransportation = transportations.find(x => x.cost)
    const { foodOptions } = await getFoodOptions({ locationId: id })
    // get grades
    const { grades } = await getGrades({ locationId: id })
    // get accommodations
    const { accommodations } = await getAccommodations({ locationId: id })

    return {
      location: {
        id,
        name,
        latitude,
        longitude,
        dateRange: dateRange.dateRange,
        nearby: closeLocations,
        infoSections,
        climbingTypes,
        airportCode,
        accommodationNotes,
        closestAccommodation,
        commonExpensesNotes,
        country,
        continent,
        gettingInNotes,
        active,
        rating,
        slug,
        savingMoneyTips,
        soloFriendly,
        walkingDistance,
        createdAt: DateTime.fromJSDate(createdAt),
        updatedAt: DateTime.fromJSDate(updatedAt),
        bestTransportation,
        transportations,
        homeThumb: homeThumbFileName,
        foodOptions,
        grades,
        accommodations,
      }
    }

  } catch (err) {
    const error = err as Error
    console.error('Error fetching location', err)
    return { error: error.message }
  }

}

const getClimbingTypes = async ({ locationId }: { locationId: number }): Promise<ClimbingType[]> => {
  const climbingTypes = await db.selectFrom('climbingTypes')
    .innerJoin('climbingTypesLocations', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id') 
    .select(['climbingTypes.id', 'climbingTypes.name', 'climbingTypes.iconFileName as url'])
    .where('climbingTypesLocations.locationId', '=', locationId)
    .execute()
  return climbingTypes
}