import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Lambda functions
    const listBooksFn = new NodejsFunction(this, 'ListBooksFunction', {
      entry: path.join(__dirname, '../lambdas/listBooks.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });
    booksTable.grantReadData(listBooksFn);

    const createBookFn = new NodejsFunction(this, 'CreateBookFunction', {
      entry: path.join(__dirname, '../lambdas/createBook.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });
    booksTable.grantWriteData(createBookFn);

    const getBookFn = new NodejsFunction(this, 'GetBookByIdFunction', {
      entry: path.join(__dirname, '../lambdas/getBookById.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });
    booksTable.grantReadData(getBookFn);

    // API Gateway setup
    const api = new apigateway.RestApi(this, 'BooksApi', {
      restApiName: 'Books Service',
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    const apiKey = api.addApiKey('BooksApiKey');
    const usagePlan = api.addUsagePlan('BooksUsagePlan', {
      name: 'BooksUsagePlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Books API resources and methods
    const booksResource = api.root.addResource('books');
    booksResource.addMethod('GET', new apigateway.LambdaIntegration(listBooksFn));
    booksResource.addMethod('POST', new apigateway.LambdaIntegration(createBookFn), {
      apiKeyRequired: true,
    });

    const bookByIdResource = booksResource.addResource('{id}');
    bookByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getBookFn));

    const updateBookFn = new NodejsFunction(this, 'UpdateBookFunction', {
      entry: path.join(__dirname, '../lambdas/updateBook.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });
    booksTable.grantWriteData(updateBookFn);
    bookByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateBookFn), {
      apiKeyRequired: true,
    });

    // Translation Lambda function
    const translateFn = new NodejsFunction(this, 'TranslateFunction', {
      entry: path.join(__dirname, '../lambdas/translate.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });

    translateFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
        resources: [booksTable.tableArn],
      })
    );

    translateFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['translate:TranslateText'],
        resources: ['*'],
      })
    );

    // Translation API resource with the correct path
    const thingsResource = api.root.addResource('things');
    const thingById = thingsResource.addResource('{id}');
    const bookByIdAndSort = thingById.addResource('{sortKey}');
    const translationResource = bookByIdAndSort.addResource('translation');

    translationResource.addMethod('GET', new apigateway.LambdaIntegration(translateFn));
  }
}
