const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId, } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('doctor server is running');
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o0lhbrs.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollections = client.db('doctorsPortal').collection('services')
        const reviewCollections = client.db('doctorsPortal').collection('reviews')

        app.get('/services', async(req, res) =>{
            const query = {};
            const cursor = serviceCollections.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });
        app.get('/servicesHome', async(req, res) =>{
            const query = {};
            const cursor = serviceCollections.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services)
        });

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollections.findOne(query);
            res.send(service);
        });
        
        // added service collection
        app.post('/services', async(req, res) => {
            const service = req.body;
            const result = serviceCollections.insertOne(service);
            res.send(result); 
        })


        // reviews api
        app.get('/reviews', async(req, res) => {
            console.log(req.query)
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

        

        


        

        


    }
    finally{

    }
}
run().catch(err => console.error(err));

app.listen(port, () => {
    console.log(`doctor portal running on:: ${port}`);
})