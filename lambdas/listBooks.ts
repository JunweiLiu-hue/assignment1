import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    })

    const response = await client.send(command)
    const books = response.Items?.map(item => unmarshall(item)) ?? []

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(books),
    }
  } catch (err) {
    console.error('Lambda Error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    }
  }
}
