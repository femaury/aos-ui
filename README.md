# ao-ui

To install dependencies:

```bash
bun install
```

To build JS file:

```bash
bun build ./src/index.ts --outdir ./src/dist
```

You need to serve the `index.html` file from a server to be able to use arconnect.
You can use [live-server](https://www.npmjs.com/package/live-server) for that when developing.

I upload the JS file to arweave separately and update the URL in the `index.html` file.
The HTML file is then added as the data when spawning a process.
