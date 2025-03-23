const apiResponses = {
    _200: (body: { [key: string]: any }) => ({
      statusCode: 200,
      body: JSON.stringify(body, null, 2),
    }),
    _400: (body: { [key: string]: any }) => ({
      statusCode: 400,
      body: JSON.stringify(body, null, 2),
    }),
  };
  
  export default apiResponses;
  