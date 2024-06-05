require('dotenv').config();
const express = require('express');
const braintree = require('braintree');
const cors = require('cors');
const path = require('path');

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // Use Sandbox for testing, Production for live transactions
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

app.get('/client_token', (req, res) => {
    gateway.clientToken.generate({}, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.send(response.clientToken);
        }
    });
});

app.post('/checkout', (req, res) => {
    console.log(req.body);
    const { nonce, amount } = req.body;

    gateway.transaction.sale(
        {
            amount: amount,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true,
            },
        },
        (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else if (result.success) {
                res.send(result);
            } else {
                res.status(500).send(result.message);
            }
        }
    );
});

app.post('/createPaymentTransaction', async (req, res) => {
    const { body } = req;
    console.log(body);

    try {

        //create a transaction 
        const result = await gateway.transaction.sale({
            amount: body.amount,
            paymentMethodNonce: body.nonce,
            options: {
                submitForSettlement: true
            }
        });

        res.status(200).json({
            isPaymentSuccessful: result.success,
            successText: result.transaction?.processorResponseText || "",
        });

    } catch (error) {
        console.log("Error in creating transaction ", error);
        res.status(400).json({
            isPaymentSuccessful: false, errorText: "Error in creating the payment transaction" + error
        });

    }
});

app.get('/braintree', function (req, res) {
    res.sendFile(path.join(__dirname, 'braintree.html'));
});

app.get("/", (req, res) => {
    res.send("Welcome to test payment API by Braintree");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
