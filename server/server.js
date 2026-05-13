const express = require("express")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const bodyParser = require("body-parser")
const fs = require("fs")
const swaggerUi = require("swagger-ui-express")

const app = express()
app.use(cors())
app.use(bodyParser.json())

const SECRET = "super_secret_key"

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
// JWT TOKEN ENDPOINT
// ======================
app.post("/token", (req, res) => {
  const { role } = req.body

  let permissions = []

  if (role === "ADMIN") {
    permissions = ["READ", "WRITE", "DELETE"]
  } else if (role === "WRITER") {
    permissions = ["READ", "WRITE"]
  } else if (role === "VISITOR") {
    permissions = ["READ"]
  } else {
    return res.status(400).json({ error: "Invalid role" })
  }

  const token = jwt.sign(
    { role, permissions },
    SECRET,
    { expiresIn: "1m" }
  )

  res.json({ token })
})

// ======================
// JWT MIDDLEWARE
// ======================
function auth(requiredPermission) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    try {
      const decoded = jwt.verify(token, SECRET)
      req.user = decoded

      if (!decoded.permissions?.includes(requiredPermission)) {
        return res.status(403).json({ error: "Forbidden - insufficient permissions" })
      }

      next()
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" })
    }
  }
}

// ======================
// SWAGGER CONFIG
// ======================
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Travel Tracker API",
    version: "1.0.0",
    description: "CRUD API with JWT authentication"
  },
  servers: [
    {
      url: "http://localhost:5000"
    }
  ],
  paths: {
    "/token": {
      post: {
        summary: "Generate JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["ADMIN", "WRITER", "VISITOR"]
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Token generated"
          }
        }
      }
    }
  }
}

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ======================
// HEALTH CHECK
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// ======================
// GET DESTINATIONS
// ======================
app.get("/destinations", auth("READ"), (req, res) => {
  const page = parseInt(req.query.page || 1)
  const limit = parseInt(req.query.limit || 6)

  const start = (page - 1) * limit
  const end = start + limit

  res.json({
    data: destinations.slice(start, end),
    total: destinations.length,
    page
  })
})

// ======================
// CREATE
// ======================
app.post("/destinations", auth("WRITE"), (req, res) => {
  const { name, country, lat, lng } = req.body

  if (!name || !country || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const newDestination = {
    id: Date.now(),
    ...req.body,
    rating: req.body.rating || 3,
    visited: req.body.visited || false
  }

  destinations.unshift(newDestination)
  saveDB()

  res.status(201).json(newDestination)
})

// ======================
// UPDATE
// ======================
app.put("/destinations/:id", auth("WRITE"), (req, res) => {
  const id = parseInt(req.params.id)

  const index = destinations.findIndex(d => d.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" })
  }

  destinations[index] = {
    ...destinations[index],
    ...req.body
  }

  saveDB()

  res.json({
    message: "Updated successfully",
    data: destinations[index]
  })
})

// ======================
// DELETE
// ======================
app.delete("/destinations/:id", auth("DELETE"), (req, res) => {
  const id = parseInt(req.params.id)

  const index = destinations.findIndex(d => d.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" })
  }

  destinations.splice(index, 1)
  saveDB()

  res.json({ message: "Deleted successfully" })
})

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`)
})