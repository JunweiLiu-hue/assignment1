import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { books } from "../book/seed/books";

const client = new DynamoDBClient({ region: "eu-west-1" }); 
const TABLE_NAME = "SimpleAppStack-BooksTable9DF4AE31-16EGEA80O9AC1";

async function seedBooks() {
  for (const book of books) {
    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(book),
    });

    try {
      await client.send(command);
      console.log(`✅ Inserted: ${book.title}`);
    } catch (err) {
      console.error(`❌ Failed to insert: ${book.title}`, err);
    }
  }
}

seedBooks();
