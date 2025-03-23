import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')

    if (!body.id || !body.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: id, title' }),
      }
    }

    const command = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: marshall(body),
    })

    await client.send(command)

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Book created' }),
    }
  } catch (err) {
    console.error('Create book error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}
