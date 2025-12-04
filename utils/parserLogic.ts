import { SvgAttributes } from '../types';

/**
 * A TypeScript implementation of the FIXED Kotlin logic to demonstrate it works in the browser.
 */
export const extractAttributeValueFixed = (source: string, attributeName: string): string | null => {
  const searchString = `${attributeName}="`;
  let searchIndex = 0;

  while (true) {
    const startIndex = source.indexOf(searchString, searchIndex);

    if (startIndex === -1) {
      return null;
    }

    // CRITICAL FIX: Check if it's a whole word match.
    // We check the character *before* the match.
    // It should be either the start of the string OR a whitespace character.
    let isWholeWord = false;
    if (startIndex === 0) {
      isWholeWord = true;
    } else {
      const charBefore = source.charAt(startIndex - 1);
      // Check for whitespace (space, tab, newline, etc.)
      if (/\s/.test(charBefore)) {
        isWholeWord = true;
      }
    }

    if (isWholeWord) {
      // Found the correct attribute!
      const valueStart = startIndex + searchString.length;
      const valueEnd = source.indexOf('"', valueStart);

      if (valueEnd === -1) {
        return null;
      }
      return source.substring(valueStart, valueEnd);
    } else {
      // False positive (e.g., matched 'd="' inside 'id="'), continue searching
      searchIndex = startIndex + 1;
    }
  }
};

export const parseSvgContentFixed = (svgContent: string): SvgAttributes => {
  const svgTagStart = "<svg";
  const svgTagEnd = ">";
  const pathTagStart = "<path";

  let viewBox: string | null = null;
  let width: string | null = null;
  let height: string | null = null;
  const paths: string[] = [];

  // 1. Parse <svg> tag
  const svgStartIndex = svgContent.indexOf(svgTagStart);
  if (svgStartIndex !== -1) {
    const svgEndIndex = svgContent.indexOf(svgTagEnd, svgStartIndex);
    if (svgEndIndex !== -1) {
      const svgHeader = svgContent.substring(svgStartIndex, svgEndIndex);
      viewBox = extractAttributeValueFixed(svgHeader, "viewBox");
      width = extractAttributeValueFixed(svgHeader, "width");
      height = extractAttributeValueFixed(svgHeader, "height");
    }
  }

  // 2. Parse <path> tags
  let searchStart = 0;
  while (true) {
    const currentPathIndex = svgContent.indexOf(pathTagStart, searchStart);
    if (currentPathIndex === -1) break;

    const pathEndIndex = svgContent.indexOf(svgTagEnd, currentPathIndex);
    if (pathEndIndex !== -1) {
      const pathHeader = svgContent.substring(currentPathIndex, pathEndIndex);
      const dValue = extractAttributeValueFixed(pathHeader, "d");

      if (dValue) {
        paths.push(dValue);
      }
      searchStart = pathEndIndex + 1;
    } else {
      break;
    }
  }

  return { viewBox, width, height, paths };
};
