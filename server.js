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
      submit_type: 'donate',
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
      custom_fields: [
        {
          key: 'giftaid_declaration',
          label: { 
            type: 'custom', 
            custom: 'Gift Aid Declaration: I am a UK Tax Payer and I agree that ACT International can reclaim tax on all qualifying donations I have made, as well as any future donations, until I notify them otherwise. I understand that if I pay less income/capital gains tax than the amount of Gift Aid claimed on all my donations in the tax year in which they are received, it is my responsibility to pay any difference. I must notify the charity of any changes to my tax status, including changes to my name or address.' 
          },  
          type: 'checkbox',
          checkbox: {
            required: true,
          }
        }
      ],
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });
  } else {
    // Create one-time payment session
    session = await stripe.checkout.sessions.create({
      submit_type: 'donate',
      mode: 'payment',
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'One-time Donation',
              description: 'Huge potato',
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

