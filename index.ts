import * as fs from "fs";
import * as path from "path";

interface TempMetadata {
  [key: string]: string;
}

function getMetadataFromMDContent(content: string[]) {
  const metadataSection = content.filter((section) =>
    section.startsWith("## Metadata")
  )[0];

  const metadataItems = metadataSection
    .split("\n")
    .map((line) => line.replace("\r", ""))
    .filter((line) => line != "" && line != "## Metadata:");

  const metadataContent: TempMetadata = {};

  // Parse key-value pairs (e.g., "- Author: John Doe")
  for (const metadataItem of metadataItems) {
    if (metadataItem.startsWith("-")) {
      const [key, value] = metadataItem
        .slice(2)
        .split(":")
        .map((s) => s.trim());

      metadataContent[key] = value;
    } else {
      throw Error(`Unexpected content: ${metadataItem}`);
    }
  }

  console.log(metadataContent);
}

function getQuestionFromMDContent(content: string[]): string {
  const questionSection = content.filter((section) =>
    section.startsWith("Question:\r\n")
  )[0];

  const questionLines = questionSection
    .split("\n")
    .map((line) => line.replace("\r", ""))
    .filter((line) => line != "");

  questionLines.shift();

  return questionLines.join("\n\n");
}

function getExplanationFromMDContent(content: string[]): string {
  const explanationSection = content.filter((section) =>
    section.startsWith("Explanation:\r\n")
  )[0];

  const explanationLines = explanationSection
    .split("\n")
    .map((line) => line.replace("\r", ""))
    .filter((line) => line != "");

  explanationLines.shift();

  return explanationLines.join("\n\n");
}

function getCorrectAnswers(content: string[]) {
  const answersSection = content.filter((section) =>
    section.startsWith("Answers:\r\n")
  )[0];

  const correctAnswersSection = answersSection
    .split(/\n### /)
    .filter((section) => section.startsWith("Correct answers:\r\n"))[0];

  const correctAnswersLines = correctAnswersSection
    .split("\n")
    .map((line) => line.replace("\r", ""))
    .filter((line) => line != "");

  correctAnswersLines.shift();

  console.log(correctAnswersLines);
}

function readAndParseMDFile(path: string): string[] {
  const fileContent = fs.readFileSync(path, "utf-8");

  return fileContent.split(/\n## /);
}

const result = readAndParseMDFile(
  "./databricks-certified-data-engineer-associate/full/0001.md"
);

getCorrectAnswers(result);
