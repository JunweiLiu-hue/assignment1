import { marshall } from "@aws-sdk/util-dynamodb";
import { Book } from "./types";

export const generateItem = (entity: Book) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Book[]) => {
  return data.map((e) => generateItem(e));
};
