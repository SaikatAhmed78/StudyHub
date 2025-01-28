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



        // ROLE BASED Dashboard
        
        // (isAdmin)
        app.get('/users/admin/:email', async (req, res) => {
            const email = req?.params?.email;
            // const tokenEmail = req?.user?.email;
            // if (email !== tokenEmail) return res.status(401).send({ message: "Unauthorized Access" });

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user) {
                isAdmin = user?.role === 'admin';
            };
            res.send({ isAdmin });


        })


        // ROLE BASED Dashboard
        // (isTutor)
        app.get('/users/tutor/:email', async (req, res) => {
            const email = req?.params?.email;
            // const tokenEmail = req?.user?.email;
            // if (email !== tokenEmail) return res.status(401).send({ message: "Unauthorized Access" });

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isTutor = false;
            if (user) {
                isTutor = user?.role === 'tutor';
            };
            res.send({ isTutor });
        })


        

        // Approve/Reject session (Admin only)

        // true (aftar) search new
        app.get('/users', async (req, res) => {
            const { search } = req.query;

            const filter = search ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            } : {};
            const users = await usersCollection.find(filter).toArray();
            res.send(users);

        });



        // session reject (new)
        app.patch('/sessions/:id/reject', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'pending') {
                const updatedData = {
                    $set: { status: 'rejected' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }

        });

        // status approved(new)
        app.patch('/sessions/:id/payment-approved', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'pending') {
                const updatedData = {
                    $set: { status: 'approved' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }
        })

        // free approved(new)
        app.patch('/sessions/:id/free-approved', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'pending') {
                const updatedData = {
                    $set: { status: 'approved' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }
        })

        // update pending(new)
        app.patch('/sessions/:id/rejected-pending', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'rejected') {
                const updatedData = {
                    $set: { status: 'pending' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }
        })

        // approved to pending (new)
        app.patch('/sessions/:id/approved-pending', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'approved') {
                const updatedData = {
                    $set: { status: 'pending' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }
        })

        // update dropdown (new)
        app.patch('/sessionsU/:id/update-drop', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };

            const existingSession = await sessionsCollection.findOne(query);

            if (existingSession.status === 'approved') {
                const updatedData = {
                    $set: { status: 'pending' }
                }
                const result = await sessionsCollection.updateOne(query, updatedData)
                res.send(result)
            }
        });



        app.delete('/sessionsD/:id', async (req, res) => {
            try {
                const id = req.params.id;

                const query = { _id: new ObjectId(id) };
                const result = await sessionsCollection.deleteOne(query);

                if (result.deletedCount > 0) {
                    res.send({ message: 'Session deleted successfully.', result });
                } else {
                    res.status(404).send({ message: 'Session not found.' });
                }
            } catch (error) {
                console.error('Error deleting session:', error);
                res.status(500).send({ message: 'Internal server error.' });
            }
        });

        // paid approved
        app.patch('/paid-approved/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const addFee = req.query.addFee;
            console.log(addFee)

            const existedSession = await sessionsCollection.findOne(query);
            if(existedSession){
                const updetedData = {
                    $set: {
                        registrationFee: addFee,
                        status: 'approved' 
                    }
                }

                const result = await sessionsCollection.updateOne(query,updetedData)
                res.send(result)
            }

        })

    




        // Material APIs

        // Upload materials (Tutors only)
        app.post('/upload-material', async (req, res) => {
            const { title, sessionId, tutorEmail, image, link } = req.body;



            const materialData = {
                title,
                sessionId,
                tutorEmail,
                image,
                link,
                uploadedAt: new Date()
            };

            try {
                const result = await materialsCollection.insertOne(materialData);
                res.send({ success: true, insertedId: result.insertedId });
            } catch (error) {
                console.error("Error uploading material:", error);
                res.status(500).send({ message: 'Failed to upload material' });
            }
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













