import { useState, useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet'

const API = import.meta.env.VITE_API

export default function App() {

  /* =========================
     STATE
  ========================= */


  const [destinations, setDestinations] = useState([])
  const [token, setToken] = useState("")
  const [search, setSearch] = useState('')

  const [filter, setFilter] = useState('All')

  const [darkMode, setDarkMode] = useState(false)

  const [editingId, setEditingId] = useState(null)

  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [locationResults, setLocationResults] = useState([])

  const [locationQuery, setLocationQuery] = useState('')

  const [form, setForm] = useState({
  name: '',
  country: '',
  rating: 3,
  notes: '',
  image: '',
  lat: '',
  lng: ''
  })

  const permissions = token
  ? JSON.parse(atob(token.split(".")[1])).permissions
  : []

const login = async (role) => {

  try {

    const res = await fetch(`${API}/token`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({ role })
    })

    const data = await res.json()

    if (data.token) {

      localStorage.setItem("token", data.token)

      setToken(data.token)

      setError("")

      alert("Logged in as " + role)

      await fetchDestinations(data.token)

    }

    else {

      setError("Login failed")

    }

  }

  catch (err) {

    console.error(err)

    setError("Login error")

  }

}

const logout = () => {

  localStorage.removeItem("token")

  setToken("")

  setError("")

  alert("Logged out")

}


  /* =========================
     THEME
  ========================= */

  useEffect(() => {

    const savedTheme =
      localStorage.getItem('travel-theme')

    if (savedTheme === 'dark') {
      setDarkMode(true)
    }

  }, [])

  useEffect(() => {

    localStorage.setItem(
      'travel-theme',
      darkMode ? 'dark' : 'light'
    )

  }, [darkMode])

  /* =========================
     FETCH DESTINATIONS
  ========================= */

const fetchDestinations = async (customToken) => {

  try {

    setLoading(true)

    const res = await fetch(
      `${API}/destinations?page=${page}&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${customToken || token}`
        }
      }
    )

    const data = await res.json()

    console.log(data)

    if (!res.ok) {
      throw new Error(data.error || "Fetch failed")
    }

    setDestinations(data?.data || [])

    setError('')

  }

  catch (err) {

    console.error(err)

    setError(err.message)

  }

  finally {

    setLoading(false)

  }

}

 useEffect(() => {

  if (token) {
    fetchDestinations()
  }

}, [page, token])

  /* =========================
     HELPERS
  ========================= */

  const resetForm = () => {

    
    setForm({
    name: '',
    country: '',
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

  const scrollToList = () => {

    const el = document.getElementById(
      'destination-list-section'
    )

    if (el) {

      el.scrollIntoView({
        behavior: 'smooth'
      })

    }

  }

  /* =========================
     SEARCH LOCATION
  ========================= */

  const searchLocation = async () => {

    if (!locationQuery.trim()) return

    try {

      const res = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(locationQuery)}`
)
      const data = await res.json()

      setLocationResults(data)

    } catch (err) {

      console.error(err)

    }

  }

  /* =========================
     FETCH IMAGE
  ========================= */

  const fetchPlaceImage = async (name) => {

    try {

      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          name
        )}`
      )

      const data = await res.json()

      return data?.thumbnail?.source || null

    } catch {

      return null

    }

  }

  /* =========================
     CREATE / UPDATE
  ========================= */

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!form.name || !form.country) {

      setError('Name and country required')

      return

    }

    try {

      setLoading(true)

      setError('')

      const imageValue =
        form.image && form.image.length > 0
          ? form.image
          : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'

      /* =========================
         UPDATE
      ========================= */

      if (editingId) {

        const response = await fetch(
          `${API}/destinations/${editingId}`,
          {
            method: 'PUT',

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
              name: form.name,
              country: form.country,
              rating: Number(form.rating),
              notes: form.notes,
              image: imageValue,
              lat: Number(form.lat),
              lng: Number(form.lng)
            })
          }
        )

        const result = await response.json()

        console.log(result)

        if (!response.ok) {

          throw new Error(
            result.message || 'Update failed'
          )

        }

      }

      /* =========================
         CREATE
      ========================= */

      else {

        const response = await fetch(
        `${API}/destinations`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            name: form.name,
            country: form.country,
            rating: Number(form.rating),
            notes: form.notes,
            image: imageValue,
            lat: Number(form.lat),
            lng: Number(form.lng),
            visited: false
          })
        }
      )

      console.log('STATUS:', response.status)

      const text = await response.text()

      console.log('RAW RESPONSE:', text)

      if (!response.ok) {
        throw new Error(text)
      }

      }

      /* =========================
         REFRESH
      ========================= */

      await fetchDestinations()

      resetForm()

    } catch (err) {

      console.error(err)

      setError(err.message)

    } finally {

      setLoading(false)

    }

  }

  /* =========================
     DELETE
  ========================= */

  const removeDestination = async (id) => {

    try {

      await fetch(
        `${API}/destinations/${id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      await fetchDestinations()

    } catch (err) {

      console.error(err)

      setError('Delete failed')

    }

  }

  /* =========================
     TOGGLE VISITED
  ========================= */

  const toggleVisited = async (d) => {

    try {

      await fetch(
        `${API}/destinations/${d.id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            ...d,
            visited: !d.visited
          })
        }
      )

      await fetchDestinations()

    } catch (err) {

      console.error(err)

    }

  }

  /* =========================
     EDIT
  ========================= */

  const startEdit = (d) => {

    setEditingId(d.id)

    setForm({
      name: d.name,
      country: d.country,
      rating: d.rating,
      notes: d.notes,
      image: d.image,
      lat: d.lat,
      lng: d.lng
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

  }

  /* =========================
     REMOVE IMAGE
  ========================= */

  const removeImage = () => {

    setForm({
      ...form,
      image: ''
    })

  }

  /* =========================
     FILTER
  ========================= */

  const filtered = destinations.filter((d) => {

    const matchSearch =

      d.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      d.country
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchFilter =

      filter === 'All'
        ? true
        : filter === 'Visited'
        ? d.visited
        : !d.visited

    return matchSearch && matchFilter

  })

  /* =========================
     STATS
  ========================= */

  const totalVisited =
    destinations.filter((d) => d.visited).length

  const totalWishlist =
    destinations.filter((d) => !d.visited).length

  /* =========================
     JSX
  ========================= */

  return (

    <div
      className={`min-h-screen transition-all ${
        darkMode
          ? 'bg-zinc-950 text-white'
          : 'bg-slate-100 text-slate-900'
      }`}
    >

      <div className="max-w-7xl mx-auto p-6">
      {/* ===== JWT LOGIN (LAB 7 ADDITION) ===== */}
<div className="flex gap-2 mb-6">

  <button
    onClick={() => login("ADMIN")}
    className="bg-red-600 text-white px-3 py-1 rounded"
  >
    Admin
  </button>

  <button
    onClick={() => login("WRITER")}
    className="bg-blue-600 text-white px-3 py-1 rounded"
  >
    Writer
  </button>

  <button
    onClick={() => login("VISITOR")}
    className="bg-gray-600 text-white px-3 py-1 rounded"
  >
    Visitor
  </button>

  <button
    onClick={logout}
    className="bg-black text-white px-3 py-1 rounded"
  >
    Logout
  </button>

</div>
<p className="mb-6">
  Current role:{" "}
  <strong>
    {(() => {
      try {
        if (!token) return "NONE"
        return JSON.parse(atob(token.split(".")[1])).role
      } catch {
        return "INVALID TOKEN"
      }
    })()}
  </strong>
</p>

        {/* HEADER */}

        <div className="flex justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold">
              Travel Tracker
            </h1>

            <p className="opacity-70 mt-2">
              React + JWT + CRUD API
            </p>

          </div>

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>

        </div>

        {/* ERROR */}

        {error && (

          <div className="bg-red-600 text-white p-4 rounded-xl mb-6">
            {error}
          </div>

        )}

        {/* STATS */}

        <div className="grid md:grid-cols-2 gap-4 mb-8">

          <div
            className={`p-5 rounded-3xl ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
            }`}
          >

            <p className="opacity-70">
              Visited
            </p>

            <h2 className="text-3xl font-bold">
              {totalVisited}
            </h2>

          </div>

          <div
            className={`p-5 rounded-3xl ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
            }`}
          >

            <p className="opacity-70">
              Wishlist
            </p>

            <h2 className="text-3xl font-bold">
              {totalWishlist}
            </h2>

          </div>

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

      {/* Name */}
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
        className="p-3 border rounded bg-transparent"
      />

      {/* Country */}
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
      onChange={(e) => setLocationQuery(e.target.value)}
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

  {/* RESULTS */}
  {locationResults.length > 0 && (
    <div className="mt-3 border rounded-xl max-h-64 overflow-y-auto">
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


      {/* Rating */}
      <input
        type="number"
        min="1"
        max="5"
        value={form.rating}
        onChange={(e) =>
          setForm({ ...form, rating: e.target.value })
        }
        className="p-3 border rounded bg-transparent"
      />

      {/* Image */}
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

      {/* Notes */}
      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) =>
          setForm({ ...form, notes: e.target.value })
        }
        className="p-3 border rounded md:col-span-2 bg-transparent"
      />

      {/* Buttons */}
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

        <div className="w-full overflow-hidden rounded-2xl mb-10">

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
            style={{
              height: '500px',
              width: '100%'
            }}
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
                  position={[
                    Number(d.lat),
                    Number(d.lng)
                  ]}
                  eventHandlers={{
                    click: () => {

                      setSearch(d.name)

                      setFilter('All')

                      setTimeout(
                        scrollToList,
                        100
                      )

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

        <div
          id="destination-list-section"
          className="mt-10 mb-3"
        >

          <h2
            className={`text-lg font-semibold ${
              darkMode
                ? 'text-white'
                : 'text-black'
            }`}
          >
            Your Destinations
          </h2>

        </div>

        {/* FILTERS */}

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
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className={`flex-1 p-3 rounded border ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
            }`}
          />

          {search && (

            <button
              onClick={() =>
                setSearch('')
              }
              className="text-sm text-indigo-500 font-bold px-2"
            >
              Show All
            </button>

          )}

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
            className={`p-3 rounded border ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
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
                darkMode
                  ? 'bg-zinc-900'
                  : 'bg-white'
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

                <div className="mt-2 text-sm opacity-70">
                  {d.category}
                </div>

                <div className="mt-2">
                  ⭐ {d.rating}
                </div>

                <p className="mt-4 text-sm opacity-80">
                  {d.notes}
                </p>

                <div className="flex gap-2 mt-4 flex-wrap">

                  <button
                    onClick={() =>
                      toggleVisited(d)
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {d.visited
                      ? 'Visited'
                      : 'Wishlist'}
                  </button>

                  {permissions.includes("WRITE") && (

                  <button
                    onClick={() =>
                      startEdit(d)
                    }
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                )}

                  {permissions.includes("DELETE") && (

                  <button
                    onClick={() =>
                      removeDestination(d.id)
                    }
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

        {/* EMPTY */}

        {filtered.length === 0 && (

          <div
            className={`mt-10 p-10 rounded-3xl text-center ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
            }`}
          >

            <h3 className="text-2xl font-bold mb-2">
              No destinations
            </h3>

            <p className="opacity-70">
              Add your first destination.
            </p>

          </div>

        )}

        {/* PAGINATION */}

        <div className="flex justify-center gap-4 mt-10">

          <button
            onClick={() =>
              setPage((p) =>
                Math.max(p - 1, 1)
              )
            }
            className="bg-gray-700 text-white px-5 py-2 rounded-xl"
          >
            Prev
          </button>

          <div
            className={`px-5 py-2 rounded-xl ${
              darkMode
                ? 'bg-zinc-900'
                : 'bg-white'
            }`}
          >
            Page {page}
          </div>

          <button
            onClick={() =>
              setPage((p) => p + 1)
            }
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl"
          >
            Next
          </button>

        </div>

      </div>

    </div>

  )

}