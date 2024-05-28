const walletLoader = document.getElementById("wallet-loader") as HTMLDivElement;
const walletAddressButton = document.getElementById("wallet-address") as HTMLButtonElement;
const walletConnectButton = document.getElementById("wallet-connect-button") as HTMLButtonElement;

const consolePrompt = document.getElementById("console-input-form") as HTMLDivElement;

export const DOMUpdates = {
  showWallet(walletAddress: string) {
    walletAddressButton.innerText = walletAddress;
    walletAddressButton.classList.remove("hidden");
    walletConnectButton.classList.add("hidden");
    walletLoader.classList.add("hidden");
  },
  showLoader() {
    walletLoader.classList.remove("hidden");
    walletAddressButton.classList.add("hidden");
    walletConnectButton.classList.add("hidden");
  },
  showButton() {
    walletConnectButton.classList.remove("hidden");
    walletLoader.classList.add("hidden");
    walletAddressButton.classList.add("hidden");
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
