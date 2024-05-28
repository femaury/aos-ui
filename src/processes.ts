import { parse } from "valibot";
import { aoProcessTransactionsQuerySchema } from "./utils/type-schemas";

const processesModal = document.getElementById("processes-modal") as HTMLDivElement;
const processesModalContent = document.getElementById("processes-modal-content") as HTMLDivElement;
const processesList = document.getElementById("processes-list") as HTMLDivElement;
const processesModalClose = document.getElementById("processes-modal-close") as HTMLButtonElement;

const walletAddressButton = document.getElementById("wallet-address") as HTMLButtonElement;

walletAddressButton.onclick = () => {
  processesModal.classList.remove("hidden");
};

processesModalClose.onclick = () => {
  processesModal.classList.add("hidden");
};

processesModal.onclick = (e) => {
  if (e.target === processesModal) {
    processesModalClose.click();
  }
};

async function getProcesses(address: string, after?: string) {
  const res = await fetch("https://g8way.io/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "getProcessSpawns",
      query: `query getProcessSpawns($owners: [String!], $after: String) {
        transactions(owners: $owners, after: $after, tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }]) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner {
                address
              }
              data {
                type
                size
              }
              tags {
                name
                value
              }
            }
          }
        }
      }`,
      variables: {
        owners: [address],
        after,
      },
    }),
  }).then((res) => res.json());

  return parse(aoProcessTransactionsQuerySchema, res).data.transactions;
}

export async function getAllProcesses(address: string) {
  let cursor: string | undefined;

  while (true) {
    try {
      const res = await getProcesses(address, cursor);
      res.edges.forEach((edge) => {
        cursor = edge.cursor;

        const processId = edge.node.id;
        const pidStart = processId.substring(0, 6);
        const pidEnd = processId.substring(processId.length - 6);
        const processName = edge.node.tags.find((tag) => tag.name === "Name")?.value;
        const pidSpan = document.createElement("span");
        pidSpan.innerText = ` (${pidStart}...${pidEnd})`;

        if (edge.node.data.type === "text/html") {
          const link = document.createElement("a");
          link.href = `https://arweave.net/${processId}`;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.innerText = `${processName}`;
          link.appendChild(pidSpan);
          link.classList.add("child");
          processesList.appendChild(link);
        } else {
          const div = document.createElement("div");
          div.innerText = `${processName}`;
          div.appendChild(pidSpan);
          div.classList.add("child");
          div.title = "This process is not a text/html process.";
          processesList.appendChild(div);
        }
      });

      if (!res.pageInfo.hasNextPage) {
        break;
      }
    } catch (e) {
      console.error(e);
      break;
    }
  }
}
