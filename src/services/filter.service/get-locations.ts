import { sql, SelectQueryBuilder, expressionBuilder, Selection } from 'kysely'
import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { FilterLocation, MapLocation } from "./types.js"
import { getDateRanges } from "../location.service/get-date-ranges.js"
import { getClimbingTypes } from "../location.service/index.js"
import { getGradesForLocations } from "../location.service/get-grades.js"
import { DB } from 'kysely-codegen'

interface LatLng {
  longitude: number
  latitude: number
}

interface Sort {
  sortName: string,
  sortDirection: string,
  latlng?: LatLng
}

export interface LocationRequest {
  filter: {
    climbingTypes: string[]
    startMonth: number
    endMonth: number
    grades: {[key: number]: number[]}
    noCar: boolean
    rating: number[]
    searchQuery: string
    soloFriendly: boolean
  }
  mapFilter: {
    northeast: LatLng
    southwest: LatLng
  }
  cursor?: string
  sort?: Sort[]
}

interface LocationResponse extends ServiceResponseError {
  locations?: FilterLocation[]
  mapLocations?: MapLocation[]
  cursor?: string
}
const sortMap = {
  'name': {sortColumn: 'locations.name', cursorColumn: 'name', cursorSqlColumn: 'locations.name'},
  'rating': {sortColumn: 'locations.rating', cursorColumn: 'id', cursorSqlColumn: 'locations.id'},
  'distance': {sortColumn: 'distance', cursorColumn: 'distance', cursorSqlColumn: 'distance'},
}

export const getLocations = async ({ filter, mapFilter, cursor, sort }: LocationRequest): Promise<LocationResponse> => {
  try {
    const { longitude, latitude } = getUserLatLng(sort)

    let locationQuery = db.selectFrom('locations')
      .where('active', 'is', true)
      .select([
        'locations.id',
        'locations.latitude',
        'locations.longitude',
        'locations.name',
        'locations.country',
        'locations.continent',
        'locations.rating',
        'locations.walkingDistance',
        'locations.soloFriendly',
        'locations.homeThumbFileName',
        'locations.slug',
        sql<string>`point(longitude, latitude) <@> point(${longitude || 0}, ${latitude || 0})`. as(`distance`),
      ])
      .groupBy([
        'locations.id',
        'locations.latitude',
        'locations.longitude',
        'locations.name',
        'locations.country',
        'locations.continent',
        'locations.rating',
        'locations.walkingDistance',
        'locations.soloFriendly',
        'locations.homeThumbFileName',
        'locations.slug',
      ])

    if (filter?.climbingTypes?.length > 0) {
      locationQuery = filterByClimbingTypes(locationQuery, filter.climbingTypes);
    }

    if(filter?.startMonth && filter?.endMonth) {
      const monthsToFilter = getMonthsToFilter(filter.startMonth, filter.endMonth)
      locationQuery = filterByMonths(locationQuery, monthsToFilter)
    }

    if (filter?.grades && Object.keys(filter?.grades).length) {
      const gradeFilter = []
      const climbingTypeGradeFilter = []
      for (const [typeId, grades] of Object.entries(filter.grades)) {
        climbingTypeGradeFilter.push(typeId)
        grades.forEach(grade => gradeFilter.push(grade))
      }
      locationQuery = filterByGrades(locationQuery, climbingTypeGradeFilter, gradeFilter)
    }

    if (filter?.noCar) {
      locationQuery = locationQuery.where('walkingDistance', 'is', true)
    }

    if (filter?.rating?.length > 0) {
      locationQuery = locationQuery.where('rating', 'in', filter.rating)
    }

    if (filter?.searchQuery) {
      locationQuery = filterBySearch(locationQuery, filter.searchQuery)
    }

    if (filter?.soloFriendly) {
      locationQuery = locationQuery.where('soloFriendly', 'is', true)
    }

    if (mapFilter?.northeast && mapFilter?.southwest) {
      const { northeast, southwest } = mapFilter
      locationQuery = filterByMap(locationQuery, northeast, southwest)
    }

    // only support for one sorting at the moment
    const sortName = sort?.[0]?.sortName || 'name'
    const sortDirection: 'desc' | 'asc' = sort?.[0]?.sortDirection === 'desc' ? 'desc' : 'asc'
    const sortLogic = sortMap[sortName]
    const { sortColumn, cursorColumn, cursorSqlColumn } = sortLogic
    const { ref } = db.dynamic
    if (sortName === 'distance') {
      locationQuery = locationQuery.orderBy(sql`point(longitude, latitude) <@> point(${longitude}, ${latitude})`, sortDirection)
    } else {
      locationQuery = locationQuery.orderBy(ref(sortColumn), sortDirection)
        .orderBy('locations.id', 'asc')
    }

    if (cursor) {
      let cursorWhere = cursorSqlColumn
      if (sortColumn === 'distance') {
        const { longitude, latitude } = sort?.[0]?.latlng
        cursorWhere = sql`point(longitude, latitude) <@> point(${longitude}, ${latitude})`
      }
      locationQuery = locationQuery.where(cursorWhere, '>', cursor)
    }

    // if a cursor was passed, front end already has all of the map locations from the first query
    const allLocations = cursor ? [] : await locationQuery.execute()

    const locations = await locationQuery.limit(10).execute()

    const orderedLocationIds = locations.map(location => location.id)
    const allLocationIds = cursor ? orderedLocationIds : allLocations.map(location => location.id)

    const { ranges } = await getDateRanges({locationIds: allLocationIds})
    const locationRanges = ranges.reduce((acc, range) => {
      acc[range.locationId] = range.dateRange
      return acc
    }, {} as {[key: number]: string})

    const climbingTypes = await getClimbingTypes({ locationIds: allLocationIds })
    const { grades } = await getGradesForLocations({ locationIds: orderedLocationIds })

    // group locations by id
    const groupedLocations = locations.reduce((acc, location) => {
      acc[location.id] = location
      return acc
    }, {} as {[key: number]: typeof locations[0]})

    const orderedLocations = orderedLocationIds.map(id => {
      const location = groupedLocations[id]
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
        soloFriendly: location.soloFriendly,
        distance: Number(location.distance),
      }
    })

    // group locations by id
    const groupedAllLocations = allLocations.reduce((acc, location) => {
      acc[location.id] = location
      return acc
    }, {} as {[key: number]: typeof locations[0]})

    const mapLocations: MapLocation[] = cursor ? null : allLocationIds.map(id => {
      const location = groupedAllLocations[id]
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
        soloFriendly: location.soloFriendly,
        distance: Number(location.distance),
      }
    })


    return {
      locations: orderedLocations,
      mapLocations,
      cursor: orderedLocations[orderedLocations.length - 1] && String(orderedLocations[orderedLocations.length - 1]?.[cursorColumn]),
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

const getUserLatLng = (sortArray: Sort[]): LatLng => {
  const firstSort = sortArray?.[0] 
  if (!firstSort?.latlng) {
    return { latitude: 0, longitude: 0 }
  }

  return firstSort.latlng
}

const filterByClimbingTypes = <O>(locationQuery: SelectQueryBuilder<DB, 'locations', O>, climbingTypes: string[]) => {
  return locationQuery.innerJoin('climbingTypesLocations', 'climbingTypesLocations.locationId', 'locations.id')
    .innerJoin('climbingTypes', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id')
    .where('climbingTypes.name', 'in', climbingTypes)
}

const filterByMonths = <O>(locationQuery: SelectQueryBuilder<DB, 'locations', O>, months: number[]) => {
  return locationQuery
    .innerJoin('locationsSeasons', 'locationsSeasons.locationId', 'locations.id')
    .innerJoin('seasons', 'locationsSeasons.seasonId', 'seasons.id')
    .where('seasons.numericalValue', 'in', months)
}

const filterByGrades = <O>(locationQuery: SelectQueryBuilder<DB, 'locations', O>, gradeFilter: number[], climbingTypeGradeFilter: number[]) => {
  return locationQuery.innerJoin('gradesLocations', 'gradesLocations.locationId', 'locations.id')
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

const filterBySearch = <O>(locationQuery: SelectQueryBuilder<DB, 'locations', O>, search: string) => {
  const lowercaseSearchQuery = search.toLowerCase()
  return locationQuery
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

const filterByMap = <O>(locationQuery: SelectQueryBuilder<DB, 'locations', O>, northeast: LatLng, southwest: LatLng) => {
  locationQuery = locationQuery
    .where('latitude', '<', northeast.latitude)
    .where('latitude', '>', southwest.latitude)
  if (northeast.longitude > southwest.longitude) {
    locationQuery = locationQuery
      .where(({ eb, and }) => and([
        eb('longitude', '<', northeast.longitude),
        eb('longitude', '>', southwest.longitude),
      ]))
  } else {
    locationQuery = locationQuery
      .where(({ eb, or}) => or([
        eb('longitude', '<', northeast.longitude),
        eb('longitude', '>', southwest.longitude),
      ]))
  }
  return locationQuery
}