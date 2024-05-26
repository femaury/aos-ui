const walletLoader = document.getElementById("wallet-loader") as HTMLDivElement;
const walletDiv = document.getElementById("wallet-address") as HTMLDivElement;
const walletButton = document.getElementById("wallet-connect-button") as HTMLButtonElement;

const consolePrompt = document.getElementById("console-input-form") as HTMLDivElement;

export const DOMUpdates = {
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
