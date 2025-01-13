const express = require("express");
const dotEnv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors")

// Load environment variables
dotEnv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware

app.use(express.json());

app.use(cors());


// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database is connected to MongoDB");
   // Insert dummy data after successful connection
  })
  .catch(err => console.log("Database connection failed", err));

// Invoice schema and model
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// User schema and model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// POST route for user registration
app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up." });
    }

    // Check if the password matches
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // If user exists and password is correct
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/home", async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Error fetching invoices", error });
  }
});

app.post('/add', async (req, res) => {
  const { invoiceNumber, clientName, date, amount, status } = req.body;

  try {
    // Create new invoice
    const newInvoice = new Invoice({ invoiceNumber, clientName, date, amount, status });
    await newInvoice.save();

    res.status(201).json({ message: 'Invoice added successfully', invoice: newInvoice });
  } catch (error) {
    res.status(500).json({ message: 'Error adding invoice', error });
  }
});

app.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { invoiceNumber, clientName, date, amount, status } = req.body;

  try {
    // Find the invoice by ID and update it
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { invoiceNumber, clientName, date, amount, status },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice updated successfully", invoice: updatedInvoice });
  } catch (error) {
    res.status(500).json({ message: "Error updating invoice", error });
  }
});

app.get('/invoice/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }
    res.send(invoice);
  } catch (error) {
    res.status(500).send('Error fetching invoice');
  }
});

app.delete('/delete/:id', async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).send('Invoice not found');
    }
    res.send({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).send('Error deleting invoice');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Invoicing API');
});

// Start server
app.listen(port, () => console.log(`Server listening at the port number ${port}`));
