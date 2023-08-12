import db from "../../db/index.js";

interface GetDateRangesArgs {
  locationIds: number[];
}
interface Range {locationId: number, dateRange: string}
interface GetDateRangesResponse {
  ranges: Range[]
}

export const getDateRanges = async ({ locationIds }: GetDateRangesArgs): Promise<GetDateRangesResponse> => {
  if (locationIds.length === 0) {
    return { ranges: [] }
  }
  const seasons = await db.selectFrom('locationsSeasons')
    .where('locationId', 'in', locationIds)
    .leftJoin('seasons', 'locationsSeasons.seasonId', 'seasons.id')
    .select([
      'locationsSeasons.locationId',
      'seasons.id',
      'seasons.name',
      'seasons.numericalValue'
    ]).execute()

  // group all seasons by location id
  const seasonsByLocationId: {[key: number]: Month[]}= seasons.reduce((acc, season) => {
    const { locationId, id, name, numericalValue } = season
    if (!acc[locationId]) {
      acc[locationId] = []
    }
    acc[locationId].push({id, name, numericalValue})
    return acc
  }, {} as {[key: number]: Month[]})

  const dateRanges: Range[] = [];
  // get the date ranges for each location
  for (const locationId in seasonsByLocationId) {
    const range = calculateDateRange(seasonsByLocationId[locationId]) 
    dateRanges.push({locationId: Number(locationId), dateRange: range});
  }

  return {ranges: dateRanges};
}

interface Month {id: number, name: string, numericalValue: number}



const calculateDateRange = (months: Month[]): string => {
  const sortedMonths = months.sort((a, b) => a.numericalValue - b.numericalValue);
  const monthPairs: Month[][] = [];

  // loop through sorted months
  // each index will have a list of consecutive months in order
  // if there is a gap, then we will start a new array
  // if the last month is the end of the year, then we will add the last month to the first array
  sortedMonths.forEach((month, index) => {
    if (index === 0) {
      monthPairs.push([month]);
    } else {
      const previousMonth = sortedMonths[index - 1];
      if (monthPairs[0]?.[0].numericalValue === 1 && month.numericalValue === 12) {
        // this handles the case where there is a wrap around from december to january
        monthPairs[0].unshift(month);
        // now we need to pull months off the last monthPairs and add them to the beginning until we complete the wrap around
        while (monthPairs[monthPairs.length - 1]?.findLast(x => true)?.numericalValue + 1 === monthPairs[0]?.[0].numericalValue) {
          const lastMonth = monthPairs[monthPairs.length - 1].pop();
          monthPairs[0].unshift(lastMonth);
        }
        // if we emptied out the last monthPairs, then we need to remove it
        if (monthPairs[monthPairs.length - 1]?.length === 0) {
          monthPairs.pop();
        }
      } else if (monthPairs[0]?.[0].numericalValue - 1 === month.numericalValue) {
        // this handles if there has been a wrap around and we need to add to the beginning of the monthPairs
        monthPairs[0].unshift(month);
      } else if (previousMonth.numericalValue + 1 === month.numericalValue) {
        monthPairs[monthPairs.length - 1].push(month);
      }  else {
        monthPairs.push([month]);
      }
    }
  });

  const dateRanges: string[] = monthPairs.map(monthPair => {
    if (monthPair.length === 1) {
      return monthPair[0].name.substring(0, 3);
    } else {
      return `${monthPair[0].name.substring(0, 3)} - ${monthPair[monthPair.length - 1].name.substring(0, 3)}`;
    }
  });

  return dateRanges.join(', ');
}
