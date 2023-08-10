import db from "../../db/index.js";

interface GetDateRangesArgs {
  locationIds: number[];
}
interface Range {locationId: number, dateRange: string}
interface GetDateRangesResponse {
  ranges: Range[]
}

export const getDateRanges = async ({ locationIds }: GetDateRangesArgs): Promise<GetDateRangesResponse> => {
  const seasons = await db.selectFrom('locations_seasons')
    .where('location_id', 'in', locationIds)
    .leftJoin('seasons', 'locations_seasons.season_id', 'seasons.id')
    .select([
      'locations_seasons.location_id',
      'seasons.id',
      'seasons.name',
      'seasons.numerical_value'
    ]).execute()

  // group all seasons by location id
  const seasonsByLocationId: {[key: number]: Month[]}= seasons.reduce((acc, season) => {
    const { location_id, id, name, numerical_value } = season
    if (!acc[location_id]) {
      acc[location_id] = []
    }
    acc[location_id].push({id, name, numerical_value})
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

interface Month {id: number, name: string, numerical_value: number}


// NOTE: i used chatgpt to translate this from rails to typescript... it's probably broken and gross
const calculateDateRange = (seasons: Month[]): string => {
  let months: Month[];
  if (!seasons?.length) {
    // Replace this with your own logic for getting the seasons
    return ''
  } else {
    months = seasons;
  }

  let rangeString = '';
  const monthArray: { [key: number]: string } = {};
  
  months.sort((a, b) => a.numerical_value - b.numerical_value).forEach(month => {
    monthArray[month.numerical_value] = month.name;
  });

  let previousMonth = 0;
  const ranges: string[] = [];
  let counter = 0;
  let wrapperBreakMonth = -1;

  if (Object.keys(monthArray).length === 12) {
    return 'Jan - Dec';
  }

  for (const [numerical, month] of Object.entries(monthArray)) {
    counter += 1;

    if (previousMonth === 0) {
      if (monthArray['12'] && numerical === '1') {
        let latestMonth = 13;
        for (const [month_num, _] of Object.entries(monthArray).reverse()) {
          if (Number(latestMonth) - 1 === Number(month_num)) {
            latestMonth = Number(month_num);
          }
        }
        ranges.push(monthArray[latestMonth]);
        rangeString += monthArray[latestMonth].substring(0, 3);
        wrapperBreakMonth = latestMonth;
      } else {
        ranges.push(month);
        rangeString += month.substring(0, 3);
      }
    }

    if (counter === Object.keys(monthArray).length && previousMonth !== 0) {
      if (!ranges.includes(monthArray[previousMonth])) {
        if (wrapperBreakMonth === Number(numerical)) {
          ranges.push(monthArray[previousMonth]);
          rangeString += ' - ' + monthArray[previousMonth].substring(0, 3);
        } else {
          ranges.push(month);
          rangeString += ' - ' + month.substring(0, 3);
        }
      } else {
        ranges.push(month);
        rangeString += ', ' + month.substring(0, 3);
      }
    } else if (previousMonth !== 0 && Number(previousMonth) + 1 !== Number(numerical)) {
      if (!ranges.includes(monthArray[previousMonth])) {
        if (wrapperBreakMonth === Number(numerical)) {
          ranges.push(monthArray[previousMonth]);
          rangeString += ' - ' + monthArray[previousMonth].substring(0, 3);
        } else {
          ranges.push(monthArray[previousMonth]);
          rangeString += ' - ' + monthArray[previousMonth].substring(0, 3) + ', ';
        }
      } else {
        if (wrapperBreakMonth === Number(numerical)) {
          if (!ranges.includes(monthArray[previousMonth])) {
            ranges.push(monthArray[previousMonth]);
            rangeString += ' - ' + monthArray[previousMonth].substring(0, 3);
          }
        } else {
          rangeString += ', ';
        }
      }
      ranges.push(month);
      rangeString += month.substring(0, 3);
    }
    previousMonth = Number(numerical);
  }
  return rangeString;
}