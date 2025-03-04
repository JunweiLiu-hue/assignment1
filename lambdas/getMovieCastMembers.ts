import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const queryParams = event.queryStringParameters;

    if (!queryParams) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing query parameters" }),
      };
    }

    if (!queryParams.movieId) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing movie Id parameter" }),
      };
    }

    const movieId = parseInt(queryParams.movieId);
    const includeFacts = queryParams.facts === "true";

    let commandInput: QueryCommandInput = {
      TableName: process.env.CAST_TABLE_NAME,
    };

    if ("roleName" in queryParams) {
      commandInput = {
        ...commandInput,
        IndexName: "roleIx",
        KeyConditionExpression: "movieId = :m and begins_with(roleName, :r)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.roleName,
        },
      };
    } else if ("actorName" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and begins_with(actorName, :a)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":a": queryParams.actorName,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    // 如果facts=true，查询Movies表获取电影信息
    let movieDetails = null;
    if (includeFacts) {
      const movieTableName = process.env.MOVIES_TABLE_NAME || "Movies"; // 确保在CDK里加环境变量
      const movieCommand = new GetCommand({
        TableName: movieTableName,
        Key: { id: movieId },
      });

      const movieResponse = await ddbDocClient.send(movieCommand);
      movieDetails = movieResponse.Item || null;
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: commandOutput.Items,
        movie: movieDetails,  // 如果facts=true才会有内容，否则是null
      }),
    };

  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};

function createDocumentClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
