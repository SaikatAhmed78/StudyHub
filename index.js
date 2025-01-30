const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware 

app.use(cors(
    {
        origin: [
            'https://educonnect-7c172.web.app',
            'http://localhost:5173'
        ],
        credentials: true
    }
))
app.use(express.json());
app.use(cookieParser())

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
        // await client.connect();
        // console.log('Connected to MongoDB');

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


        // tutor home page information page
        app.get('/information', async (req, res) => {
            const query = { role: 'tutor' };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });



        // Login and issue JWT
        // app.post('/login', async (req, res) => {
        //     const { email, password } = req.body;
        //     const user = await usersCollection.findOne({ email, password });
        //     if (!user) {
        //         return res.status(401).send({ message: 'Invalid credentials' });
        //     }

        //     res.send({ token });
        // });



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
        app.patch('/paid-approved/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const addFee = req.query.addFee;
            console.log(addFee)

            const existedSession = await sessionsCollection.findOne(query);
            if (existedSession) {
                const updetedData = {
                    $set: {
                        registrationFee: addFee,
                        status: 'approved'
                    }
                }

                const result = await sessionsCollection.updateOne(query, updetedData)
                res.send(result)
            }

        })






        // Material APIs

        // upload session
        app.post('/create-session', async (req, res) => {
            const { title, tutorName, tutorEmail, description, registrationStartDate, registrationEndDate, classStartDate, classEndDate, duration, image } = req.body;
        
            // Create a study session data object
            const sessionData = {
                title,
                tutorName,
                tutorEmail,
                description,
                registrationStartDate,
                registrationEndDate,
                classStartDate,
                classEndDate,
                duration,
                image,
                status: "pending", // Initial status
                registrationFee: 0, // Default registration fee
                createdAt: new Date(),
            };
        
            const result = await sessionsCollection.insertOne(sessionData);
        
            
            if (result.acknowledged) {
                res.send({ success: true, insertedId: result.insertedId });
            } else {
                res.status(500).send({ message: 'Failed to create session' });
            }
        });
        



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

        // all session id
        app.get('/allsessionIds', async (req, res) => {
            const result = await sessionsCollection.find().toArray();
            res.send(result)
        })

        // getAllMeterials
        app.get('/getAllMeterials', async (req, res) => {
            const result = await materialsCollection.find().toArray();
            res.send(result)
        })


        // meterial display (aftar)
        app.get('/materials/tutor/:tutorId', async (req, res) => {
            const tutorId = req.params.tutorId;
            const materials = await materialsCollection.find({ tutorId }).toArray();
            res.send(materials);


        });


        // new ViewStudyMaterials 
        app.get('/materials/:sessionId', async (req, res) => {
            const sessionId = req.params.sessionId;
            try {
                const materials = await materialsCollection.find({ sessionId }).toArray();
                res.send(materials);
            } catch (error) {
                res.status(500).send({ error: 'Failed to fetch materials' });
            }
        });

        app.get('/booked-sessions', async (req, res) => {
            try {
                const bookedSessions = await bookedSessionsCollection.find({}).toArray();
                res.send(bookedSessions);
            } catch (error) {
                res.status(500).send({ error: 'Failed to fetch booked sessions' });
            }
        });



        // aftar
        app.delete('/materials/:id', async (req, res) => {
            const id = req.params.id;
            const result = await materialsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });



        // update meterial (new)
        app.patch('/updateMeterial/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const meterialData = req.body.updatedTitle;
            const updatedData = {
                $set: { title: meterialData }
            }

            const result = await materialsCollection.updateOne(query, updatedData)

            res.send(result)


        })




        // User APIs

        // Get all users (Admin only) new
        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });


        // Update user role (Admin only) new
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const { role } = req.body;
            const query = { _id: new ObjectId(id) };


            const updatedDoc = {
                $set: { role: role }
            }
            const result = await usersCollection.updateOne(query, updatedDoc)
            res.send(result);
        });



        // student part start

        // post note
        app.post('/notes', async (req, res) => {
            const note = req.body;
            const result = await notesCollection.insertOne(note);
            res.send(result);
        });


        // get all notes
        app.get('/all-notes', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.status(400).send({ message: 'Email query parameter is required' });
            }
            const notes = await notesCollection.find({ userEmail: email }).toArray();
            res.send(notes);
        });


        // Update a note
        app.put('/notes/:id', async (req, res) => {
            const noteId = req.params.id;
            const { title, description } = req.body;

            try {
                const result = await notesCollection.updateOne(
                    { _id: new ObjectId(noteId) },
                    { $set: { title, description } }
                );

                if (result.matchedCount > 0) {
                    res.status(200).send({ message: 'Note updated successfully' });
                } else {
                    res.status(404).send({ message: 'Note not found' });
                }
            } catch (error) {
                res.status(500).send({ message: 'Error updating note', error });
            }
        });


        // Delete a note
        app.delete('/notes/:id', async (req, res) => {
            const noteId = req.params.id;

            try {
                // Attempt to delete the note from the database
                const result = await notesCollection.deleteOne({ _id: new ObjectId(noteId) });

                if (result.deletedCount === 0) {
                    // If no note was deleted, send an error response
                    return res.status(404).send({ message: 'Note not found' });
                }

                // If successful, send a success response
                res.status(200).send({ message: 'Note deleted successfully' });
            } catch (error) {
                // Handle unexpected errors
                res.status(500).send({ message: 'Error deleting note', error });
            }
        });


        // Get sessions with pagination
        app.get('/sessions', async (req, res) => {
            const { page = 1, limit = 6 } = req.query;
            const sessions = await sessionsCollection.find()
                .skip((page - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .toArray();
            res.send(sessions);
        });

        // all sessions tutor & admin
        app.get('/all-sessions-tutor', async (req, res) => {
            const page = parseInt(req.query.page) || 1; 
            const limit = parseInt(req.query.limit) || 6; 
            const skip = (page - 1) * limit; 
        
            try {
                const totalSessions = await sessionsCollection.countDocuments();
                const sessions = await sessionsCollection.find().skip(skip).limit(limit).toArray();
                
                res.send({
                    sessions,
                    totalPages: Math.ceil(totalSessions / limit),
                    currentPage: page
                });
            } catch (error) {
                res.status(500).send({ error: "Unable to fetch sessions" });
            }
        });
        
        


        //   allSessions route with pagination
        app.get('/allSessions', async (req, res) => {
            try {

                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 6;
                const skip = (page - 1) * limit;

                const result = await sessionsCollection
                    .find()
                    .skip(skip)
                    .limit(limit)
                    .toArray();


                const totalSessions = await sessionsCollection.countDocuments();
                res.send({
                    sessions: result,
                    totalSessions,
                    currentPage: page,
                    totalPages: Math.ceil(totalSessions / limit)
                });
            } catch (error) {
                console.error("Database Fetch Error:", error);
                res.status(500).send({ message: "Server Error", error });
            }
        });



        // Get session details by ID
        app.get('/sessions/:id', async (req, res) => {
            const { id: sessionId } = req.params;

            try {
                const sessionDetails = await sessionsCollection.findOne({_id: new ObjectId(sessionId) });
                res.send({ sessionDetails });
            } catch (error) {
                console.error('Error fetching session details:', error);
                res.status(500).send({ error: 'Failed to fetch session details' });
            }
        });


        // session booknow
        app.post('/postData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const existedSession = await sessionsCollection.findOne(query);
            console.log(existedSession)
            if (existedSession) {
                const result = await bookedSessionsCollection.insertOne(existedSession);

                res.send(result)
            }
        });

        app.get('/postData', async (req, res) => {
            const result = await bookedSessionsCollection.find().toArray();
            res.send(result)
        })


        // Create a review for a session
        app.post('/sessions/:id/review', async (req, res) => {
            const { rating, reviewText } = req.body;
            const sessionId = req.params.id;

            const review = {
                sessionId: new ObjectId(sessionId),
                rating,
                reviewText,
                createdAt: new Date(),
            };

            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        });





        // payment admin new
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price) * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                payment_method_types: ['card']
            })

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })




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













