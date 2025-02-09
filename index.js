const express = require("express");
const cors = require("cors");

const jwt = require("jsonwebtoken");
const http = require("http"); // HTTP Server প্রয়োজন
const socketIo = require("socket.io"); // Socket.IO ইনস্টল করো

const app = express();
require("dotenv").config();



const server = http.createServer(app); // HTTP Server তৈরি করো
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});



const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId,  } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uqwcx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
    // users
    const usersCollection = client.db("eventManagement").collection("users");
    //events
    const eventsCollection = client.db("eventManagement").collection("events");


//***************************************************************************************************************** */
    // ✅ **Socket.IO Setup**
    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      // ✅ নতুন কেউ যোগ দিলে, অংশগ্রহণকারী সংখ্যা বাড়িয়ে সবার কাছে পাঠানো হবে
      socket.on("joinEvent", async (eventId) => {
        const query = { _id: new ObjectId(eventId) };
        const update = { $inc: { participants: 1 } };

        await eventsCollection.updateOne(query, update);
        const updatedEvent = await eventsCollection.findOne(query);

        io.emit("eventUpdated", updatedEvent); // সবার কাছে নতুন সংখ্যা পাঠাও
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
    // app.post("/join-event/:id", async (req, res) => {
    //   const eventId = req.params.id;
    //   const query = { _id: new ObjectId(eventId) };
    //   const update = { $inc: { participants: 1 } };

    //   await eventsCollection.updateOne(query, update);
    //   const updatedEvent = await eventsCollection.findOne(query);

    //   io.emit("eventUpdated", updatedEvent); // রিয়েল-টাইমে সবার স্ক্রিনে আপডেট পাঠাও

    //   res.send(updatedEvent);
    // });


    // Backend: Join Event Route
app.post("/join-event/:id", async (req, res) => {
  const { email } = req.body; // Assume the user sends their email in the request body
  const eventId = req.params.id;

  // Check if the user has already joined this event
  const userExists = await usersCollection.findOne({ email, joinedEvents: eventId });
  if (userExists) {
    return res.status(400).send({ message: "You have already joined this event!" });
  }

  // Add user to the event's participants list
  const query = { _id: new ObjectId(eventId) };
  const update = { $inc: { participants: 1 } };

  await eventsCollection.updateOne(query, update);
  const updatedEvent = await eventsCollection.findOne(query);

  // Add event to the user's joined events list
  await usersCollection.updateOne({ email }, { $push: { joinedEvents: eventId } });

  // Emit event update via Socket.IO
  io.emit("eventUpdated", updatedEvent);

  res.send(updatedEvent);
});

    //********************************************************************************************************** */

    // JWT RELATED API __________________________________________________________________________________________

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });
    //  _____________________--------------jwt middle were------------------_________________________________________________
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    
    
 

    // post users data -------------------------------------------------------------------------------------------------

    app.post("/users/:email", async (req, res) => {
      try {
        // Your code...
        const email = req.params.email;
        const query = { email };
        const user = req.body;
        // check if user exist in database
        const isExist = await usersCollection.findOne(query);
        if (isExist) {
          return res.send(isExist);
        }
        const result = await usersCollection.insertOne({
          ...user,
          role: "user",
          timestamp: Date.now(),
        });
        res.send(result);
      } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send({ error: "Failed to save user" });
      }
    });

    // get all users___________________________________________________________________________
    app.get("/users", verifyToken,  async (req, res) => {
      console.log(req.headers);
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
  
    // create event ---------------------------------------------------------------------------------------------
    app.post("/events", async (req, res) => {
      const { eventName, description, eventDate,eventImage } = req.body;

      if (!eventName || !description || !eventDate || !eventImage) {
        return res
          .status(400)
          .send({
            error:
              "All fields (categoryName, categoryImage, quantity) are required.",
          });
      }

      try {
        const newCategory = {
          eventName,
          description,
          eventDate,
          eventImage,
        };
        const result = await eventsCollection.insertOne(newCategory);
        if (result.insertedId) {
          res
            .status(201)
            .send({ success: true, message: "event added successfully!" });
        } else {
          res.status(500).send({ error: "Failed to add category." });
        }
      } catch (error) {
        console.error("Error adding category:", error);
        res
          .status(500)
          .send({ error: "An error occurred while adding the category." });
      }
    });

    // get event
    app.get("/events", async (req, res) => {
      try {
        const events = await eventsCollection.find().toArray();
        res.send(events);
      } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).send({ error: "Failed to fetch events" });
      }
    });

    // delete event

// Delete event by ID
app.delete("/events/:id", async (req, res) => {
  const eventId = req.params.id;

  if (!ObjectId.isValid(eventId)) {
    return res.status(400).send({ error: "Invalid event ID" });
  }

  try {
    const query = { _id: new ObjectId(eventId) };
    const result = await eventsCollection.deleteOne(query);

    if (result.deletedCount === 1) {
      res.send({ success: true, message: "Event deleted successfully!" });
    } else {
      res.status(404).send({ error: "Event not found" });
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send({ error: "Failed to delete event" });
  }
});

// update event
// Update event by ID
app.put("/events/:id", async (req, res) => {
  const eventId = req.params.id;

  if (!ObjectId.isValid(eventId)) {
    return res.status(400).send({ error: "Invalid event ID" });
  }

  const updatedEvent = req.body;

  try {
    const query = { _id: new ObjectId(eventId) };
    const updateDoc = {
      $set: updatedEvent,
    };
    
    const result = await eventsCollection.updateOne(query, updateDoc);

    if (result.matchedCount === 1) {
      res.send({ success: true, message: "Event updated successfully!" });
    } else {
      res.status(404).send({ error: "Event not found" });
    }
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).send({ error: "Failed to update event" });
  }
});


   

   
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("med for you");
});

app.listen(port, () => {
  console.log(`medicine is wait at:${port}`);
});

