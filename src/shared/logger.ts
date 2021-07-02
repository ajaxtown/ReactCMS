// @ts-nocheck
import * as Sentry from "@sentry/nextjs";
const reset = "\x1b[0m";
const bright = "\x1b[1m";
const dim = "\x1b[2m";
const underscore = "\x1b[4m";
const blink = "\x1b[5m";
const reverse = "\x1b[7m";
const hidden = "\x1b[8m";

const black = "\x1b[30m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const magenta = "\x1b[35m";
const cyan = "\x1b[36m";
const white = "\x1b[37m";
const orange = "\x1b[45m";

const BGblack = "\x1b[40m";
const BGred = "\x1b[41m";
const BGgreen = "\x1b[42m";
const BGyellow = "\x1b[43m";
const BGblue = "\x1b[44m";
const BGmagenta = "\x1b[45m";
const BGcyan = "\x1b[46m";
const BGwhite = "\x1b[47m";

class logger {
  static debug(...params: any[]) {
    const caller = getCaller();
    const [message, ...rest] = params;
    print("debug", caller, message, cyan, rest);
  }

  static info(...params: any[]) {
    const caller = getCaller();
    const [message, ...rest] = params;
    print("info", caller, message, blue, rest);
  }

  static error(...params: any[]) {
    const caller = getCaller();
    const [message, ...rest] = params;
    if (typeof message === "string") {
      Sentry.captureMessage(message);
    } else {
      Sentry.captureException(message);
    }
    print("error", caller, message, red, rest);
  }

  static warning(...params: any[]) {
    const caller = getCaller();
    const [message, ...rest] = params;
    print("warn", caller, message, orange, rest);
  }

  static success(...params: any[]) {
    const caller = getCaller();
    const [message, ...rest] = params;

    print("success", caller, message, green, rest);
  }
}
export default logger;

function print(
  tagName: string,
  fileName: string,
  message: string,
  tagColor: string,
  rest: any[],
) {
  console.log("");
  console.log.apply(console, [
    tagColor + bright + `[${tagName}]${reset}`,
    magenta + ` ${fileName}${reset}: `,
    message,
    ...rest,
  ]);
}
function getCaller() {
  try {
    throw new Error();
  } catch (e) {
    try {
      // at /Users/abhi/www/letterpad/src/client/server/dispatcher.ts:29:10
      const getLineThree = e.stack.split("at ")[3];
      // [/Users/abhi/www/letterpad/src/client/server/dispatcher.ts:29:10]
      const getLastTwoSlashItem = getLineThree.split("/").slice(1).splice(-2);
      // [server, dispatcher.ts:29:10]
      const getFileName =
        getLastTwoSlashItem[0] +
        "/" +
        getLastTwoSlashItem[1].split(":")[0].replace("?", "");
      return getFileName;
    } catch (e) {
      return "";
    }
  }
}
