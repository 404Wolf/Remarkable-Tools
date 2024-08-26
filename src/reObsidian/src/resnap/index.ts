import { execFile as execFileCallback } from "child_process";
import { promisify } from "util";

interface DocumentMetadata {
  createdTime: string;
  lastModified: string;
  lastOpened: string;
  lastOpenedPage: number;
  parent: string;
  pinned: boolean;
  type: string;
  visibleName: string;
}

interface CallResnapArgs {
  rmAddress: string;
  reSnapPath: string;
  reSnapSshkey: string;
  reSnapExtraArgs?: string[];
  outputPath: string;
  postProcess: string;
  postProcessExtraArgs?: string[];
}

const execFile = promisify(execFileCallback);

async function getNoteFileMetadataJson(
  noteFileMetadataPath: string,
  { rmAddress, reSnapSshkey }: CallResnapArgs,
) {
  return JSON.parse(
    (
      await execFile("ssh", [
        `root@${rmAddress}`,
        "-i",
        reSnapSshkey,
        `cat '/home/root/.local/share/remarkable/xochitl/${noteFileMetadataPath}.metadata'`,
      ])
    ).stdout,
  ) as DocumentMetadata;
}

async function getCurrentNotePath(
  reSnapOutput: string,
  args: CallResnapArgs,
): Promise<string> {
  const noteFileMetadataJson = await getNoteFileMetadataJson(
    reSnapOutput,
    args,
  );

  const getNoteFilePath = async (
    noteFileMetadataJson: DocumentMetadata,
    noteFilePath: string,
  ) => {
    if (noteFileMetadataJson.parent !== "")
      return getNoteFilePath(
        await getNoteFileMetadataJson(noteFileMetadataJson.parent, args),
        `${noteFileMetadataJson.visibleName}/${noteFilePath}`,
      );
    else return noteFilePath;
  };
  const currentNotePath = await getNoteFilePath(
    noteFileMetadataJson,
    noteFileMetadataJson.visibleName,
  );

  return currentNotePath.replace(/\/[^/]*$/, "");
}

export default async function callReSnap(args: {
  rmAddress: string;
  reSnapPath: string;
  reSnapSshkey: string;
  reSnapExtraArgs: string[];
  outputPath: string;
  postProcess: string;
  postProcessExtraArgs?: string[];
}) {
  const reSnapOutput = (
    await execFile(args.reSnapPath, [
      "-k",
      args.reSnapSshkey,
      "-n",
      "-s",
      args.rmAddress,
      "-o",
      args.outputPath,
      ...args.reSnapExtraArgs,
    ])
  ).stdout.replace("\n", "");

  if (args.postProcess.length > 0) {
    const postProcessOutput = await execFile(args.postProcess, [
      args.outputPath,
      ...(args.postProcessExtraArgs || []),
    ]);
    console.log("Postprocess output:", postProcessOutput.stdout);
    if (postProcessOutput.stderr)
      console.error("Postprocess stderr:", postProcessOutput.stderr);
  }

  return {
    notePath: await getCurrentNotePath(reSnapOutput, args),
    noteMetadata: await getNoteFileMetadataJson(reSnapOutput, args),
  };
}

