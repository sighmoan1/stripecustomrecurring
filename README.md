# Custom recurring donation amounts with Stripe

This is based on <https://stripe.com/docs/checkout/quickstart> and <https://youtu.be/1-olKBnmC84?feature=shared>.

It allows you to send custom amounts for one-off or recurring donations to your non-profit. The product and price will be created dynamically at the time the user submits.

It's useful if you want to ask for one-off and recurring donations and let the user decide.

## Setting up .env

You need a .env file with:

```
STRIPE_SECRET_KEY = 'sk...'
```

Where 'sk...' is your secret key from Stripe. If you want to use this in production, then it would be your real secret key not your test secret key.

You should also add .env to your .gitignore so that you don't end up writing your secret key to github.

## Running the sample

1. Build the server

~~~
npm install
~~~

2. Run the server

~~~
npm start
~~~

3. Go to [http://localhost:4242/checkout.html](http://localhost:4242/checkout.html)




Main Branch - No gift aid giftaid-metadata - Get the giftaid declaration on the webform and send to Stripe as metadata. Then create reporting to show all payments with giftaid='yes' metadata giftaid-custom-fields - Get the giftaid declaration on the checkout page.



