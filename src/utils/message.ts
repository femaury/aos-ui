import { parse } from "valibot";
import { AnsiUp } from "ansi_up";

import { resultSchema } from "./type-schemas";
import { getProcessId } from "./storage";
import { createDataItemSigner } from "./signer";

const ansiUp = new AnsiUp();
const consoleOutput = document.getElementById("console-output") as HTMLDivElement;

async function readResult(messageId: string, processId: string) {
  const res = await fetch(
    `https://cu.ao-testnet.xyz/result/${messageId}?process-id=${processId}`
  ).then((res) => res.json());
  return parse(resultSchema, res);
}

export async function sendMessage(message: string) {
  try {
    const processId = getProcessId();
    if (!processId) throw new Error("No process id found");

    const signer = createDataItemSigner(window.arweaveWallet);
    const signedDataItem = await signer({
      // Random number between 1000 and 9999
      data: message,
      tags: [
        { name: "Data-Protocol", value: "ao" },
        { name: "Variant", value: "ao.TN.1" },
        { name: "Type", value: "Message" },
        { name: "SDK", value: "aoconnect" },
        { name: "Action", value: "Eval" },
      ],
      target: processId,
    });

    const res = await fetch("https://mu.ao-testnet.xyz/", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
      },
      redirect: "follow",
      body: signedDataItem.raw,
    });
    if (res.ok) {
      const loaderMessageDiv = document.getElementById(
        "console-input-loader-message"
      ) as HTMLDivElement;
      loaderMessageDiv.innerText = `[Computing ${signedDataItem.id}]`;

      const result = await readResult(signedDataItem.id, processId);
      if (Array.isArray(result.Output)) {
        // When no Output, Output is an empty array...
        // TODO: Check if Output array can be non empty
        return;
      }

      const outputData =
        result.Error ?? (typeof result.Output === "object" ? result.Output.data : undefined);
      const output = typeof outputData === "string" ? outputData : outputData?.output;
      const outputDiv = document.createElement("div");
      if (result.Error) {
        outputDiv.classList.add("ansi-red-fg");
      }
      outputDiv.innerHTML = ansiUp.ansi_to_html(String(output));
      consoleOutput.appendChild(outputDiv);

      // scroll window to bottom
      window.scrollTo(0, document.body.scrollHeight);
    } else {
      throw new Error("Error sending message");
    }
  } catch (e) {
    console.error(e);
    const output = document.createElement("div");
    output.classList.add("ansi-red-fg");
    output.innerText = "error sending message";
    consoleOutput.appendChild(output);
  }
}
