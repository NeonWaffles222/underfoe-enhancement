const { db } = require('@vercel/postgres');

async function seedItems(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        main_category VARCHAR(255) NOT NULL,
        sub_category VARCHAR(255) NOT NULL
      );
    `;

    console.log(`Created "items" table`);

    const subCategories = [1, 2, 3, 4];
    let items = [];

    for (let subCategory of subCategories) {
      await fetch(`https://dev.api.arsha.io/v2/na/category?mainCategory=20&subCategory=${subCategory}&lang=en`, { method: 'GET' })
        .then(res => res.text())
        .then(result => JSON.parse(result))
        .then(data => {
          for (let item of data) {
            items.push(item);
          }
        })
        .catch(err => {
          console.error("An error occurred while attempting to fetch item data:", err);
        });
    }

    console.log("Fetched item data from api");

    const insertedItems = await Promise.all(
      items.map(async (item) => {
        return client.sql`
        INSERT INTO items (id, name, main_category, sub_category)
        VALUES (${item.id}, ${item.name}, ${item.mainCategory}, ${item.subCategory})
        ON CONFLICT (id) DO NOTHING;
        `;
      })
    );
    console.log(`Seeded ${insertedItems.length} items`);
    console.log(items);

    return {
      createTable,
      items: insertedItems
    };

  } catch (error) {
    console.error('Error seeding items:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await seedItems(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});