import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const id = event.pathParameters?.id
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing id' }),
    }
  }

  try {
    const command = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id: { S: id },
        sortKey: { S: 'BOOK' },
      },
    })

    const response = await client.send(command)
    const item = response.Item ? unmarshall(response.Item) : null

    return {
      statusCode: item ? 200 : 404,
      body: JSON.stringify(item || { message: 'Book not found' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  } catch (err) {
    console.error('Get book error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}
