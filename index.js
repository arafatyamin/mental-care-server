const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 9000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('doctor server is running');
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o0lhbrs.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader){
       return res.status(401).send({message:  'forbadden authorization'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
           return res.status(401).send({message: 'unauthorized access '})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const serviceCollections = client.db('doctorsPortal').collection('services')
        const reviewCollections = client.db('doctorsPortal').collection('reviews')

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '10d'})
            res.send({token}); 
        })

        app.get('/services', async(req, res) =>{
            const query = {};
            const cursor = serviceCollections.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });
        app.get('/servicesHome', async(req, res) =>{
            const query = {};
            const cursor = serviceCollections.find(query);
            const services = await cursor.toArray();
            const servicesHome = services.reverse();
            res.send(servicesHome)
        });

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollections.findOne(query);
            res.send(service);
        });
        
        // added service collection
        app.post('/services', async(req, res) =>{
            const service = req.body;
            const result = serviceCollections.insertOne(service);
            res.send(result); 
        })


        // reviews api
        app.get('/reviews', verifyJWT, async(req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' });
            }

            let query = {};
            if(req.query.email){
                query = {
                     email: req.query.email
                }
            }
            const cursor = reviewCollections.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.post('/reviews', async(req, res)=>{
            const review = req.body;
            const result = reviewCollections.insertOne(review);
            res.send(result); 
        })

        // reviews delete
        app.delete('/reviews/:id', verifyJWT, async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await reviewCollections.deleteOne(query);
            res.send(result);
        })


        // reviews updated
        app.put('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const info = req.body;
            console.log(req)
            const option = {upsert: true};
            const update = {
                $set: {
                    message:info.message
                }
            }
            const result = await reviewCollections.updateOne(filter, update,option)
            res.send(result)
        })

        app.get('/reviews/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const user = await reviewCollections.findOne(query);
            res.send(user);
        })


    }
    finally{

    }
}
run().catch(err => console.error(err));

app.listen(port, () => {
    console.log(`doctor portal running on:: ${port}`);
})