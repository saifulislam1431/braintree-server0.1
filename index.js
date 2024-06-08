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

app.post('/createPaymentTransaction', async (req, res) => {
    const { body } = req;
    // console.log(body);

    try {
        //create a transaction
        const result = await gateway.transaction.sale({
            amount: body.amount,
            paymentMethodNonce: body.nonce,
            deviceData: body.deviceData, // Include device data
            options: {
                submitForSettlement: true
            }
        });
        console.log(result);

        res.status(200).json({
            isPaymentSuccessful: result.success,
            successText: result.transaction?.processorResponseText || "",
        });

    } catch (error) {
        console.log("Error in creating transaction ", error);
        res.status(400).json({
            isPaymentSuccessful: false, errorText: "Error in creating the payment transaction: " + error
        });
    }
});

app.post('/createPaymentTransactionByPaypal', async (req, res) => {
    // const { body } = req;
    // console.log(body);
    const saleRequest = {
        amount: req.body.amount,
        paymentMethodNonce: req.body.nonce,
        deviceData: req.body.deviceData,
        orderId: "01",
        options: {
            submitForSettlement: true,
            paypal: {
                customField: "PayPal custom field",
                description: "Test Payment Successful.",
            },
        }
    };

    try {
        //create a transaction
        gateway.transaction.sale(saleRequest).then(result => {
            if (result.success) {
                console.log("Success! Transaction ID: " + result.transaction.id);
            } else {
                console.log("Error:  " + result.message);
            }
        }).catch(err => {
            console.log("Error:  " + err);
        });

    } catch (error) {
        console.log("Error in creating transaction ", error);
        res.status(400).json({
            isPaymentSuccessful: false, errorText: "Error in creating the payment transaction: " + error
        });
    }
});

app.get('/client_token', async (req, res) => {
    try {
        const response = await gateway.clientToken.generate({});
        res.send(response.clientToken);
    } catch (err) {
        res.status(500).send(err);
    }
});


app.get('/braintree', function (req, res) {
    res.sendFile(path.join(__dirname, 'braintree.html'));
});

app.get('/paypal', (req, res) => {
    res.sendFile(path.join(__dirname, 'paypal.html'));
});

app.get('/googlePay', (req, res) => {
    res.sendFile(path.join(__dirname, 'googlePay.html'));
});

app.get("/", (req, res) => {
    res.send("Welcome to test payment API by Braintree");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
