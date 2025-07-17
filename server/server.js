require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Document = require("./models/Document");

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); 
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("get-document", async (documentId) => {
    if (!documentId) return;
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.content);

    socket.on("send-changes", (newContent) => {
      socket.broadcast.to(documentId).emit("receive-changes", newContent);
    });

    socket.on("save-document", async (content) => {
      await Document.findByIdAndUpdate(documentId, { content });
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.post("/save", async (req, res) => {
  const { id, content } = req.body;
  if (!id || content == null) {
    return res.status(400).send("Invalid data");
  }
  try {
    await Document.findByIdAndUpdate(id, { content }, { upsert: true });
    res.status(200).send("Document saved");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving document");
  }
});

async function findOrCreateDocument(id) {
  if (!id) return;

  const existingDoc = await Document.findById(id);
  if (existingDoc) return existingDoc;

  return await Document.create({ _id: id, content: "" });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
