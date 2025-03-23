import { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const query = event.queryStringParameters || {}

    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    })

    const response = await client.send(command)
    let books = response.Items?.map(item => unmarshall(item)) ?? []

    if (query.author) {
      books = books.filter(book =>
        book.authors?.some((a: string) => a.toLowerCase().includes(query.author!.toLowerCase()))
      )
    }

    if (query.title) {
      books = books.filter(book =>
        book.title?.toLowerCase().includes(query.title!.toLowerCase())
      )
    }

    if (query.genre) {
      books = books.filter(book =>
        book.genre?.toLowerCase().includes(query.genre!.toLowerCase())
      )
    }

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
