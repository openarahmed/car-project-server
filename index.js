const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

//  car-services  MX1Cs6sF512XaTsA

const uri = "mongodb+srv://car-services:MX1Cs6sF512XaTsA@cluster0.ybsvrsr.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) =>{
const authorization = req.headers.authorization;
if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized acces'})
}
const token = authorization.split(' ')[1];
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) =>{
    if(error){
        return res.status(403).send({error: true, message: 'unauthoraized acces'})
    }
    req.decoded = decoded;
    next()
})
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const servicesCollection = client.db('car-services').collection('servicesUser')
        const bookingcollection = client.db('car-services').collection('booking')

        app.post('/jwt', (req, res)=>{
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            console.log(token)
            res.send({token})
        })


        app.get('/services', async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await servicesCollection.findOne(query);
            res.send(result);
        })

        app.post('/user', async(req, res)=>{
            const user = req.body;
            const result = await bookingcollection.insertOne(user)
            res.send(result)
            console.log(user)
        })

        app.get('/user', verifyJWT, async(req, res)=>{
            const decoded = req.decoded
            console.log(req.query);
            if(decoded.email !== req.query.email){
                return res.status(403).send({error: 1, message: 'forbidden access'})
            }


            let query = {};
            if(req.query?.email){
                query = {email: req.query.email}
            }
            const result = await bookingcollection.find(query).toArray();
            res.send(result)
            })

        app.get('/user', async(req, res)=> {
            const cursor = bookingcollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.delete('/user/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await bookingcollection.deleteOne(query)
            res.send(result)
        })

      



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car doctor server running')
})

app.listen(port, () => {
    console.log(`Cart doctor app listening on port ${port}`)
})