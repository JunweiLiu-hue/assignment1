import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { Translate } from '@aws-sdk/client-translate';
import apiResponses from './common/apiResponses';

const ddb = new DynamoDBClient({});
const translate = new Translate({ region: 'eu-west-1' });

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, sortKey } = event.pathParameters!; // 解析路径参数
  const language = event.queryStringParameters?.language || 'fr'; // 默认翻译成法语

  const params = {
    TableName: process.env.TABLE_NAME!, // 从环境变量中获取 DynamoDB 表名
    Key: {
      id: { S: id || "" },
      sortKey: { S: sortKey || "" },
    },
  };

  try {
    // 1. Check if the translation already exists in the DynamoDB table
    console.log('Checking if cached translation exists...');
    const cachedTranslation = await ddb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        id: { S: id || "" },
        sortKey: { S: sortKey || "" },
      },
    }));

    // If cached translation is found, return it
    if (cachedTranslation.Item && cachedTranslation.Item[`translatedSummary_${language}`]) {
      const translatedSummary = cachedTranslation.Item[`translatedSummary_${language}`].S;
      console.log('Found cached translation:', translatedSummary);
      return apiResponses._200({ translatedSummary });
    }

    // 2. If no cached translation, fetch the original summary
    console.log('Fetching original summary from DynamoDB...');
    const data = await ddb.send(new GetItemCommand(params));
    if (!data.Item || !data.Item.summary) {
      console.log('Summary not found for the book:', { id, sortKey });
      return apiResponses._400({ message: 'Missing summary for the book' });
    }

    const summaryText = data.Item.summary.S;

    // 3. Translate the summary using Amazon Translate
    console.log('Translating summary...');
    const translateParams = {
      Text: summaryText,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
    };
    const translation = await translate.translateText(translateParams);

    // 4. Save the translated text in DynamoDB (cache the translation)
    console.log('Saving translated text to DynamoDB...');
    const updateParams = {
      TableName: process.env.TABLE_NAME!,
      Key: {
        id: { S: id || "" },
        sortKey: { S: sortKey || "" },
      },
      UpdateExpression: `SET translatedSummary_${language} = :translatedSummary`,
      ExpressionAttributeValues: {
        ':translatedSummary': { S: translation.TranslatedText || '' },
      },
    };

    await ddb.send(new UpdateItemCommand(updateParams));

    // Return the translated summary
    console.log('Returning translated summary:', translation.TranslatedText);
    return apiResponses._200({ translatedSummary: translation.TranslatedText });

  } catch (error) {
    console.log('Error getting item or translating:', error);
    return apiResponses._400({ message: 'Unable to get or translate the book data' });
  }
};
