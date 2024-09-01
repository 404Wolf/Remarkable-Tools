import { MarkdownView, Notice, Plugin } from "obsidian";
import { exec } from "child_process";
import { tmpdir } from "os";
import * as path from "path";
import * as fs from "fs/promises";
import SettingsTab, {
  DEFAULT_SETTINGS,
  type MyPluginSettings,
} from "./settings";
import callReSnap, { getCurrentNotePath } from "./resnap/index.ts";

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings = DEFAULT_SETTINGS;

  onload = async () => {
    await this.loadSettings();
    const plugin = this;

    this.addCommand({
      id: "insert-remarkable-drawing-cropped",
      name: "Insert a cropped snapshot from the reMarkable (PNG)",
      callback: () => {
        plugin.tryInsertingSnapshot(true);
      },
    });

    this.addCommand({
      id: "insert-remarkable-drawing-no-crop",
      name: "Insert an uncropped snapshot from the reMarkable (PNG)",
      callback: () => {
        plugin.tryInsertingSnapshot(false);
      },
    });

    this.addCommand({
      id: "insert-remarkable-notebook-pdf",
      name: "Insert the most recently viewed notebook (PDF)",
      callback: () => {
        plugin.tryInsertingPDF();
      },
    });

    this.addSettingTab(new SettingsTab(this.app, this));
  };

  loadSettings = async () => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async () => {
    await this.saveData(this.settings);
  };

  insertTextAtCursor = (text: string) => {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(text, cursor);
    } else {
      new Notice("No active Markdown view found!");
    }
  };

  getResourceRoot = async () => {
    // Get the vault's root path
    const resourceRoot = this.app.vault.getFolderByPath(
      this.settings.outputPath,
    );
    if (resourceRoot === null)
      throw new Error("Could not find the resource root!");
    console.log("Resource root:", resourceRoot);
    return resourceRoot.path;
  };

  tryInsertingPDF = async () => {
    new Notice("Inserting rM pdf...", 1000);

    exec(
      `${this.settings.reSnapPath} -k ${this.settings.rmSshKeyAddress} -r`,
      async (error, stdout, stderr) => {
        const uuid = stdout.trim();
        console.log("UUID: ", uuid);
        const pdfDownloadUrl = `http://10.11.99.1/download/${uuid}/placeholder`;
        console.log("PDF Download URL: ", pdfDownloadUrl);
        const outputPath = path.join(
          //@ts-ignore
          this.app.vault.adapter.basePath,
          await this.getResourceRoot(),
          `${uuid}.pdf`,
        );
        const notePath = await getCurrentNotePath(
          uuid,
          this.settings.rmAddress,
          this.settings.rmSshKeyAddress,
        );
        console.log("Output path: ", outputPath);
        exec(
          `curl -o "${outputPath}" "${pdfDownloadUrl}"`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            let pdfMarkdown = `![[${uuid}.pdf]]\n\`@${notePath}\``;
            if (this.settings.imageTag != "")
              pdfMarkdown += ` #${this.settings.imageTag}`;
            this.insertTextAtCursor(pdfMarkdown);
          },
        );
      },
    );
  };

  tryInsertingSnapshot = async (crop: boolean): Promise<void> => {
    new Notice("Inserting rM snapshot...", 1000);

    try {
      const fileName = `${crypto.randomUUID()}.png`;
      const outputFilePath = path.join(tmpdir(), fileName);
      const { noteMetadata, notePath } = await callReSnap({
        rmAddress: this.settings.rmAddress,
        reSnapPath: this.settings.reSnapPath,
        reSnapSshkey: this.settings.rmSshKeyAddress,
        reSnapExtraArgs: this.settings.reSnapExtraArgs,
        outputPath: outputFilePath,
        postProcess: this.settings.postprocessor,
        postProcessExtraArgs: crop ? ["--crop"] : [],
      });

      const resourceRoot = await this.getResourceRoot();

      // Copy the image to the vault if it's not already there
      const vaultImagePath = path.join(resourceRoot, fileName);
      console.log("Copying drawing to vault:", vaultImagePath);
      //@ts-ignore
      const vaultBasePath = await this.app.vault.adapter.basePath;
      console.log(vaultBasePath);
      const vaultResourceDumpPath = path.join(vaultBasePath, vaultImagePath);
      await fs.copyFile(outputFilePath, vaultResourceDumpPath);

      fs.unlink(outputFilePath)
        .then(() => console.log("Deleted temporary file:", outputFilePath))
        .catch((error) =>
          console.error("Could not delete temporary file:", error),
        );

      // Create the markdown for the image
      let imageMarkdown =
        `![[${fileName}]]\n` +
        `\`Page ${noteMetadata.lastOpenedPage + 1} @ "${notePath}"\``;
      if (this.settings.imageTag != "")
        imageMarkdown += ` #${this.settings.imageTag}`;

      // Insert the image into the document
      this.insertTextAtCursor(imageMarkdown);
    } catch (error) {
      new Notice(
        "Could not insert your rM drawing! Is your tablet connected " +
          "and reachable at the configured address?",
      );
      throw error;
    }
  };
}
