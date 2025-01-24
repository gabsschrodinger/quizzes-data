import * as fs from "fs";

interface TempMetadata {
  [key: string]: string;
}

interface ProcessedQuestion {
  metadata: QuestionMetadata;
  question: string;
  correctAnswers: string[];
  incorrectAnswers: string[];
  explanation: string;
}

type QuestionMetadata = {
  id: string;
  topic: string;
  subtopic: string;
  amountCorrect: number;
  amountIncorrect: number;
};

function getMetadataFromMDContent(content: string[]): QuestionMetadata {
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

  return {
    id: metadataContent.id,
    topic: metadataContent.topic,
    subtopic: metadataContent.subtopic,
    amountCorrect: parseInt(metadataContent.amountCorrect),
    amountIncorrect: parseInt(metadataContent.amountIncorrect),
  };
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

function getEachAnswer(answers: string[]): string[] {
  return answers.map((answer) => {
    const adjustedAnswer = answer
      .split("\n")
      .map((line) => line.replace("\r", ""))
      .filter((line) => line != "");
    adjustedAnswer.shift();
    return adjustedAnswer.join("\n");
  });
}

function getCorrectAnswers(content: string[]): string[] {
  const answersSection = content.filter((section) =>
    section.startsWith("Answers:\r\n")
  )[0];

  const correctAnswersSection = answersSection
    .split(/\n### /)
    .filter((section) => section.startsWith("Correct answers:\r\n"))[0];

  const correctAnswers = correctAnswersSection.split(/\n#### /);
  correctAnswers.shift();

  return getEachAnswer(correctAnswers);
}

function getIncorrectAnswers(content: string[]): string[] {
  const answersSection = content.filter((section) =>
    section.startsWith("Answers:\r\n")
  )[0];

  const correctAnswersSection = answersSection
    .split(/\n### /)
    .filter((section) => section.startsWith("Incorrect answers:\r\n"))[0];

  const correctAnswers = correctAnswersSection.split(/\n#### /);
  correctAnswers.shift();

  return getEachAnswer(correctAnswers);
}

function readQuestion(path: string): string[] {
  const fileContent = fs.readFileSync(path, "utf-8");

  return fileContent.split(/\n## /);
}

function processQuestion(question: string[]): ProcessedQuestion {
  return {
    metadata: getMetadataFromMDContent(question),
    question: getQuestionFromMDContent(question),
    correctAnswers: getCorrectAnswers(question),
    incorrectAnswers: getIncorrectAnswers(question),
    explanation: getExplanationFromMDContent(question),
  };
}

function writeQuestion(question: ProcessedQuestion, basePath: string): void {
  // create folder for the question
  fs.mkdirSync(`${basePath}/${question.metadata.id}`);

  // write question file
  fs.writeFileSync(
    `${basePath}/${question.metadata.id}/question.md`,
    question.question
  );

  // write explanation file
  fs.writeFileSync(
    `${basePath}/${question.metadata.id}/explanation.md`,
    question.explanation
  );

  // create folder for answers
  fs.mkdirSync(`${basePath}/${question.metadata.id}/answers`);

  // create folder for correct answers
  fs.mkdirSync(`${basePath}/${question.metadata.id}/answers/correct`);

  // write correct answers
  question.correctAnswers.forEach((answer, index) => {
    fs.writeFileSync(
      `${basePath}/${question.metadata.id}/answers/correct/${index + 1}.md`,
      answer
    );
  });

  // create folder for incorrect answers
  fs.mkdirSync(`${basePath}/${question.metadata.id}/answers/incorrect`);

  // write incorrect answers
  question.incorrectAnswers.forEach((answer, index) => {
    fs.writeFileSync(
      `${basePath}/${question.metadata.id}/answers/incorrect/${index + 1}.md`,
      answer
    );
  });
}

function handleQuestions(path: string): void {
  const metadata: QuestionMetadata[] = [];

  // remove old build (if applicable)
  if (fs.existsSync(`${path}/build`)) {
    fs.rmSync(`${path}/build`, { recursive: true });
  }

  // create new empty build folder
  fs.mkdirSync(`${path}/build`);

  // read all files
  const files = fs
    .readdirSync(path)
    .filter((file) => file != "build" && file.endsWith(".md"));

  // processes and write all questions
  files.forEach((file) => {
    const result = readQuestion(`${path}/${file}`);
    const processedQuestion = processQuestion(result);
    writeQuestion(processedQuestion, `${path}/build`);
    metadata.push(processedQuestion.metadata);
  });

  // write metadata file
  fs.writeFileSync(`${path}/build/metadata.json`, JSON.stringify(metadata));
}

handleQuestions("./databricks-certified-data-engineer-associate");
