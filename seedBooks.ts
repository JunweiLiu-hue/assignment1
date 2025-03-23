import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { books } from "../book/seed/books";

const client = new DynamoDBClient({ region: "eu-west-1" }); // 替换为你部署的 region
const TABLE_NAME = "BooksTable";

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
