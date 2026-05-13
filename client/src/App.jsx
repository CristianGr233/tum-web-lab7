import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function App() {
  const defaultDestinations = [
    {
      id: 1,
      name: 'Tokyo',
      country: 'Japan',
      category: 'City',
      rating: 5,
      visited: false,
      notes: 'Visit Akihabara and Shibuya',
      lat: 35.6764,
      lng: 139.6500,
      image:
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 2,
      name: 'Santorini',
      country: 'Greece',
      category: 'Beach',
      rating: 4,
      visited: true,
      notes: 'Beautiful sunset views',
      lat: 36.3932,
      lng: 25.4615,
      image:
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop'
    }
  ]

  const [destinations, setDestinations] = useState(() => {
    const saved = localStorage.getItem('travel-destinations')
    return saved ? JSON.parse(saved) : defaultDestinations
  })

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [darkMode, setDarkMode] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [locationResults, setLocationResults] = useState([])
  const [locationQuery, setLocationQuery] = useState('')

  const [form, setForm] = useState({
    name: '',
    country: '',
    category: 'City',
    rating: 3,
    notes: '',
    image: '',
    lat: '',
    lng: ''
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('travel-theme')
    if (savedTheme === 'dark') setDarkMode(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('travel-destinations', JSON.stringify(destinations))
  }, [destinations])

  useEffect(() => {
    localStorage.setItem('travel-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])
  
  const scrollToList = () => {
  const el = document.getElementById('destination-list-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

  const searchLocation = async () => {
    if (!locationQuery.trim()) return

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationQuery
        )}`
      )

      const data = await res.json()
      setLocationResults(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.name || !form.country) return

    const imageValue =
      form.image && form.image.length > 0
        ? form.image
        : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'

    if (editingId) {
      setDestinations(
        destinations.map((d) =>
          d.id === editingId
            ? {
                ...d,
                ...form,
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                image: imageValue
              }
            : d
        )
      )

      setEditingId(null)
    } else {
      setDestinations([
        {
          id: Date.now(),
          ...form,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          image: imageValue,
          visited: false
        },
        ...destinations
      ])
    }

    setForm({
      name: '',
      country: '',
      category: 'City',
      rating: 3,
      notes: '',
      image: '',
      lat: '',
      lng: ''
    })

    setLocationQuery('')
  }

  const removeDestination = (id) => {
    setDestinations(destinations.filter((d) => d.id !== id))
  }

  const toggleVisited = (id) => {
    setDestinations(
      destinations.map((d) =>
        d.id === id ? { ...d, visited: !d.visited } : d
      )
    )
  }

  const startEdit = (d) => {
    setEditingId(d.id)

    setForm({
      name: d.name,
      country: d.country,
      category: d.category,
      rating: d.rating,
      notes: d.notes,
      image: d.image,
      lat: d.lat,
      lng: d.lng
    })
  }

  const cancelEdit = () => {
    setEditingId(null)

    setForm({
      name: '',
      country: '',
      category: 'City',
      rating: 3,
      notes: '',
      image: '',
      lat: '',
      lng: ''
    })
  }

  const removeImage = () => {
    setForm({ ...form, image: '' })
  }

  const filtered = destinations.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'All'
        ? true
        : filter === 'Visited'
        ? d.visited
        : !d.visited

    return matchSearch && matchFilter
  })

  const fetchPlaceImage = async (name) => {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    )

    const data = await res.json()

    return data?.thumbnail?.source || null
  } catch {
    return null
  }
}

  return (
    <div
      className={`min-h-screen transition-all ${
        darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <h1 className="text-4xl font-bold">Travel Tracker</h1>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* FORM */}
        <div
          className={`p-6 rounded-3xl mb-8 ${
            darkMode ? 'bg-zinc-900' : 'bg-white'
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edit Destination' : 'Add Destination'}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid md:grid-cols-2 gap-4"
          >
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="p-3 border rounded bg-transparent"
            />

            <input
              placeholder="Country"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
              className="p-3 border rounded bg-transparent"
            />

            {/* LOCATION SEARCH */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">
                Search Location
              </label>

              <div className="flex gap-2">
                <input
                  placeholder="Search any place..."
                  value={locationQuery}
                  onChange={(e) =>
                    setLocationQuery(e.target.value)
                  }
                  className="flex-1 p-3 border rounded bg-transparent"
                />

                <button
                  type="button"
                  onClick={searchLocation}
                  className="bg-indigo-600 text-white px-4 rounded"
                >
                  Search
                </button>
              </div>

              {locationResults.length > 0 && (
                <div className="mt-3 border rounded-xl overflow-hidden max-h-64 overflow-y-auto">

                  {locationResults.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={async () => {
                        const parts = place.display_name.split(',')

                        const name = parts[0].trim()
                        const country = parts[parts.length - 1].trim()

                        const image = await fetchPlaceImage(name)

                        setForm({
                          ...form,
                          name,
                          country,
                          lat: place.lat,
                          lng: place.lon,
                          image: image || ''
                        })

                        setLocationQuery(place.display_name)
                        setLocationResults([])
                      }}
                      className="w-full text-left p-3 border-b hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {place.display_name}
                    </button>
                  ))}

                </div>
              )}
            </div>

            {/* IMAGE URL */}
            <input
              placeholder="Image URL"
              value={form.image}
              onChange={(e) =>
                setForm({ ...form, image: e.target.value })
              }
              className="p-3 border rounded md:col-span-2 bg-transparent"
            />

            {/* FILE UPLOAD */}
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">
                Upload Image
              </label>

              <div className="flex items-center gap-4">

                <input
                  id="fileUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (!file) return

                    const reader = new FileReader()

                    reader.onloadend = () => {
                      setForm({
                        ...form,
                        image: reader.result
                      })
                    }

                    reader.readAsDataURL(file)
                  }}
                />

                <label
                  htmlFor="fileUpload"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition"
                >
                  Choose File
                </label>

                <span className="text-sm opacity-70">
                  {form.image
                    ? 'Image selected ✓'
                    : 'No file chosen'}
                </span>
              </div>

              {/* PREVIEW */}
              {form.image && (
                <div className="relative mt-4 border rounded-xl overflow-hidden bg-black/10 dark:bg-black/40 max-w-md mx-auto">

                  <div className="h-96 flex items-center justify-center">
                    <img
                      src={form.image}
                      alt="preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              className="p-3 border rounded md:col-span-2 bg-transparent"
            />

            <button className="bg-indigo-600 text-white p-3 rounded">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-600 text-white p-3 rounded"
            >
              Clear
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-500 text-white p-3 rounded"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* MAP */}
        <div className="w-full overflow-hidden rounded-2xl">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={18}
            scrollWheelZoom={true}
            worldCopyJump={false}
            maxBounds={[
              [-85, -180],
              [85, 180]
            ]}
            maxBoundsViscosity={1.0}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              noWrap={true}
            />

            {destinations.map((d) =>
              d.lat && d.lng ? (
                
                <Marker
                  key={d.id}
                  position={[d.lat, d.lng]}
                  eventHandlers={{
                    click: () => {
                      setSearch(d.name)
                      setFilter('All')
                      setTimeout(scrollToList, 100)
                    }
                  }}
                >
                        <Popup>
                    <div className="text-black">
                      <h3 className="font-bold">
                        {d.name}
                      </h3>
                      <p>{d.country}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>

        {/* SEARCH */}
        {/* DESTINATION CONTROLS HEADER */}
          <div id="destination-list-section" className="mt-10 mb-3">
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
              Your Destinations
            </h2>
          </div>

          {/* LIST SEARCH + FILTER */}
          <div
            className={`flex gap-4 mb-10 p-4 rounded-xl border ${
              darkMode
                ? 'border-zinc-700 bg-zinc-900'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 p-3 rounded border ${
                darkMode ? 'bg-zinc-900' : 'bg-white'
              }`}
            />
            {search && (
            <button
              onClick={() => setSearch('')}
              className="text-sm text-indigo-500 font-bold px-2"
            >
              Show All
            </button>
            )}

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`p-3 rounded border ${
                darkMode ? 'bg-zinc-900' : 'bg-white'
              }`}
            >
              <option>All</option>
              <option>Visited</option>
              <option>Wishlist</option>
            </select>
          </div>





        {/* LIST */}
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <div
              key={d.id}
              className={`rounded-3xl overflow-hidden shadow ${
                darkMode ? 'bg-zinc-900' : 'bg-white'
              }`}
            >
              <img
                src={d.image}
                alt={d.name}
                className="h-52 w-full object-cover"
              />

              <div className="p-4">
                <h3 className="text-xl font-bold">
                  {d.name}
                </h3>

                <p className="opacity-70">
                  {d.country}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() =>
                      toggleVisited(d.id)
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {d.visited
                      ? 'Visited'
                      : 'Wishlist'}
                  </button>

                  <button
                    onClick={() => startEdit(d)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      removeDestination(d.id)
                    }
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}