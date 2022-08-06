const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
var admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 5000;

// firebase admin initialization


var serviceAccount = require('./ema-john-simple-7b83e-firebase-adminsdk-7a9aw-2e494946de.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zqquk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodedUserEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('online_Shop');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        // GET PRODUCTS API
        app.get('/products', async (req, res) => {
            console.log(req.query);
            const cursor = productCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                products = await cursor.toArray();
            }


            res.send({ products, count });
        });

        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (req.decodedUserEmail === email) {

                const query = { email: email };

                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.json(result);
            }
            else {
                res.status(401).json({ message: 'User not authorized' })
            }



        });

        // Use Post to get keys
        app.post('/products/keys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } };
            const products = await productCollection.find(query).toArray();
            res.json(products);
        });
        // Add Orders API
        app.post('/orders', async (req, res) => {
            const order = req.body;
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order);
            res.json(result);
        })


    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server running');
})
app.listen(port, () => {
    console.log('listening from server,', port);
})