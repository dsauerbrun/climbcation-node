import { sql } from'kysely'
import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { FilterLocation } from "./types.js"
import { getDateRanges } from "../location.service/get-date-ranges.js"
import { getClimbingTypes } from "../location.service/index.js"
import { getGradesForLocations } from "../location.service/get-grades.js"

interface LatLng {
  longitude: number
  latitude: number
}

export interface LocationRequest {
  filter: {
    climbingTypes: string[]
    startMonth: number
    endMonth: number
    grades: {[key: number]: number[]}
    noCar: boolean
    rating: number[]
    search: string
    soloFriendly: boolean
  }
  mapFilter: {
    northEast: LatLng
    southWest: LatLng
  }
  cursor?: string
  sort?: {sortName: string, sortDirection: string}[]

}

interface LocationResponse extends ServiceResponseError {
  locations?: FilterLocation[]
  cursor?: string
}

export const getLocations = async ({ filter, mapFilter, cursor, sort }: LocationRequest): Promise<LocationResponse> => {
  try {
    // fetch location

    let locationQuery = db.selectFrom('locations')
      .where('active', 'is', true)
      .selectAll('locations')
      .limit(10)

    if (filter?.climbingTypes?.length > 0) {
      locationQuery = locationQuery.innerJoin('climbingTypesLocations', 'climbingTypesLocations.locationId', 'locations.id')
        .innerJoin('climbingTypes', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id')
        .where('climbingTypes.name', 'in', filter.climbingTypes)
    }

    if(filter?.startMonth && filter?.endMonth) {
      const monthsToFilter = getMonthsToFilter(filter.startMonth, filter.endMonth)
      locationQuery = locationQuery
        .innerJoin('locationsSeasons', 'locationsSeasons.locationId', 'locations.id')
        .innerJoin('seasons', 'locationsSeasons.seasonId', 'seasons.id')
        .where('seasons.numericalValue', 'in', monthsToFilter)
    }

    if (filter?.grades) {
      const gradeFilter = []
      const climbingTypeGradeFilter = []
      for (const [typeId, grades] of Object.entries(filter.grades)) {
        climbingTypeGradeFilter.push(typeId)
        grades.forEach(grade => gradeFilter.push(grade))
      }
      locationQuery = locationQuery.innerJoin('gradesLocations', 'gradesLocations.locationId', 'locations.id')
        .where(({ eb, or, not, exists }) => 
          or([
            // if grade id is in the filter
            eb('gradesLocations.gradeId', 'in', gradeFilter),
            // if the location has a climbing type that isn't being queried in the grade filter
            // the way this works:
            // get all the climbing types that are being queried in the grade filter
            // if the location has a climbing type that isn't being queried in the grade filter, then we want to include it
            // for example: lets say we are filtering by sport climbing and bouldering:v1, we want bishop to be expluded because its too hard
            // HOWEVER, kalymnos doesn't have any bouldering, so we want to include it
            not(exists(sql`(
                SELECT 1 FROM grades_locations as t1
                inner join grades as t2 on t2.id = t1.grade_id
                WHERE locations.id = t1.location_id and
                t2.climbing_type_id in (${climbingTypeGradeFilter.join(',')})
              )`
            ))
          ])
        )
    }

    if (filter?.noCar) {
      locationQuery = locationQuery.where('walkingDistance', 'is', true)
    }

    if (filter?.rating?.length > 0) {
      locationQuery = locationQuery.where('rating', 'in', filter.rating)
    }

    if (filter?.search) {
      const lowercaseSearchQuery = filter.search.toLowerCase()
      locationQuery = locationQuery
        .leftJoin('infoSections', 'infoSections.locationId', 'locations.id')
        .where(({ eb, or }) => or([
          eb(sql`lower(locations.name)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.country)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.continent)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.getting_in_notes)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.accommodation_notes)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.common_expenses_notes)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(locations.saving_money_tips)`, 'like', `%${lowercaseSearchQuery}%`),
          eb(sql`lower(info_sections.body)`, 'like', `%${lowercaseSearchQuery}%`)
        ]))
    }

    if (filter?.soloFriendly) {
      locationQuery = locationQuery.where('soloFriendly', 'is', true)
    }
    
    const locations = await locationQuery.execute()

    const locationIds = locations.map(location => location.id)

    const { ranges } = await getDateRanges({locationIds})
    const locationRanges = ranges.reduce((acc, range) => {
      acc[range.locationId] = range.dateRange
      return acc
    }, {} as {[key: number]: string})

    const climbingTypes = await getClimbingTypes({ locationIds })
    const { grades } = await getGradesForLocations({ locationIds })

    // group locations by id
    const groupedLocations = locations.reduce((acc, location) => {
      acc[location.id] = location
      return acc
    }, {} as {[key: number]: typeof locations[0]})

    return {
      locations: Object.values(groupedLocations).map(location => {
        return {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          dateRange: locationRanges[location.id],
          name: location.name,
          homeThumb: location.homeThumbFileName,
          rating: location.rating,
          slug: location.slug,
          climbingTypes: climbingTypes[location.id],
          grades: grades[location.id],
          walkingDistance: location.walkingDistance,
          soloFriendly: location.soloFriendly
        }
      })
    }

  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }

}

const getMonthsToFilter = (startMonth: number, endMonth: number): number[] => {
  const monthsToFilter = []
  if (startMonth === endMonth) {
    return [startMonth]
  }

  if (startMonth > endMonth) {
    for (let i = 1; i <= endMonth; i++) {
      monthsToFilter.push(i)
    }
    for (let i = startMonth; i <= 12; i++) {
      monthsToFilter.push(i)
    }

    return monthsToFilter;
  }

  if (startMonth < endMonth) {
    for (let i = startMonth; i <= endMonth; i++) {
      monthsToFilter.push(i)
    }
    return monthsToFilter;
  }
}