import { parse, Output } from "valibot";
import { AnsiUp } from "ansi_up";

import { getActiveAddress, connect, afterInstall } from "./utils/arconnect";
import { createDataItemSigner } from "./utils/signer";
import { resultSchema } from "./utils/type-schemas";
import { getProcessId, getProcessOwner } from "./utils/storage";

const ansiUp = new AnsiUp();

const walletLoader = document.getElementById("wallet-loader") as HTMLDivElement;
const walletDiv = document.getElementById("wallet-address") as HTMLDivElement;
const walletButton = document.getElementById("wallet-connect-button") as HTMLButtonElement;

const consoleOutput = document.getElementById("console-output") as HTMLDivElement;
const consolePrompt = document.getElementById("console-input-form") as HTMLDivElement;

const DOMUpdates = {
  showWallet(walletAddress: string) {
    walletDiv.innerText = walletAddress;
    walletDiv.classList.remove("hidden");
    walletButton.classList.add("hidden");
    walletLoader.classList.add("hidden");
  },
  showLoader() {
    walletLoader.classList.remove("hidden");
    walletDiv.classList.add("hidden");
    walletButton.classList.add("hidden");
  },
  showButton() {
    walletButton.classList.remove("hidden");
    walletLoader.classList.add("hidden");
    walletDiv.classList.add("hidden");
  },
  showPrompt() {
    consolePrompt.classList.remove("hidden");
    const consoleInput = document.getElementById("console-input") as HTMLInputElement;
    consoleInput.focus();
  },
  hidePrompt() {
    consolePrompt.classList.add("hidden");
  },
};

async function checkAuth() {
  // Wait 2 seconds before checking auth for arconnect to load
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (!window.arweaveWallet) {
    DOMUpdates.showButton();
    afterInstall().then(checkAuth);
    return;
  }

  try {
    const activeAddress = await getActiveAddress();
    if (activeAddress) {
      // User is authenticated
      const truncatedAddress = `${activeAddress.slice(0, 5)}...${activeAddress.slice(-5)}`;
      DOMUpdates.showWallet(truncatedAddress);

      const processOwner = getProcessOwner();
      if (activeAddress === processOwner) {
        DOMUpdates.showPrompt();
      }
    } else {
      // User is not authenticated
      DOMUpdates.showButton();
    }
  } catch (error) {
    console.error(error);
    DOMUpdates.showButton();
  }
}

async function onConnectButtonClick() {
  try {
    if (!window.arweaveWallet) {
      window.open("https://arconnect.io/", "_blank");
      return;
    }
    DOMUpdates.showLoader();
    await connect({
      permissions: ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
    });
    checkAuth();
  } catch (error) {
    console.error(error);
  }
}

async function readResult(messageId: string, processId: string) {
  const res = await fetch(
    `https://cu.ao-testnet.xyz/result/${messageId}?process-id=${processId}`
  ).then((res) => res.json());
  return parse(resultSchema, res);
}

async function sendMessage(message: string) {
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

      const outputData = result.Output.data;
      const output = typeof outputData === "string" ? outputData : outputData.output;
      const outputDiv = document.createElement("div");

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

async function onPromptSubmit(e: Event) {
  e.preventDefault();
  const consoleInput = document.getElementById("console-input") as HTMLInputElement;
  const input = consoleInput.value;
  consoleInput.value = "";

  const output = document.createElement("div");
  output.innerText = `aos> ${input}`;
  consoleOutput.appendChild(output);

  window.scrollTo(0, document.body.scrollHeight);
  const consoleLoader = document.getElementById("console-input-loader") as HTMLDivElement;
  consoleLoader.classList.remove("hidden");
  DOMUpdates.hidePrompt();

  if (input) await sendMessage(input);

  consoleLoader.classList.add("hidden");
  const loaderMessageDiv = document.getElementById(
    "console-input-loader-message"
  ) as HTMLDivElement;
  loaderMessageDiv.innerText = "[Sending message]";
  DOMUpdates.showPrompt();
  consoleInput.focus();
}

walletButton.onclick = onConnectButtonClick;
consolePrompt.onsubmit = onPromptSubmit;

checkAuth();
