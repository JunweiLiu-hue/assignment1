import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');

    if (!id || !body.sortKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing id or sortKey' }),
      };
    }

    const updateExpr = 'SET ' +
      Object.keys(body)
        .filter(k => k !== 'id' && k !== 'sortKey')
        .map((k, i) => `#key${i} = :val${i}`)
        .join(', ');

    const exprAttrNames = Object.keys(body)
      .filter(k => k !== 'id' && k !== 'sortKey')
      .reduce((acc, k, i) => ({ ...acc, [`#key${i}`]: k }), {});

    const exprAttrValues = Object.keys(body)
      .filter(k => k !== 'id' && k !== 'sortKey')
      .reduce((acc, k, i) => ({ ...acc, [`:val${i}`]: marshall({ temp: body[k] }).temp }), {});

    const command = new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({ id, sortKey: body.sortKey }),
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Book updated successfully' }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
};
