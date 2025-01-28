require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware

app.use(cors())
app.use(express.json());

// MongoDB setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1bvy3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db("eduConnect");
        const usersCollection = database.collection("users");
        const sessionsCollection = database.collection("sessions");
        const materialsCollection = database.collection("materials");
        const bookedSessionsCollection = database.collection("bookedSessions");
        const reviewsCollection = database.collection("reviews");
        const notesCollection = database.collection("notes");


        // Utility function to verify JWT
        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send({ message: 'Unauthorized access' });
            }

            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden access' });
                }
                req.decoded = decoded;
                next();
            });
        }

        // Authentication APIs

        // Sign up a new user
        app.post('/signup', async (req, res) => {
            const user = req.body;
            const existingUser = await usersCollection.findOne({ email: user.email });
            if (existingUser) {
                return res.send(existingUser);
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // Login and issue JWT
        app.post('/login', async (req, res) => {
            const { email, password } = req.body;
            const user = await usersCollection.findOne({ email, password });
            if (!user) {
                return res.status(401).send({ message: 'Invalid credentials' });
            }
            const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.send({ token });
        });





        // Start the server
        app.get('/', (req, res) => {
            res.send('EduConnect Server is running...');
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

run().catch(console.dir);













