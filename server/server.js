const express = require("express")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const bodyParser = require("body-parser")
const swaggerUi = require("swagger-ui-express")

const app = express()
app.use(cors())
app.use(bodyParser.json())

const SECRET = "super_secret_key"

// ======================
// IN-MEMORY DATABASE
// ======================
const fs = require("fs")
const DB_FILE = "./destinations.json"

// Load from file or use defaults
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
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop"
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
        image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop"
      }
    ]
// Helper to save
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(destinations, null, 2))
}

// ======================
// JWT MIDDLEWARE
// ======================
function auth(requiredPermission) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No token" })
    }

    try {
      const decoded = jwt.verify(token, SECRET)
      req.user = decoded

      if (
        !decoded.permissions ||
        !decoded.permissions.includes(requiredPermission)
      ) {
        return res.status(403).json({ error: "Forbidden" })
      }

      next()
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" })
    }
  }
}

// ======================
// SWAGGER SPECIFICATION
// ======================
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Travel Tracker API",
    version: "1.0.0",
    description: "REST API for managing travel destinations with JWT authentication"
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "JWT token from /token endpoint"
      }
    },
    schemas: {
      Destination: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          country: { type: "string" },
          category: { type: "string" },
          rating: { type: "number", minimum: 1, maximum: 5 },
          visited: { type: "boolean" },
          notes: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          image: { type: "string" }
        }
      }
    }
  },
  paths: {
    "/token": {
      post: {
        summary: "Generate JWT token",
        description: "Returns a JWT token with permissions based on role",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: {
                    type: "string",
                    enum: ["ADMIN", "WRITER", "VISITOR"],
                    description: "User role (ADMIN=full access, WRITER=read+write, VISITOR=read only)"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "JWT token generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "JWT token valid for 1 minute" }
                  }
                }
              }
            }
          },
          "400": { description: "Invalid role" }
        }
      }
    },
    "/health": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string" } }
                }
              }
            }
          }
        }
      }
    },
    "/destinations": {
      get: {
        summary: "Get all destinations with pagination",
        description: "Retrieve all destinations with support for pagination",
        tags: ["Destinations"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
            description: "Page number (1-indexed)"
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 6 },
            description: "Number of items per page"
          }
        ],
        responses: {
          "200": {
            description: "List of destinations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Destination" }
                    },
                    total: { type: "number" },
                    page: { type: "number" }
                  }
                }
              }
            }
          },
          "401": { description: "Unauthorized - no token provided" },
          "403": { description: "Forbidden - insufficient permissions" }
        }
      },
      post: {
        summary: "Create a new destination",
        tags: ["Destinations"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "country", "lat", "lng"],
                properties: {
                  name: { type: "string" },
                  country: { type: "string" },
                  category: { type: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5 },
                  visited: { type: "boolean" },
                  notes: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  image: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Destination created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Destination" }
              }
            }
          },
          "400": { description: "Missing required fields" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - insufficient permissions" }
        }
      }
    },
    "/destinations/{id}": {
      put: {
        summary: "Update a destination",
        tags: ["Destinations"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "number" },
            description: "Destination ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  country: { type: "string" },
                  category: { type: "string" },
                  rating: { type: "number", minimum: 1, maximum: 5 },
                  visited: { type: "boolean" },
                  notes: { type: "string" },
                  lat: { type: "number" },
                  lng: { type: "number" },
                  image: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Destination updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Destination" }
                  }
                }
              }
            }
          },
          "404": { description: "Destination not found" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" }
        }
      },
      delete: {
        summary: "Delete a destination",
        tags: ["Destinations"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "number" },
            description: "Destination ID"
          }
        ],
        responses: {
          "200": {
            description: "Destination deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } }
                }
              }
            }
          },
          "404": { description: "Destination not found" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" }
        }
      }
    }
  }
}

// ======================
// SWAGGER UI SETUP
// ======================
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ======================
// API ENDPOINTS
// ======================

// Token endpoint
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// Get destinations with pagination
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

// Create destination
app.post("/destinations", auth("WRITE"), (req, res) => {
  const { name, country, lat, lng } = req.body

  if (!name || !country || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "Missing required fields: name, country, lat, lng" })
  }

  const newItem = {
    id: Date.now(),
    ...req.body,
    rating: req.body.rating || 3,
    visited: req.body.visited || false
  }

   destinations.unshift(newItem)
  saveDB()
  res.status(201).json(newItem)
})

// Update destination
app.put("/destinations/:id", auth("WRITE"), (req, res) => {
  const id = parseInt(req.params.id)
  const index = destinations.findIndex(d => d.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" })
  }

  destinations[index] = { ...destinations[index], ...req.body }
  saveDB()
  res.json({ message: "Updated successfully", data: destinations[index] })
})

// Delete destination
app.delete("/destinations/:id", auth("DELETE"), (req, res) => {
  const id = parseInt(req.params.id)
  const index = destinations.findIndex(d => d.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" })
  }

  destinations.splice(index, 1)
  saveDB()
  res.status(200).json({ message: "Deleted successfully" })
})
// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`)
})
 