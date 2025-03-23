import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      tableName: 'BooksTable',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const listBooksFn = new NodejsFunction(this, 'ListBooksFunction', {
      entry: path.join(__dirname, '../lambdas/listBooks.ts'), // ✅ 直接引用 .ts 源码
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: booksTable.tableName,
      },
    });

    booksTable.grantReadData(listBooksFn);

    const api = new apigateway.RestApi(this, 'BooksApi', {
      restApiName: 'Books Service',
    });

    const booksResource = api.root.addResource('books');
    booksResource.addMethod('GET', new apigateway.LambdaIntegration(listBooksFn));
  }
}
