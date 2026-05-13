const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const fs = require("fs")

const app = express()
app.use(cors())
app.use(bodyParser.json())

const DB_FILE = "./destinations.json"

// ======================
// IN-MEMORY DATABASE
// ======================
let destinations = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, "utf-8"))
  : [
      {
        id: 1,
        name: "Tokyo",
        country: "Japan",
        category: "City",
        rating: 5,
        visited: false,
        notes: "Visit Akihabara",
        lat: 35.6764,
        lng: 139.65,
        image:
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop"
      },
      {
        id: 2,
        name: "Santorini",
        country: "Greece",
        category: "Beach",
        rating: 4,
        visited: true,
        notes: "Sunset views",
        lat: 36.3932,
        lng: 25.4615,
        image:
          "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop"
      }
    ]

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(destinations, null, 2))
}

// ======================
// HEALTH CHECK
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})