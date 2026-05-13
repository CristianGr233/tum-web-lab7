import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
const API = import.meta.env.VITE_API

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

  const [destinations, setDestinations] = useState([])

  const [token, setToken] = useState("")
  const [page, setPage] = useState(1)
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



  const permissions = token
  ? JSON.parse(atob(token.split(".")[1])).permissions
  : []
  useEffect(() => {
    const savedTheme = localStorage.getItem('travel-theme')
    if (savedTheme === 'dark') setDarkMode(true)
  }, [])
  useEffect(() => {
    if (token) {
      fetchDestinations()
    }
  }, [page])

  useEffect(() => {
    localStorage.setItem('travel-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
  const saved = localStorage.getItem("token")
  if (saved) setToken(saved)
}, [])
  const scrollToList = () => {
  const el = document.getElementById('destination-list-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
  const resetForm = () => {
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

  setEditingId(null)
  setLocationQuery('')
  setLocationResults([])
}
  const login = async (role) => {
  const res = await fetch(`${API}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  })

  const data = await res.json()

  if (data.token) {
    localStorage.setItem("token", data.token)
    setToken(data.token)

    setPage(1)
    await fetchDestinations(data.token, 1)
  }
  }


const logout = () => {
  localStorage.removeItem("token")
  setToken("")
  setDestinations([])
}


const fetchDestinations = async (customToken, pageNumber = page) => {
  const res = await fetch(
    `${API}/destinations?page=${pageNumber}&limit=6`,
    {
      headers: {
        Authorization: `Bearer ${customToken || token}`
      }
    }
  )

  const data = await res.json()
  setDestinations(Array.isArray(data.data) ? data.data : [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.country) return

    const method = editingId ? "PUT" : "POST"
    const url = editingId
      ? `${API}/destinations/${editingId}`
      : `${API}/destinations`

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        rating: Number(form.rating),
        lat: Number(form.lat),
        lng: Number(form.lng)
      })
    })

    await fetchDestinations()

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

    setEditingId(null)
  }

  const removeDestination = async (id) => {
  await fetch(`${API}/destinations/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  await fetchDestinations()
}

  const toggleVisited = async (d) => {
  await fetch(`${API}/destinations/${d.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      ...d,
      visited: !d.visited
    })
  })

  await fetchDestinations()
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
          
          <div className="flex gap-2 mb-4">
            <button onClick={() => login("ADMIN")}>Admin</button>
            <button onClick={() => login("WRITER")}>Writer</button>
            <button onClick={() => login("VISITOR")}>Visitor</button>

              <button
                onClick={logout}
                className="bg-black text-white px-3 py-1 rounded"
              >
                Logout
              </button>
          </div>

          <h1 className="text-4xl font-bold">Travel Tracker</h1>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* FORM */}
        
        {permissions.includes("WRITE") && (
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
        onClick={resetForm}
        className="bg-gray-600 text-white p-3 rounded"
      >
        Clear
      </button>
    </form>
  </div>
)}


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
                    onClick={() => toggleVisited(d)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {d.visited
                      ? 'Visited'
                      : 'Wishlist'}
                  </button>

                  {permissions.includes("WRITE") && (
                  <button
                    onClick={() => startEdit(d)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                )}

                  {permissions.includes("DELETE") && (
                  <button
                    onClick={() => removeDestination(d.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>


        <div className="flex justify-center gap-4 mt-10">
  
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="bg-gray-700 text-white px-5 py-2 rounded-xl"
            disabled={page === 1}
          >
            Prev
          </button>

          <div className="px-5 py-2 rounded-xl bg-white dark:bg-zinc-900">
            Page {page}
          </div>

          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl"
            disabled={destinations.length < 6}
          >
            Next
          </button>

        </div>

      </div>
    </div>
  )
}