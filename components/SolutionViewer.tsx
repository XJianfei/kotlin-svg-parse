import React from 'react';
import { Check, Copy } from 'lucide-react';

export const SolutionViewer: React.FC = () => {
  const kotlinCode = `
/**
 * 辅助函数：从给定字符串中解析特定属性的值。
 * 修复版：增加了单词边界检查，防止 'id="...' 被误判为 'd="...'
 */
fun extractAttributeValue(source: String, attributeName: String): String? {
    val searchString = "$attributeName=\\""
    var searchIndex = 0

    while (true) {
        val startIndex = source.indexOf(searchString, searchIndex)

        if (startIndex == -1) {
            return null
        }

        // --- 核心修复开始 ---
        // 检查匹配到的属性名是否是独立的单词。
        // 如果 startIndex > 0，则前一个字符必须是空白字符。
        val isWholeWord = if (startIndex == 0) {
            true
        } else {
            val charBefore = source[startIndex - 1]
            // 检查是否为常见空白符 (空格, tab, 换行等)
            charBefore.isWhitespace()
        }
        // --- 核心修复结束 ---

        if (isWholeWord) {
            // 找到了真正的属性开始位置
            val valueStart = startIndex + searchString.length
            val valueEnd = source.indexOf('"', valueStart)

            if (valueEnd == -1) {
                return null
            }
            return source.substring(valueStart, valueEnd)
        } else {
            // 这是一个假匹配 (例如想要找 'd' 但匹配到了 'id' 的后缀)
            // 从当前位置后移一位继续查找
            searchIndex = startIndex + 1
        }
    }
}

// parseSvgContent 函数保持原有逻辑即可，只要 extractAttributeValue 修复了，
// 上层调用的逻辑通常不需要变动 (除非有嵌套标签等更复杂情况)。
`;

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(kotlinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-emerald-400">Corrected Kotlin Code</h3>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-slate-300 bg-slate-950">
        <pre className="whitespace-pre-wrap">{kotlinCode}</pre>
      </div>
    </div>
  );
};
