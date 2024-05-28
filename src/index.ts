import { parse } from "valibot";
import { AnsiUp } from "ansi_up";

import { cuResultsSchema } from "./utils/type-schemas";
import { setProcessId, setProcessOwner } from "./utils/storage";

import "./messaging";
import "./processes";
import "./utils/load-lua";

const ansiUp = new AnsiUp();
ansiUp.use_classes = true;

const processUiDiv = document.getElementById("process-ui") as HTMLDivElement;
const consoleDiv = document.getElementById("console-output") as HTMLDivElement;
const loadingDiv = document.getElementById("loading") as HTMLDivElement;
const notFoundForm = document.getElementById("not-found-form") as HTMLFormElement;

let LAST_CURSOR: string | undefined = undefined;

async function readResults(processId: string) {
  // fetching the first page of results
  const getUrl = new URL(`https://cu.ao-testnet.xyz/results/${processId}`);
  if (LAST_CURSOR) {
    getUrl.searchParams.set("from", LAST_CURSOR);
  }
  getUrl.searchParams.set("sort", "DESC");
  getUrl.searchParams.set("limit", LAST_CURSOR ? "1000" : "5");

  try {
    const resultsRes = await fetch(getUrl).then((res) => res.json());
    const results = parse(cuResultsSchema, resultsRes);

    LAST_CURSOR = results.edges[0]?.cursor ?? LAST_CURSOR;
    results.edges.reverse().forEach((edge) => {
      // if (edge.node.)
      if (Array.isArray(edge.node.Output)) {
        // When no Output, Output is an empty array...
        // TODO: Check if Output array can be non empty
        return;
      }
      if (typeof edge.node.Output !== "object" || !edge.node.Output.print) return;

      const outputData = edge.node.Output.data;
      const output = typeof outputData === "string" ? outputData : outputData.output;
      const outputDiv = document.createElement("div");
      outputDiv.innerHTML = ansiUp.ansi_to_html(String(output));
      consoleDiv.appendChild(outputDiv);

      // scroll window to bottom
      window.scrollTo(0, document.body.scrollHeight);
    });
  } catch (e) {
    console.error(e);
  }
}

async function checkProcessId(processId: string | undefined) {
  notFoundForm.onsubmit = (e) => {
    e.preventDefault();
    notFoundForm.classList.add("hidden");

    const processIdInput = document.getElementById("process-id-input") as HTMLInputElement;
    checkProcessId(processIdInput.value);
    return false;
  };

  if (processId) {
    const res = await fetch("https://g8way.io/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "getTransaction",
        query: `query {
          transaction(id: "${processId}") {
            id
            owner {
              address
            }
          }
        }`,
      }),
    }).then((res) => res.json());

    if (res.data.transaction) {
      setProcessId(processId);
      setProcessOwner(res.data.transaction.owner.address);

      // Set the title to the process name
      document.title = `Process ${processId}`;
      const idDiv = document.getElementById("process-id") as HTMLDivElement;
      idDiv.innerText = processId;

      processUiDiv.classList.remove("hidden");
      loadingDiv.classList.add("hidden");

      while (true) {
        await readResults(processId).catch(console.error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  notFoundForm.classList.remove("hidden");
  loadingDiv.classList.add("hidden");
}

async function main() {
  const processId = window.location.pathname.split("/").pop();
  checkProcessId(processId);
}

main().catch(console.error);
