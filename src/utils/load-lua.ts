import { DOMUpdates } from "./dom-updates";
import { sendMessage } from "./message";

const fileInput = document.getElementById("lua-file-input") as HTMLInputElement;

function findRequires(data: string): { name: string; content: string | undefined }[] {
  const requirePattern = /(?<=(require( *)(\n*)(\()?( *)("|'))).*(?=("|'))/g;
  const requiredModules =
    data.match(requirePattern)?.map((mod) => ({
      name: mod,
      content: undefined,
    })) || [];

  return requiredModules;
}

function createExecutableFromProject(project: { name: string; content: string | undefined }[]) {
  const getModFnName = (name: string) => name.replace(/\./g, "_").replace(/^_/, "");
  const contents: { name: string; code: string | undefined }[] = [];

  // filter out repeated modules with different import names
  // and construct the executable Lua code
  for (const mod of project) {
    const existing = contents.find((m) => m.name === mod.name);
    const moduleContent =
      (!existing &&
        `-- module: "${mod.name}"\nlocal function _loaded_mod_${getModFnName(mod.name)}()\n${
          mod.content
        }\nend\n`) ||
      "";
    const requireMapper = `\n_G.package.loaded["${mod.name}"] = _loaded_mod_${getModFnName(
      existing?.name || mod.name
    )}()`;

    contents.push({
      name: mod.name,
      code: moduleContent + requireMapper,
    });
  }

  return contents.reduce((acc, con) => `${acc}\n\n${con.code}`, "");
}

async function createProjectStructure(mainFile: string, files: File[]) {
  const modules = findRequires(mainFile);
  let orderedModNames = modules.map((m) => m.name);

  for (let i = 0; i < modules.length; i += 1) {
    // eslint-disable-next-line no-continue
    const file = files.find((f) => f.name === `${modules[i].name}.lua`);
    if (modules[i].content || !file) continue;

    const content = await file.text();

    modules[i].content = content;
    const requiresInMod = findRequires(content);

    // eslint-disable-next-line @typescript-eslint/no-loop-func
    requiresInMod.forEach((mod) => {
      const existingMod = modules.find((m) => m.name === mod.name);
      if (!existingMod) {
        modules.push(mod);
      }

      const existingName = orderedModNames.find((name) => name === mod.name);
      if (existingName) {
        orderedModNames = orderedModNames.filter((name) => name !== existingName);
      }
      orderedModNames.push(existingName || mod.name);
    });
  }

  // Create an ordered array of modules,
  // we use this loop to reverse the order,
  // because the last modules are the first
  // ones that need to be imported
  // only add modules that were found
  // if the module was not found, we assume it
  // is already loaded into aos
  // eslint-disable-next-line prefer-const
  let orderedModules = [];
  for (let i = orderedModNames.length; i > 0; i -= 1) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    const mod = modules.find((m) => m.name === orderedModNames[i - 1]);
    if (mod && mod.content) {
      orderedModules.push(mod);
    }
  }

  return orderedModules;
}

export async function onLoadCommand() {
  // open file input
  fileInput.click();
}

async function onFileSubmit() {
  const files = fileInput.files;
  if (!files || files.length === 0) return;

  const consoleLoader = document.getElementById("console-input-loader") as HTMLDivElement;
  consoleLoader.classList.remove("hidden");
  DOMUpdates.hidePrompt();

  const mainFile = files[0];
  let mainFileContent = await mainFile.text();

  const project = await createProjectStructure(mainFileContent, Array.from(files).slice(1));
  if (project.length > 0) {
    mainFileContent = `${createExecutableFromProject(project)}\n\n${mainFileContent}`;
  }

  await sendMessage(mainFileContent);

  consoleLoader.classList.add("hidden");
  const loaderMessageDiv = document.getElementById(
    "console-input-loader-message"
  ) as HTMLDivElement;
  loaderMessageDiv.innerText = "[Sending message]";
  DOMUpdates.showPrompt();
}

fileInput.addEventListener("change", onFileSubmit);
