require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const { Parser } = require('json2csv');

// Function to fetch checkout sessions
async function fetchSessionsForDateRange(fromDate, toDate) {
    const startDate = new Date(fromDate).getTime() / 1000;
    const endDate = new Date(toDate).getTime() / 1000;
    let allSessions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
        const params = {
            limit: 100,
            created: { gte: startDate, lte: endDate },
            status: 'complete',
            expand: ['data.line_items'],
        };

        if (startingAfter) {
            params.starting_after = startingAfter;
        }

        const sessions = await stripe.checkout.sessions.list(params);
        allSessions = allSessions.concat(sessions.data);
        hasMore = sessions.has_more;
        if (hasMore) {
            startingAfter = sessions.data[sessions.data.length - 1].id;
        }
    }

    return allSessions;
}


// Function to filter sessions for Gift Aid
function filterSessionsForGiftAid(sessions) {
  return sessions.filter(session => session.metadata.giftaid === 'yes');
}

function formatDateToCustomString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}


// Function to generate CSV report
function generateCSVReport(sessions) {
    
    const sessionsWithGiftAid = sessions.map(session => {
        const amountTotal = session.amount_total / 100; // Convert to pounds
        const giftAidEligibleAmount = amountTotal * 0.25; // Calculate 25% for Gift Aid

        const paymentDate = formatDateToCustomString(new Date(session.created * 1000));

        const giftAidDeclaration = `Yes, I am a UK Tax Payer and I would like Action for Child Trauma International to reclaim the tax on all qualifying donations I have made, as well as any future donations, until I notify them otherwise. I understand that if I pay less income/capital gains tax than the amount of Gift Aid claimed on all my donations in the tax year in which they are received, it is my responsibility to pay any difference and that I must notify the charity of any changes to my tax status, including changes to my name or address.`;
        const currentDate = formatDateToCustomString(new Date());
        return {
            id: session.id,
            payment_date: paymentDate,
            customer_name: session.customer_details?.name || 'No name provided',
            address: session.customer_details?.address ? formatAddress(session.customer_details.address) : 'No address provided',
            donation_amount: amountTotal.toFixed(2),
            eligible_gift_aid: giftAidEligibleAmount.toFixed(2),
            gift_aid_declaration: giftAidDeclaration,
            report_date: currentDate
        };
    });

    const fields = ['id', 'report_date', 'customer_name', 'address', 'donation_amount', 'payment_date', 'eligible_gift_aid', 'gift_aid_declaration'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(sessionsWithGiftAid);

    fs.writeFileSync('gift_aid_report.csv', csv);
    console.log('Report generated: gift_aid_report.csv');
}
// Helper function to format address
function formatAddress(address) {
    return `${address.line1}, ${address.line2 || ''} ${address.city}, ${address.postal_code}, ${address.country}`;
  }
// Main function to generate the Gift Aid report
async function generateGiftAidReport(fromDate, toDate) {
    try {
        const sessions = await fetchSessionsForDateRange(fromDate, toDate);
        const giftAidSessions = filterSessionsForGiftAid(sessions);
        generateCSVReport(giftAidSessions);
    } catch (error) {
        console.error('Error generating report:', error);
    }
}

// Parse command-line arguments
const args = process.argv.slice(2);
const fromDate = args[0];
const toDate = args[1];

if (!fromDate || !toDate) {
    console.log('Please provide the from and to dates as arguments. E.g., node report.js "2024-03-01" "2024-03-31"');
} else {
    generateGiftAidReport(fromDate, toDate);
}