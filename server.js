require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const app = express();
app.use(express.static('public'));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

const YOUR_DOMAIN = 'http://localhost:4242';


app.post('/create-checkout-session', async (req, res) => {
  const { amount, donationType, giftaid } = req.body;
  const amountToCharge = parseInt(amount * 100); // Convert to pence

  let session;
  if (donationType === 'monthly') {
    // Create subscription session
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Monthly Donation',
              description: 'Monthly Donation Subscription',
            },
            unit_amount: amountToCharge,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      custom_fields: [{
        key: 'giftaid',
        label: { type: 'custom', custom: 'May we claim gift aid on your donation?'},
        type: 'dropdown',
        dropdown: {
          options: [
            {label: "Yes", value: "Yes"},
            {label: 'No', value: 'No'},
          ]
        }
      }],
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });
  } else {
    // Create one-time payment session
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'One-time Donation',
              description: 'One-time Donation',
            },
            unit_amount: amountToCharge,
          },
          quantity: 1,
        },
      ],
      custom_fields: [{
        key: 'giftaid',
        label: { type: 'custom', custom: 'May we claim gift aid on your donation?'},
        type: 'dropdown',
        dropdown: {
          options: [
            {label: "Yes", value: "Yes"},
            {label: 'No', value: 'No'},
          ]
        }
      }],
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });
  }

  res.redirect(303, session.url);
});

app.listen(4242, () => console.log('Running on port 4242'));

