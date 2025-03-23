## Serverless REST Assignment - Distributed Systems.

__Name:__ Junwei Liu

__Demo:__ https://youtu.be/qQO_aGBwVc4

### Context.

Context: Book Management System

Table item attributes:

BookID - string (Partition key)

Genre - string (Sort key)

Title - string

Author - string

Summary - string

PublishedYear - number

Rating - number

Translations - map (key: language, value: translated summary)

### App API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API) you have successfully implemented. ]
e.g.
 
POST /books - Add a new book to the system.

GET /books/{bookID}/{genre} - Get details of a specific book by its bookID and genre.

GET /books/{bookID}/{genre}/translation - Get the translated summary of the book in a specified language (returns cached translation if available).

GET /books/{bookID}/{genre}/translation?language=fr - Get the translated summary of the book in French.

PUT /books/{bookID}/{genre} - Update book details (e.g., summary, rating).

GET /books - Get a list of all books in the system.


### Features.

#### Translation persistence (if completed)

Translation persistence
The translation persistence feature caches the translations of book summaries in DynamoDB. When a user requests a translation for a book, the system checks DynamoDB first for a cached version. If the translation exists, it returns the cached result; if not, it fetches the translation from Amazon Translate and stores the result in the table for future use.

Table item attributes include:

BookID - string (Partition key)

Genre - string (Sort Key)

Title - string

Author - string

Summary - string

PublishedYear - number

Rating - number

Translations - map (key: language, value: translated summary)

#### Custom L2 Construct (if completed)
Construct Input props object:

type BooksApiProps = {
  apiKey: string;
  tableName: string;
}


#### API Keys. (if completed)

To secure access to certain API endpoints, API key authentication is used. The API Gateway enforces the requirement for an API key on specific routes like POST /books and PUT /books.

Implementation of API Key authentication:

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

const booksResource = api.root.addResource('books');
booksResource.addMethod('POST', new apigateway.LambdaIntegration(createBookFn), {
  apiKeyRequired: true,
});

###  Extra (If relevant).

[ State any other aspects of your solution that use CDK/serverless features not covered in the lectures ]


