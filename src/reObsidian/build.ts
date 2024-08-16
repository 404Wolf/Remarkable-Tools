import { build } from "esbuild";

build({
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  outfile: "dist/main.js",
  sourcemap: true,
  external: ["obsidian"],
  logLevel: "info",
  platform: "node",
})
  .then(async () => {
    const file = Bun.file("manifest.json");
    await Bun.write("./dist/manifest.json", file);
  })
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
