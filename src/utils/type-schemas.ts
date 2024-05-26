import { object, array, string, number, boolean, unknown, optional, union } from "valibot";

export const resultSchema = object({
  Output: union([
    array(unknown()),
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

export const arweaveTransactionsQuerySchema = object({
  data: object({
    transactions: object({
      pageInfo: object({
        hasNextPage: boolean(),
      }),
      edges: array(
        object({
          cursor: string(),
          node: arweaveTransactionSchema,
        })
      ),
    }),
  }),
});
