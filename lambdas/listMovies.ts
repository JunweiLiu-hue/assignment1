import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.MOVIES_TABLE || "MoviesTable";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const command = new ScanCommand({ TableName: TABLE_NAME });

    const response = await ddbDocClient.send(command);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: response.Items || [] }),
    };
  } catch (error) {
    console.error("Error scanning table:", error);

    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Failed to fetch movies",
        error: (error as Error).message,
      }),
    };
  }
};
