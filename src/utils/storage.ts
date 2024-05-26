export function setProcessId(id: string) {
  sessionStorage.setItem("ao-process-id", id);
}

export function getProcessId() {
  return sessionStorage.getItem("ao-process-id");
}

export function setProcessOwner(owner: string) {
  sessionStorage.setItem("ao-process-owner", owner);
}

export function getProcessOwner() {
  return sessionStorage.getItem("ao-process-owner");
}
