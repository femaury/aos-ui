import {
  object,
  array,
  string,
  number,
  boolean,
  unknown,
  optional,
  union,
  BaseSchema,
  nullable,
} from "valibot";

export const resultSchema = object({
  Error: optional(string()),
  Output: union([
    array(unknown()),
    string(),
    object({
      data: union([
        string(),
        object({
          json: optional(string()),
          output: optional(union([string(), number()])),
          print: optional(boolean()),
          prompt: optional(string()),
        }),
      ]),
      prompt: optional(string()),
      print: optional(boolean()),
    }),
  ]),
  Messages: array(
    object({
      Tags: array(
        object({
          value: string(),
          name: string(),
        })
      ),
      Target: string(),
      Anchor: string(),
    })
  ),
  Spawns: array(unknown()),
});

export const cuResultsSchema = object({
  edges: array(
    object({
      cursor: string(),
      node: resultSchema,
    })
  ),
});

export const arweaveTagsSchema = object({
  name: string(),
  value: string(),
});

export const arweaveTransactionSchema = object({
  id: string(),
  owner: object({
    address: string(),
  }),
  recipient: string(),
  anchor: string(),
  tags: array(arweaveTagsSchema),
  block: object({
    height: number(),
    timestamp: number(),
  }),
});

function makeArweaveTxPaginationSchema<T extends BaseSchema>(schema: T) {
  return object({
    data: object({
      transactions: object({
        pageInfo: object({
          hasNextPage: boolean(),
        }),
        edges: array(
          object({
            cursor: string(),
            node: schema,
          })
        ),
      }),
    }),
  });
}

export const aoProcessTransactionsQuerySchema = makeArweaveTxPaginationSchema(
  object({
    id: string(),
    owner: object({
      address: string(),
    }),
    tags: array(arweaveTagsSchema),
    data: object({
      type: nullable(string()),
      size: string(),
    }),
  })
);

export const arweaveTransactionsQuerySchema =
  makeArweaveTxPaginationSchema(arweaveTransactionSchema);
