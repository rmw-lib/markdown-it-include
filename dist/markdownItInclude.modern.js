/*! markdown-it-include 2.0.0 https://github.com//camelaissani/markdown-it-include @license MIT */

const path = require("path");

const fs = require("fs");

const INCLUDE_RE = /#include\s(.+)/;

const include_plugin = (md, options) => {
  const defaultOptions = {
    root: ".",
    getRootDir: (pluginOptions
    /*, state, startLine, endLine*/
    ) => pluginOptions.root,
    includeRe: INCLUDE_RE,
    throwError: true,
    bracesAreOptional: false,
    notFoundMessage: "File {{FILE}} not found.",
    circularMessage: "Circular reference between {{FILE}} and {{PARENT}}"
  };

  if (typeof options === "string") {
    options = { ...defaultOptions,
      root: options
    };
  } else {
    options = { ...defaultOptions,
      ...options
    };
  }

  const _replaceIncludeByContent = (src, rootdir, parentFilePath, filesProcessed) => {
    filesProcessed = filesProcessed ? filesProcessed.slice() : []; // making a copy

    let cap, filePath, mdSrc, errorMessage; // store parent file path to check circular references

    if (parentFilePath) {
      filesProcessed.push(parentFilePath);
    }

    while (cap = options.includeRe.exec(src)) {
      let includePath = cap[1].trim();
      console.log(includePath);
      filePath = path.resolve(rootdir, includePath); // check if child file exists or if there is a circular reference

      if (!fs.existsSync(filePath)) {
        // child file does not exist
        errorMessage = options.notFoundMessage.replace("{{FILE}}", filePath);
      } else if (filesProcessed.indexOf(filePath) !== -1) {
        // reference would be circular
        errorMessage = options.circularMessage.replace("{{FILE}}", filePath).replace("{{PARENT}}", parentFilePath);
      } // check if there were any errors


      if (errorMessage) {
        if (options.throwError) {
          throw new Error(errorMessage);
        }

        mdSrc = `\n\n# INCLUDE ERROR: ${errorMessage}\n\n`;
      } else {
        // get content of child file
        mdSrc = fs.readFileSync(filePath, "utf8").trim(); // check if child file also has includes

        mdSrc = _replaceIncludeByContent(mdSrc, path.dirname(filePath), filePath, filesProcessed); // remove one trailing newline, if it exists: that way, the included content does NOT
        // automatically terminate the paragraph it is in due to the writer of the included
        // part having terminated the content with a newline.
        // However, when that snippet writer terminated with TWO (or more) newlines, these, minus one,
        // will be merged with the newline after the #include statement, resulting in a 2-NL paragraph
        // termination.
      } // replace include by file content


      src = src.slice(0, cap.index) + mdSrc + src.slice(cap.index + cap[0].length, src.length);
    }

    return src;
  };

  const _includeFileParts = (state, startLine, endLine
  /*, silent*/
  ) => {
    state.src = _replaceIncludeByContent(state.src, options.getRootDir(options, state, startLine, endLine));
  };

  md.core.ruler.before("normalize", "include", _includeFileParts);
};

module.exports = include_plugin;
//# sourceMappingURL=markdownItInclude.modern.js.map
