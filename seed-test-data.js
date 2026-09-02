require("dotenv").config();

const API_URL = "http://localhost:3000/api";
const TOKEN = process.env.SEED_USER_TOKEN;

if (!TOKEN) {
  throw new Error("SEED_USER_TOKEN is missing from .env");
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${TOKEN}`,
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${path} failed (${response.status})\n` +
        JSON.stringify(data, null, 2),
    );
  }

  return data;
}

async function createCategory(categoryName) {
  await request("/categories", {
    method: "POST",
    body: JSON.stringify({
      categoryName,
    }),
  });
}

async function createInstrument(categoryId, instrumentName) {
  await request("/instruments", {
    method: "POST",
    body: JSON.stringify({
      categoryId,
      instrumentName,
    }),
  });
}

async function createTransaction(transaction) {
  await request("/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

async function main() {
  console.log("Starting test seed...\n");

  // --------------------------------------------------
  // 1. Clear existing test data
  // --------------------------------------------------

  console.log("Clearing existing user data...");

  await request("/test-data", {
    method: "DELETE",
  });

  // --------------------------------------------------
  // 2. Get system categories
  // --------------------------------------------------

  console.log("Getting categories...");

  const categoriesResponse = await request("/categories");
  const categories = categoriesResponse.data;

  const stock = categories.find((category) => category.name === "Stock");

  const metal = categories.find((category) => category.name === "Metal");

  const mutualFund = categories.find(
    (category) => category.name === "Mutual Fund",
  );

  if (!stock || !metal || !mutualFund) {
    throw new Error("System categories are missing");
  }

  // --------------------------------------------------
  // 3. Create custom category
  // --------------------------------------------------

  console.log("Creating Crypto category...");

  await createCategory("Crypto");

  const categoriesAfterCreate = await request("/categories");

  const crypto = categoriesAfterCreate.data.find(
    (category) => category.name === "Crypto",
  );

  // --------------------------------------------------
  // 4. Create instruments
  // --------------------------------------------------

  console.log("Creating instruments...");

  await createInstrument(stock.id, "TMG");
  await createInstrument(stock.id, "COMI");
  await createInstrument(stock.id, "EFIH");

  await createInstrument(metal.id, "Gold");

  await createInstrument(mutualFund.id, "SANABEL");

  await createInstrument(crypto.id, "Bitcoin");

  // --------------------------------------------------
  // 5. Get instruments to get their IDs
  // --------------------------------------------------

  const instrumentsResponse = await request("/instruments?limit=100");

  const instruments = instrumentsResponse.data;

  const TMG = instruments.find((instrument) => instrument.name === "TMG");

  const COMI = instruments.find((instrument) => instrument.name === "COMI");

  const EFIH = instruments.find((instrument) => instrument.name === "EFIH");

  const Gold = instruments.find((instrument) => instrument.name === "Gold");

  const SANABEL = instruments.find(
    (instrument) => instrument.name === "SANABEL",
  );

  const Bitcoin = instruments.find(
    (instrument) => instrument.name === "Bitcoin",
  );

  // --------------------------------------------------
  // 6. TMG transactions
  // --------------------------------------------------

  console.log("Creating TMG transactions...");

  await createTransaction({
    instrumentId: TMG.id,
    action: "Buy",
    transactionDate: "2026-01-10",
    units: 1000,
    price: 55,
  });

  await createTransaction({
    instrumentId: TMG.id,
    action: "Buy",
    transactionDate: "2026-02-15",
    units: 500,
    price: 60,
  });

  await createTransaction({
    instrumentId: TMG.id,
    action: "Dividend Cash",
    transactionDate: "2026-03-10",
    dividendCash: 1500,
  });

  await createTransaction({
    instrumentId: TMG.id,
    action: "Sell",
    transactionDate: "2026-04-20",
    units: 300,
    price: 68,
  });

  // --------------------------------------------------
  // 7. COMI transactions
  // --------------------------------------------------

  console.log("Creating COMI transactions...");

  await createTransaction({
    instrumentId: COMI.id,
    action: "Buy",
    transactionDate: "2026-01-20",
    units: 500,
    price: 82,
  });

  await createTransaction({
    instrumentId: COMI.id,
    action: "Buy",
    transactionDate: "2026-03-05",
    units: 250,
    price: 88,
  });

  await createTransaction({
    instrumentId: COMI.id,
    action: "Sell",
    transactionDate: "2026-06-10",
    units: 200,
    price: 92,
  });

  // --------------------------------------------------
  // 8. EFIH transactions
  // --------------------------------------------------

  console.log("Creating EFIH transactions...");

  await createTransaction({
    instrumentId: EFIH.id,
    action: "Buy",
    transactionDate: "2026-02-01",
    units: 2000,
    price: 20,
  });

  await createTransaction({
    instrumentId: EFIH.id,
    action: "Dividend Shares",
    transactionDate: "2026-04-01",
    dividendSharesRatio: 0.1,
  });

  // --------------------------------------------------
  // 9. Gold transactions
  // --------------------------------------------------

  console.log("Creating Gold transactions...");

  await createTransaction({
    instrumentId: Gold.id,
    action: "Buy",
    transactionDate: "2026-01-05",
    units: 10,
    price: 4200,
  });

  await createTransaction({
    instrumentId: Gold.id,
    action: "Buy",
    transactionDate: "2026-03-15",
    units: 5,
    price: 4600,
  });

  await createTransaction({
    instrumentId: Gold.id,
    action: "Sell",
    transactionDate: "2026-05-20",
    units: 3,
    price: 5000,
  });

  // --------------------------------------------------
  // 10. SANABEL transactions
  // --------------------------------------------------

  console.log("Creating SANABEL transactions...");

  await createTransaction({
    instrumentId: SANABEL.id,
    action: "Buy",
    transactionDate: "2026-02-10",
    units: 3000,
    price: 15,
  });

  await createTransaction({
    instrumentId: SANABEL.id,
    action: "Buy",
    transactionDate: "2026-04-10",
    units: 1000,
    price: 17,
  });

  // --------------------------------------------------
  // 11. Bitcoin transactions
  // --------------------------------------------------

  console.log("Creating Bitcoin transactions...");

  await createTransaction({
    instrumentId: Bitcoin.id,
    action: "Buy",
    transactionDate: "2026-03-01",
    units: 0.25,
    price: 85000,
  });

  await createTransaction({
    instrumentId: Bitcoin.id,
    action: "Buy",
    transactionDate: "2026-05-01",
    units: 0.1,
    price: 92000,
  });

  await createTransaction({
    instrumentId: Bitcoin.id,
    action: "Sell",
    transactionDate: "2026-06-15",
    units: 0.05,
    price: 100000,
  });

  // --------------------------------------------------
  // 12. Get instruments again
  // --------------------------------------------------

  const updatedInstrumentsResponse = await request("/instruments?limit=100");

  const updatedInstruments = updatedInstrumentsResponse.data;

  // --------------------------------------------------
  // 13. Update current prices
  // --------------------------------------------------

  console.log("Updating current prices...");

  await request("/instruments/current-prices", {
    method: "PATCH",
    body: JSON.stringify({
      currentPrices: [
        {
          id: updatedInstruments.find((i) => i.name === "TMG").id,
          currentPrice: 72.5,
        },
        {
          id: updatedInstruments.find((i) => i.name === "COMI").id,
          currentPrice: 95.2,
        },
        {
          id: updatedInstruments.find((i) => i.name === "EFIH").id,
          currentPrice: 24.75,
        },
        {
          id: updatedInstruments.find((i) => i.name === "Gold").id,
          currentPrice: 5250,
        },
        {
          id: updatedInstruments.find((i) => i.name === "SANABEL").id,
          currentPrice: 18.4,
        },
        {
          id: updatedInstruments.find((i) => i.name === "Bitcoin").id,
          currentPrice: 105000,
        },
      ],
    }),
  });

  console.log("\nTest seed completed successfully.");
}

main().catch((error) => {
  console.error("\nTest seed failed:");
  console.error(error.message);
  process.exit(1);
});
