'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'

interface ipmaCities {
  idRegiao: number
  idAreaAviso: string
  idConcelho: number
  globalIdLocal: number
  latitude: string
  idDistrito: number
  local: string
  longitude: string
}

interface ipmaPrevision {
  precipitaProb: string
  tMin: string
  tMax: string
  predWindDir: string
  idWeatherType: string
  classWindSpeed: number
  longitude: string
  forecastDate: string
  classPrecInt: number
  latitude: string
  svgPath: string
  dayOfWeek?: string
  weatherName?: string
  windName: string
}

interface ipmaWeatherTypes {
  descWeatherTypeEN: string
  descWeatherTypePT: string
  idWeatherType: 0
}

export interface ipmaWarnings {
  text: string
  awarenessTypeName: string
  idAreaAviso: string
  startTime: string
  awarenessLevelID: string
  endTime: string
}

export default function Home() {
  let [ipmaCities, setIpmaCities] = useState<ipmaCities[]>([])
  let [ipmaPrevision, setIpmaPrevision] = useState<ipmaPrevision[]>([])
  let [ipmaWeatherTypesMap, setIpmaWeatherTypesMap] = useState<Map<number, string>>(new Map())
  let [ipmaCitiesMap, setIpmaCitiesMap] = useState<Map<number, string>>(new Map())
  let [ipmaWarnings, setIpmaWarnings] = useState<ipmaWarnings[]>([])
  let [ipmaWarningsByCity, setIpmaWarningsByCity] = useState<ipmaWarnings[]>([])
  let [error, setError] = useState<string>('')
  let windTypesMap = new Map<number, string>([
    [1, 'Fraco'],
    [2, 'Moderado'],
    [3, 'Forte'],
    [3, 'Muito forte'],
  ])

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault()

    let selectedCityId = parseInt(e.target.value)
    if (!selectedCityId) {
      setError('Please select a city')
      return
    }

    setError('')

    try {
      let response = await axios.get(
        `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${selectedCityId}.json`
      )
      let ipmaData: ipmaPrevision[] = response.data.data

      const today = new Date()

      ipmaData.map((prevision) => {
        // em vez de data, dizer o dia da semana
        let dayOfWeek = new Date(prevision.forecastDate).getDay()

        if (dayOfWeek == today.getDay()) {
          prevision.dayOfWeek = 'Hoje'
        } else if (dayOfWeek == (today.getDay() + 1) % 7) {
          prevision.dayOfWeek = 'Amanhã'
        } else {
          prevision.dayOfWeek = [
            'Domingo',
            'Segunda',
            'Terça',
            'Quarta',
            'Quinta',
            'Sexta',
            'Sábado',
          ][dayOfWeek]
        }

        // em vez de weather id, meter o nome do tempo
        let weatherTypeId = parseInt(prevision.idWeatherType, 10)
        let weatherName = ipmaWeatherTypesMap.get(weatherTypeId)
        prevision.weatherName = weatherName

        // em vez de weather type, ter o svg
        if (weatherTypeId <= 9) {
          prevision.idWeatherType = weatherTypeId.toString().padStart(2, '0')
        }
        prevision.svgPath = `/icons_ipma_weather/w_ic_d_${prevision.idWeatherType}anim.svg`

        // inves de wind id, ter o nome do vento
        prevision.windName = windTypesMap.get(prevision.classWindSpeed) as string

        return prevision
      })

      let selectedCityAreaAviso = ipmaCitiesMap.get(selectedCityId)

      // filtrar avisos metereologicos por cidade
      let selectedCityWarnings = ipmaWarnings.filter(
        (warning: ipmaWarnings) =>
          warning.idAreaAviso == selectedCityAreaAviso && warning.awarenessLevelID != 'green'
      )

      selectedCityWarnings = selectedCityWarnings.map((warning) => {
        // Create a copy of the warning object to avoid mutating the original
        let warningCopy = { ...warning }

        const dateStartTime = new Date(warning.startTime)
        const dateEndTime = new Date(warning.endTime)
        const options = {
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
        warningCopy.startTime = dateStartTime.toLocaleString('pt-PT', options)
        warningCopy.endTime = dateEndTime.toLocaleString('pt-PT', options)

        return warningCopy
      })

      setIpmaWarningsByCity(selectedCityWarnings)
      setIpmaPrevision(ipmaData)

      console.log(selectedCityWarnings)
      console.log(ipmaData)
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setError('Error fetching weather data')
      return
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        let [responseCities, responseWeatherTypes, responseWarnings] = await Promise.all([
          axios.get('https://api.ipma.pt/open-data/distrits-islands.json'),
          axios.get('https://api.ipma.pt/open-data/weather-type-classe.json'),
          axios.get('https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json'),
        ])

        let ipmaCitiesData = responseCities.data.data
        let weatherTypesData = responseWeatherTypes.data.data
        let warningsData = responseWarnings.data

        setIpmaCities(ipmaCitiesData)
        setIpmaWarnings(warningsData)

        let weatherTypesMap = new Map<number, string>()
        weatherTypesData.forEach((weatherType: ipmaWeatherTypes) =>
          weatherTypesMap.set(weatherType.idWeatherType, weatherType.descWeatherTypePT)
        )
        setIpmaWeatherTypesMap(weatherTypesMap)

        let citiesMap = new Map<number, string>()
        ipmaCitiesData.forEach((city: ipmaCities) => {
          citiesMap.set(city.globalIdLocal, city.idAreaAviso)
        })
        setIpmaCitiesMap(citiesMap)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Error fetching data')
      }
    }

    fetchData()
  }, [])

  function getPrecipitationColor(precipitaProb: number): string {
    const prob = precipitaProb // Convert to float if needed
    if (prob < 30) {
      return 'text-gray-500'
    } else if (prob < 70) {
      return 'text-yellow-500'
    } else {
      return 'text-blue-500'
    }
  }

  function getWindColor(classWindSpeed: number): string {
    switch (classWindSpeed) {
      case 1:
        return 'text-gray-500'
      case 2:
        return 'text-yellow-500'
      case 3:
        return 'text-red-500'
      case 4:
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center py-8 px-8">
      <form>
        <select
          onChange={handleChange}
          className="text-center text-lg p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a city...</option>
          {ipmaCities
            .sort((a, b) => a.local.localeCompare(b.local))
            .map((city) => (
              <option key={city.globalIdLocal} value={city.globalIdLocal}>
                {city.local}
              </option>
            ))}
        </select>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 my-4 align-center">
        {ipmaWarningsByCity.map((warning, idx) => (
          <li
            key={idx}
            className="relative p-4 bg-white rounded-lg shadow-md border-l-4 border-${warning.awarenessLevelID}-500"
          >
            <div className="flex items-center">
              <div className={`text-${warning.awarenessLevelID}-500`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-10h2v5h-2V6zm0 6h2v2h-2v-2z" />
                </svg>
              </div>
              <h3 className="ml-2 text-lg font-semibold">{warning.awarenessTypeName}</h3>
            </div>
            <p>
              {warning.startTime} até&nbsp;
              {warning.endTime}
            </p>
            <p className="mt-2 text-gray-600">{warning.text}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap m-10 justify-center ">
        {ipmaPrevision &&
          ipmaPrevision.map((prevision) => (
            <div
              key={prevision.forecastDate}
              className="p-5 m-3 bg-white rounded-lg shadow-lg w-full sm:w-1/4 lg:w-1/4 text-center"
            >
              <p className="text-lg font-semibold">{prevision.dayOfWeek}</p>
              <p className="text-sm font-semibold">{prevision.weatherName}</p>
              <div className="flex mt-5">
                <div className="flex-1 w-64">
                  <Image
                    src={prevision.svgPath}
                    alt={`Weather icon for ${prevision.idWeatherType}`}
                    className="mx-auto"
                    width={100}
                    height={100}
                  />
                </div>
                <div className="flex-1 w-16">
                  <p className="text-gray-700">Max: {prevision.tMax}ºC</p>
                  <p className="text-gray-700">Min: {prevision.tMin}ºC</p>
                  <div className="flex justify-center">
                    <Image
                      src="/icons_ipma_weather/water-drop.svg"
                      alt={`Water drop icon`}
                      width={15}
                      height={15}
                    />
                    <p
                      className={`text-gray-700 ml-1 ${getPrecipitationColor(
                        parseInt(prevision.precipitaProb)
                      )}`}
                    >
                      {prevision.precipitaProb}%
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Image
                      src="/icons_ipma_weather/wind.svg"
                      alt={`Wind icon`}
                      width={15}
                      height={15}
                    />
                    <p className={`text-gray-700 ml-1 ${getWindColor(prevision.classWindSpeed)}`}>
                      {prevision.windName} ({prevision.predWindDir})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
