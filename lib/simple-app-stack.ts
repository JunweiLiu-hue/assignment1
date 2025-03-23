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

    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortKey', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

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

    const api = new apigateway.RestApi(this, 'BooksApi', {
      restApiName: 'Books Service',
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER, 
    });

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

    const translateFn = new NodejsFunction(this, 'TranslateFunction', {
      entry: path.join(__dirname, '../lambdas/translate.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {},
    });
    
    translateFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['translate:*'],
        resources: ['*'],
      })
    );
    
    const translateResource = api.root.addResource('translate');
    translateResource.addMethod('POST', new apigateway.LambdaIntegration(translateFn));
    
  }
  
}
