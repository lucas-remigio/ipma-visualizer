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
}

interface ipmaWeatherTypes {
  descWeatherTypeEN: string
  descWeatherTypePT: string
  idWeatherType: 0
}

export default function Home() {
  let [ipmaCities, setIpmaCities] = useState<ipmaCities[]>([])
  let [ipmaPrevision, setIpmaPrevision] = useState<ipmaPrevision[]>([])
  let [ipmaWeatherTypesMap, setIpmaWeatherTypesMap] = useState<Map<number, string>>(new Map())
  let [error, setError] = useState<string>('')

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

        return prevision
      })

      console.log(ipmaData)
      setIpmaPrevision(ipmaData)
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setError('Error fetching weather data')
      return
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        let responseCities = await axios.get('https://api.ipma.pt/open-data/distrits-islands.json')
        setIpmaCities(responseCities.data.data)

        let responseWeatherTypes = await axios.get(
          'https://api.ipma.pt/open-data/weather-type-classe.json'
        )
        let weatherTypes = responseWeatherTypes.data.data

        let weatherTypesMap = new Map<number, string>()
        weatherTypes.forEach((weatherType: ipmaWeatherTypes) =>
          weatherTypesMap.set(weatherType.idWeatherType, weatherType.descWeatherTypePT)
        )

        console.log(weatherTypesMap) // Check if map is populated correctly

        setIpmaWeatherTypesMap(weatherTypesMap)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Error fetching data')
      }
    }

    fetchData()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center py-32 px-8">
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
      <div className="flex flex-wrap m-10 justify-center">
        {ipmaPrevision &&
          ipmaPrevision.map((prevision) => (
            <div
              key={prevision.forecastDate}
              className="p-5 m-3 bg-white rounded-lg shadow-lg w-full sm:w-1/2 lg:w-1/4 text-center"
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
                  <p className="text-gray-700">Max: {prevision.tMin}</p>
                  <p className="text-gray-700">Min: {prevision.tMax}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </main>
  )
}
