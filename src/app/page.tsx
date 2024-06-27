'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

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
  idWeatherType: number
  classWindSpeed: number
  longitude: string
  forecastDate: string
  classPrecInt: number
  latitude: string
}

export default function Home() {
  let [ipmaCities, setIpmaCities] = useState<ipmaCities[]>([])
  let [ipmaPrevision, setIpmaPrevision] = useState<ipmaPrevision[]>([])
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
      setIpmaPrevision(response.data.data)
    } catch (error) {
      console.error('Error fetching weather data:', error)
      setError('Error fetching weather data')
    }
  }

  useEffect(() => {
    // Function to fetch data
    async function fetchData() {
      try {
        const response = await axios.get('https://api.ipma.pt/open-data/distrits-islands.json')
        setIpmaCities(response.data.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData() // Call the fetch function
  }, []) // Empty dependency array ensures this runs only once on mount

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <form>
        <select onChange={handleChange} className="w-25">
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
      {error && <p>{error}</p>}
      <div className="flex m-10">
        {ipmaPrevision &&
          ipmaPrevision.map((prevision) => (
            <div key={prevision.forecastDate} className="p-5">
              <p>{prevision.forecastDate}</p>
              <p>{prevision.tMin}</p>
              <p>{prevision.tMax}</p>
            </div>
          ))}
      </div>
    </main>
  )
}
