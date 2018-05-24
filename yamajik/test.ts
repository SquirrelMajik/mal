import fs from "fs";
import path from "path";

function testStart(mal: any, testFile: string): Map<string, object> {
  const noNeedExecutePreFix = ";";
  const exceptPrefix = ";=>";
  const commentPrefix = ";;";
  const printPrefix = "; ";
  let results = new Map<string, object>();
  let script: string, except: string, result: string, output: string;

  const lines = fs.readFileSync(testFile, "UTF-8").split("\n");
  lines.forEach((line, index) => {
    line = line.trim();
    console.log(`Line ${index}: ${line}`);
    if (line) {
      if (!line.startsWith(noNeedExecutePreFix)) {
        script = line;
        result = execute(mal, script);
        results.set(script, null);
      } else if (line.startsWith(exceptPrefix)) {
        except = line.slice(exceptPrefix.length);
        printResult(script, result, except);
        results.set(script, { script, result, except });
      } else if (line.startsWith(printPrefix)) {
        output = line.slice(printPrefix.length);
      }
    }
  });

  return results;
}

function execute(mal: any, script: string): string {
  try {
    return mal.rep(script);
  } catch (error) {
    return error;
  }
}

function printResult(script: string, result: string, except: string): object {
  if (result === except) {
    console.log("\x1b[32m%s\x1b[0m", `${script} => OK ( ${except} )`);
  } else {
    console.log(
      "\x1b[31m%s\x1b[0m",
      `${script} => FAILED ( ${result} != ${except} )`
    );
  }
  return;
}

function getMalModuleStringByStep(step: string): string {
  const moduleFileFloder = ".";
  const moduleFile = fs
    .readdirSync(moduleFileFloder)
    .find(file => file.startsWith(step));
  return [moduleFileFloder, moduleFile.slice(0, -3)].join("/");
}

function getTestFileByStep(step: string): string {
  const testFileFloder = "tests";
  const testFile = fs
    .readdirSync(testFileFloder)
    .find(file => file.startsWith(step));
  return path.join(testFileFloder, testFile);
}

function runTest(test: string): Map<string, object> {
  const malFile = getMalModuleStringByStep(test);
  const testFile = getTestFileByStep(test);
  const malModule = require(malFile);
  console.log(`Start test: ${test}`);
  console.log(`Module: ${malFile}`);
  console.log(`Test: ${testFile}`);
  console.log("===================");
  return testStart(malModule, testFile);
}

function runTests(tests: Array<string>): Array<Map<string, object>> {
  return tests.map(tests => runTest(tests));
}

function main() {
  const allTests = [
    "step1",
    "step2",
    "step3",
    "step4",
    "step5",
    "step6",
    "step7",
    "step8",
    "step9",
    "stepA"
  ];
  const [node, enter, test, ...argv] = process.argv;
  const testKeyword = test || "";
  const tests = allTests.filter(item => item.indexOf(testKeyword) > -1);
  runTests(tests);
}

if (require.main === module) {
  main();
}
