import { getAllProcesses } from "./processes";
import { getActiveAddress, connect, afterInstall } from "./utils/arconnect";
import { DOMUpdates } from "./utils/dom-updates";
import { sendMessage } from "./utils/message";
import { getProcessOwner } from "./utils/storage";

const walletButton = document.getElementById("wallet-connect-button") as HTMLButtonElement;

const consoleOutput = document.getElementById("console-output") as HTMLDivElement;
const consolePrompt = document.getElementById("console-input-form") as HTMLDivElement;

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

      getAllProcesses(activeAddress);
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

async function onPromptSubmit(e: Event) {
  e.preventDefault();
  const consoleInput = document.getElementById("console-input") as HTMLInputElement;
  const input = consoleInput.value;
  consoleInput.value = "";

  if (input === ".load") {
    const fileInput = document.getElementById("lua-file-input") as HTMLInputElement;
    fileInput.click();
    return;
  }

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
