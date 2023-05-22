let dataAlreadyDisplayed = false
const myKey = WEATHER_KEY

// set up reactive background image dictionary
const weatherCategoryImages ={
    'Thunderstorm' : 'thunderstorm.jpg',
    'Drizzle' : 'drizzle.jpg',
    'Rain' : 'drizzle.jpg',
    'Snow' : 'snow.jpg',
    'Mist' : 'fog.jpg',
    'Smoke' : 'fog.jpg',
    'Haze' : 'fog.jpg',
    'Dust' : 'fog.jpg',
    'Fog' : 'fog.jpg',
    'Squall' : 'fog.jpg',
    'Clear' : 'clear.jpg',
    'Clouds' : 'cloudy.jpg',
    'Overcast' : 'overcast.jpg'
}

// get the four date/times desired for 4-day forecast - 6pm UTC on next 4 days
// target format = "YYYY-MM-DD HH:MM:SS"
// put the target date into a list as the value for that key
// so that we can add the temperature as another value in that list later on
const dateRef = {}
let currentDate = new Date()
for(let i=1; i<5; i++){
    let thisDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate()+i).toISOString()
    thisDate = thisDate.substring(0,10)
    thisDate += " 18:00:00"
    dateRef[i] = [thisDate]
}
// get some additional date information for use later, and to append to
// page title here and now
let currentFormattedDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate()).toDateString()
currentFormattedDate = currentFormattedDate.substring(0,16)
currentFormattedDate = currentFormattedDate.split(' ')
currentFormattedDate = currentFormattedDate[0]+' '+currentFormattedDate[1]+' '+[currentFormattedDate[2]+', '+currentFormattedDate[3]]
const pageTitle = document.getElementById('titleText')
pageTitle.insertAdjacentText('beforeend', currentFormattedDate)
// get list of next 4 days' truncated dates
const daysListForForecast = []
for (let i=1; i<5; i++){
    let tempDate = new Date()
    let newTempDate = new Date(tempDate.getFullYear(),tempDate.getMonth(),tempDate.getDate()+i).toDateString()
    newTempDate = newTempDate.substring(0,3)
    daysListForForecast.push(newTempDate)
}
//go ahead and title the forecast boxes
const day1Box = document.getElementById('day1Box')
day1Box.insertAdjacentText('beforeend', daysListForForecast[0])
const day2Box = document.getElementById('day2Box')
day2Box.insertAdjacentText('beforeend', daysListForForecast[1])
const day3Box = document.getElementById('day3Box')
day3Box.insertAdjacentText('beforeend', daysListForForecast[2])
const day4Box = document.getElementById('day4Box')
day4Box.insertAdjacentText('beforeend', daysListForForecast[3])

// get remaining global vars and nodes needed
const bodyBackground = document.getElementsByTagName('body')[0]
const overallWeatherContainer = document.getElementsByClassName('overallWeatherContainer')[0]
const tempContainer = document.getElementsByClassName('tempContainer')[0]
const feelsLikeContainer = document.getElementsByClassName('feelsLikeContainer')[0]
const humidityStatContainer = document.getElementsByClassName('humidityStatContainer')[0]
const windSpeedStatContainer = document.getElementsByClassName('windSpeedStatContainer')[0]
let tempTextUnits
let windTextUnits

// actual min and max for the day are not available at the free level, min and max
// that come with *all free datasets* are the local min/max estimated *at that moment.*
// this makes min and max pretty useless for our purposes. there's no high/low
// available, afaik.

// getting unambiguous location coordinates is rather difficult.
// would need a crosswalk of all state/country codes, which is onerous
// to implement alongside the existing assignment, or requires some other solution
// I wasn't lucky/clever enough to stumble across

// gets lat and long from geo api
async function getCityCoords(thisCity){

    const res = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${thisCity}&limit=1&appid=${myKey}`)

    if (res.ok){
        const cityData = await res.json()
        let lat = cityData[0]['lat']
        let lon = cityData[0]['lon']
        let theseCoords = [lat,lon]
        return(theseCoords)
    }
}

// uses lat and long from above to get weather data for city in requested units
async function getWeatherData(thisCity){

    searchCoords = await getCityCoords(thisCity)
    let unitsSelected = document.getElementById('chooseUnits').value
    const resCurrent = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${searchCoords[0]}&lon=${searchCoords[1]}&units=${unitsSelected}&appid=${myKey}`)
    // if we change cnt to some number and find the next day's forecast we could get the mid-day temperature from it
    const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${searchCoords[0]}&lon=${searchCoords[1]}&units=${unitsSelected}&cnt=40&appid=${myKey}`)
    // could add air quality index here.
    // const resAqi = await fetch()

    if (resCurrent.ok && resForecast.ok){
        const weatherNow = await resCurrent.json()
        const forecast = await resForecast.json()
        console.log(forecast)
        displayWeatherData(weatherNow, forecast, unitsSelected)
    }
}

// 5 day 3 hour forecast is going to have 8 records per day.
// US is going to be between 7 and 4 hours behind UTC. so finding
// the daily temp at 6m or so will be roughly mid-day temp for 
// wherever, which is sufficient for forecasting, which already
// has wide error bounds on estimates more than a day or so out.
// Goal is to parse 5-day 3-hour forecast data for the 6pm UTC
// estimate for each of 4 days beyond current day.

function displayWeatherData(weatherNow, forecast, unitsSelected){
    // take care of prior data if displayed
    if (dataAlreadyDisplayed){
        let weatherObjectIds = ['overallWeatherNowStat', 'tempNowStat', 
                                'tempFeelsLikeNowStat', 'humidityNowStat', 
                                'windSpeedNowStat', 'day1TempStat', 
                                'day2TempStat', 'day3TempStat', 'day4TempStat']
        console.log(weatherObjectIds)
        for (let i=0; i<weatherObjectIds.length; ++i){
            console.log(weatherObjectIds[i])
            let thisObject = document.getElementById(weatherObjectIds[i])
            thisObject.remove()
        } // end for each weather object id tag, remove it
    } // end if we have weather data up already

    // this chunk changes the background based on the weather.
    // if sub desc is overcast does some extra stuff, otherwise
    // uses main weather keyword
    let weatherCatNow = weatherNow['weather'][0]['main']
    if (weatherNow['weather'][0]['description']==='overcast clouds'){
        weatherCatNow = 'Overcast'
    }
    bodyBackground.style.background = `url(/static/images/${weatherCategoryImages[weatherCatNow]}) no-repeat center center fixed`
    bodyBackground.style.backgroundSize = "cover"
    console.log(unitsSelected)
    // get correct unit suffixes for display based on unitsSelected
    if (unitsSelected === "imperial"){
        tempTextUnits = " F"
        windTextUnits = " mph"
    }else{
        tempTextUnits = " C"
        windTextUnits = " mps"
    }

    // display the main weather description and title case it
    const weatherNowText = document.createElement('h4')
    weatherNowText.id = 'overallWeatherNowStat'
    let lowerWords = weatherNow['weather'][0]['description']
    console.log(lowerWords)
    lowerWords = lowerWords.split(' ')
    let descWeatherText = ''
    for (let ele of lowerWords){
        let thisWord = ele.charAt(0).toUpperCase() + ele.substr(1)
        if (descWeatherText){
            descWeatherText += (' '+thisWord)
        }else{
            descWeatherText += thisWord
        }
    }
    weatherNowText.textContent = descWeatherText
    weatherNowText.className = "retrievedNowStat"
    overallWeatherContainer.appendChild(weatherNowText)

    // current temperature
    const tempNowText = document.createElement('h4')
    tempNowText.id = 'tempNowStat'
    let tempF = weatherNow['main']['temp'] 
    tempF = Math.round(tempF) + tempTextUnits
    tempNowText.textContent = tempF
    tempNowText.className = "retrievedNowStat"
    tempContainer.appendChild(tempNowText)

    // current temperature feels like
    const tempFeelsLikeNowText = document.createElement('h4')
    tempFeelsLikeNowText.id = 'tempFeelsLikeNowStat'
    let tempFeelsF = weatherNow['main']['feels_like']
    tempFeelsF = Math.round(tempFeelsF) + tempTextUnits
    tempFeelsLikeNowText.textContent = tempFeelsF
    tempFeelsLikeNowText.className = "retrievedNowStat"
    feelsLikeContainer.appendChild(tempFeelsLikeNowText)

    // current humidity
    const humidityNowText = document.createElement('h4')
    humidityNowText.id = 'humidityNowStat'
    humidityNowText.textContent = weatherNow['main']['humidity'] + " %"
    humidityNowText.className = "retrievedNowStat"
    humidityStatContainer.appendChild(humidityNowText)

    //current windspeed
    const windSpeedNowText = document.createElement('h4')
    windSpeedNowText.id = 'windSpeedNowStat'
    windSpeedNowText.textContent = Math.round(weatherNow['wind']['speed']) + windTextUnits
    windSpeedNowText.className = "retrievedNowStat"
    windSpeedStatContainer.appendChild(windSpeedNowText)

    // loop through the date ref dictionary and retrieve the target
    // temperature data from the forecast object, adding it to the correct
    // spot in the global dateRef object. we must loop through each
    // day in the forecast obj too. This structure is prolly the least
    // efficient way to do this, but we'll leave it for now with a note
    // that this wouldn't be the preferred method if we were using larger
    // data objects.
    for (let targetDay=1; targetDay<5; targetDay++){
        for(let forecastDay=0; forecastDay<40; forecastDay++){
            if(forecast['list'][forecastDay]['dt_txt'] === dateRef[targetDay][0]){
                dateRef[targetDay].push(forecast['list'][forecastDay]['main']['temp'])
            }
        }

    }
    
    // get the 4 forecast day's data into the app
    // day1
    const day1Temp = document.createElement('h4')
    day1Temp.id = 'day1TempStat'
    let day1Value = dateRef[1][1] 
    day1Value = Math.round(day1Value) + tempTextUnits
    day1Temp.textContent = day1Value
    day1Temp.className = "retrievedForecastStat"
    day1Box.appendChild(day1Temp)

        // day2
    const day2Temp = document.createElement('h4')
    day2Temp.id = 'day2TempStat'
    let day2Value = dateRef[2][1] 
    day2Value = Math.round(day2Value) + tempTextUnits
    day2Temp.textContent = day2Value
    day2Temp.className = "retrievedForecastStat"
    day2Box.appendChild(day2Temp)

        // day3
    const day3Temp = document.createElement('h4')
    day3Temp.id = 'day3TempStat'
    let day3Value = dateRef[3][1] 
    day3Value = Math.round(day3Value) + tempTextUnits
    day3Temp.textContent = day3Value
    day3Temp.className = "retrievedForecastStat"
    day3Box.appendChild(day3Temp)

        // day4
    const day4Temp = document.createElement('h4')
    day4Temp.id = 'day4TempStat'
    let day4Value = dateRef[4][1] 
    day4Value = Math.round(day4Value) + tempTextUnits
    day4Temp.textContent = day4Value
    day4Temp.className = "retrievedForecastStat"
    day4Box.appendChild(day4Temp)

    dataAlreadyDisplayed = true
}

// this is going to print a promise object - you can see it happens "first"
//console.log(getWeatherData('Denver'),'city call')

// even listener for city search button
const button = document.getElementById('searchButton')
button.addEventListener('click', () => {
    let thisCity = document.getElementById('citySearchField').value
    getWeatherData(thisCity)
})

// this is a leftover note about IIFE during promise object exploration
// (async () => {
//     let searchCoords = await getCityCoords('Denver')
//     console.log(searchCoords, 'testing IIFE')
// })()