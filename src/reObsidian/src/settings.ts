import { type App, PluginSettingTab, Setting } from "obsidian";
import type MyPlugin from "./plugin";

export interface MyPluginSettings {
  reSnapPath: string;
  reSnapExtraArgs: string[];
  invertRemarkableImages: boolean;
  outputPath: string;
  rmAddress: string;
  rmSshKeyAddress: string;
  postprocessor: string;
  imageTag: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
  reSnapPath: "reSnap",
  reSnapExtraArgs: ["-c"],
  invertRemarkableImages: false,
  outputPath: "Remarkable",
  rmAddress: "10.11.99.1",
  rmSshKeyAddress: "~/.ssh/remarkable",
  postprocessor: "",
  imageTag: "remarkable",
};

export default class SettingsTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display = (): void => {
    let { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian & reMarkable" });

    new Setting(containerEl)
      .setName("reMarkable IP")
      .setDesc(
        "The IP address of your reMarkable. Use 10.11.99.1 and connect via cable if unsure.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Example: 10.11.99.1")
          .setValue(this.plugin.settings.rmAddress)
          .onChange(async (value) => {
            this.plugin.settings.rmAddress = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("SSH key")
      .setDesc("The private ssh key for authing into the remarkable")
      .addText((text) =>
        text
          .setPlaceholder("/home/name/.ssh/something")
          .setValue(this.plugin.settings.rmSshKeyAddress),
      );

    new Setting(containerEl)
      .setName("reSnap executable")
      .setDesc("The path to the reSnap executable if it's not in $PATH")
      .addText((text) =>
        text
          .setPlaceholder("reSnap path if not in $PATH")
          .setValue(this.plugin.settings.reSnapPath)
          .onChange(async (value) => {
            this.plugin.settings.reSnapPath = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("reSnap extra arguments")
      .setDesc("Extra arguments to pass to reSnap")
      .addText((text) =>
        text
          .setPlaceholder("Extra arguments")
          .setValue(this.plugin.settings.reSnapExtraArgs.join(" "))
          .onChange(async (value) => {
            this.plugin.settings.reSnapExtraArgs = value.split(" ");
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("The folder where rM drawing images should be stored")
      .addText((text) =>
        text
          .setPlaceholder("Folder in vault")
          .setValue(this.plugin.settings.outputPath),
      );

    new Setting(containerEl)
      .setName("Postprocessing executable")
      .setDesc(
        "The absolute path to an executable that post-processes the captured image. " +
          "The script will be passed the filename and should overwrite the file with a modified version.",
      )
      .addText((text) =>
        text
          .setPlaceholder("Path or executable name")
          .setValue(this.plugin.settings.postprocessor)
          .onChange(async (value) => {
            this.plugin.settings.postprocessor = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Image tag")
      .setDesc("The tag to use for images inserted from the reMarkable. ")
      .addText((text) =>
        text
          .setPlaceholder("remarkable")
          .setValue(this.plugin.settings.imageTag)
          .onChange(async (value) => {
            this.plugin.settings.imageTag = value;
            await this.plugin.saveSettings();
          }),
      );
  };
}
