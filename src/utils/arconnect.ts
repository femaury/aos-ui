type Permissions =
  | "ACCESS_ADDRESS"
  | "ACCESS_PUBLIC_KEY"
  | "ACCESS_ALL_ADDRESSES"
  | "SIGN_TRANSACTION"
  | "DISPATCH"
  | "ENCRYPT"
  | "DECRYPT"
  | "SIGNATURE"
  | "ACCESS_ARWEAVE_CONFIG";

export interface ConnectProps {
  permissions: Permissions[];
  appInfo?: {
    name?: string;
    logo?: string;
  };
  gateway?: {
    host: string;
    port: number;
    protocol: "http" | "https";
  };
}

/***
 * connect to arconnect wallet
 * @params ConnectProps
 */
export async function connect(params: ConnectProps) {
  return await window.arweaveWallet.connect(
    [...params.permissions],
    params.appInfo,
    params.gateway
  );
}

/***
 * disconnect arconnect wallet
 */
export async function disconnect() {
  return await window.arweaveWallet.disconnect();
}

/***
 * connect to arconnect wallet
 * @returns string
 */
export async function getActiveAddress() {
  return await window.arweaveWallet.getActiveAddress();
}

/***
 * get permissions current wallet
 */
export async function getPermissions() {
  return await window.arweaveWallet.getPermissions();
}

/***
 * get wallet names
 */
export async function getWalletNames() {
  return await window.arweaveWallet.getWalletNames();
}

/***
 * get all wallet addresses
 * @returns string[]
 */
export async function getAllAddresses() {
  return await window.arweaveWallet.getAllAddresses();
}

/***
 * get active public key
 * @returns string
 */
export async function getActivePublicKey() {
  return await window.arweaveWallet.getActivePublicKey();
}

/***
 * returns true once wallet is installed
 * @returns Promise<true>
 */
export async function afterInstall(): Promise<true> {
  if (window.arweaveWallet) {
    return true;
  } else {
    return new Promise((resolve) => {
      window.addEventListener("arweaveWalletLoaded", () => {
        resolve(!!window.arweaveWallet);
      });
    });
  }
}
