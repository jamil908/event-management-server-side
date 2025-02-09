
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://event-management-server-side-wine.vercel.app",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqwcx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.db("admin").command({ ping: 1 });
    // console.log("✅ Connected to MongoDB!");

    const usersCollection = client.db("eventManagement").collection("users");
    const eventsCollection = client.db("eventManagement").collection("events");

    // 🔴 Socket.IO - Real-time event updates
    io.on("connection", (socket) => {
      console.log("🔌 User connected:", socket.id);

      socket.on("joinEvent", async (eventId) => {
        if (!ObjectId.isValid(eventId)) return;

        const query = { _id: new ObjectId(eventId) };
        const update = { $inc: { participants: 1 } };

        await eventsCollection.updateOne(query, update);
        const updatedEvent = await eventsCollection.findOne(query);
        io.emit("eventUpdated", updatedEvent); // Broadcast event update
      });

      socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
    });

    // 🔐 JWT Authentication
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5h" });
      res.send({ token });
    });

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(403).send({ error: "Unauthorized" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(403).send({ error: "Unauthorized" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // 🏷️ User Routes
    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const isExist = await usersCollection.findOne({ email });
      if (isExist) return res.send(isExist);
      
      const result = await usersCollection.insertOne({ ...user, role: "user", timestamp: Date.now() });
      res.send(result);
    });

    // 📅 Event Routes
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.send(events);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch events" });
      }
    });

    app.post("/events",verifyToken, async (req, res) => {
      const { eventName, description, eventDate, eventImage } = req.body;
      if (!eventName || !description || !eventDate || !eventImage) {
        return res.status(400).send({ error: "All fields are required" });
      }
      const newEvent = { eventName, description, eventDate, eventImage, participants: 0 };
      const result = await eventsCollection.insertOne(newEvent);
      res.status(201).send({ success: true, message: "Event added successfully!" });
    });

    // ✅ Join Event Route
    app.post("/join-event/:id", async (req, res) => {
      const eventId = req.params.id;
      if (!ObjectId.isValid(eventId)) return res.status(400).send({ error: "Invalid event ID" });

      try {
        const query = { _id: new ObjectId(eventId) };
        const update = { $inc: { participants: 1 } };

        const result = await eventsCollection.updateOne(query, update);
        if (result.matchedCount === 1) {
          const updatedEvent = await eventsCollection.findOne(query);
          io.emit("eventUpdated", updatedEvent); // Emit real-time update
          res.send(updatedEvent);
        } else {
          res.status(404).send({ error: "Event not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Failed to join event" });
      }
    });

    // 🗑️ Delete Event
    app.delete("/events/:id",verifyToken, async (req, res) => {
      const eventId = req.params.id;
      if (!ObjectId.isValid(eventId)) return res.status(400).send({ error: "Invalid event ID" });

      try {
        const query = { _id: new ObjectId(eventId) };
        const result = await eventsCollection.deleteOne(query);
        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Event deleted successfully!" });
        } else {
          res.status(404).send({ error: "Event not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Failed to delete event" });
      }
    });

    // 🔄 Update Event
    app.put("/events/:id",verifyToken, async (req, res) => {
      const eventId = req.params.id;
      if (!ObjectId.isValid(eventId)) return res.status(400).send({ error: "Invalid event ID" });

      const updatedEvent = req.body;
      try {
        const query = { _id: new ObjectId(eventId) };
        const updateDoc = { $set: updatedEvent };

        const result = await eventsCollection.updateOne(query, updateDoc);
        if (result.matchedCount === 1) {
          res.send({ success: true, message: "Event updated successfully!" });
        } else {
          res.status(404).send({ error: "Event not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Failed to update event" });
      }
    });

  } catch (error) {
    console.error("❌ Database connection error:", error);
  }
}

run().catch(console.dir);

// 🌐 Root Route
app.get("/", (req, res) => res.send("Event Management API"));

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
