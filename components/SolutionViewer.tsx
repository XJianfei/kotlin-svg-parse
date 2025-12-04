import React, { useState } from 'react';
import { Check, Copy, FileCode, Image as ImageIcon } from 'lucide-react';

export const SolutionViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parser' | 'canvas'>('parser');
  const [copied, setCopied] = useState(false);

  const kotlinParserCode = `
/**
 * 结构体：存储单个路径及其变换信息
 */
data class SvgPath(
    val d: String, 
    val transform: String? = null
)

/**
 * 结构体：存储整个 SVG 的属性
 */
data class SvgAttributes(
    val viewBox: String? = null,
    val width: String? = null,
    val height: String? = null,
    val paths: List<SvgPath> = emptyList() // 改为存储 SvgPath 对象列表
)

/**
 * 辅助函数：提取属性值 (包含之前的单词边界修复)
 */
fun extractAttributeValue(source: String, attributeName: String): String? {
    val searchString = "$attributeName=\\""
    var searchIndex = 0

    while (true) {
        val startIndex = source.indexOf(searchString, searchIndex)
        if (startIndex == -1) return null

        // 单词边界检查 (防止 id="...d=" 误判)
        val isWholeWord = if (startIndex == 0) true else source[startIndex - 1].isWhitespace()

        if (isWholeWord) {
            val valueStart = startIndex + searchString.length
            val valueEnd = source.indexOf('"', valueStart)
            if (valueEnd == -1) return null
            return source.substring(valueStart, valueEnd)
        } else {
            searchIndex = startIndex + 1
        }
    }
}

fun parseSvgContent(svgContent: String): SvgAttributes {
    val svgTagStart = "<svg"
    val svgTagEnd = ">"
    val pathTagStart = "<path"

    var viewBox: String? = null
    var width: String? = null
    var height: String? = null
    val paths = mutableListOf<SvgPath>()

    // 1. 解析 <svg> 标签
    val svgStartIndex = svgContent.indexOf(svgTagStart)
    if (svgStartIndex != -1) {
        val svgEndIndex = svgContent.indexOf(svgTagEnd, svgStartIndex)
        if (svgEndIndex != -1) {
            val svgHeader = svgContent.substring(svgStartIndex, svgEndIndex)
            viewBox = extractAttributeValue(svgHeader, "viewBox")
            width = extractAttributeValue(svgHeader, "width")
            height = extractAttributeValue(svgHeader, "height")
        }
    }

    // 2. 解析 <path> 标签
    var searchStart = 0
    while (true) {
        val currentPathIndex = svgContent.indexOf(pathTagStart, searchStart)
        if (currentPathIndex == -1) break

        val pathEndIndex = svgContent.indexOf(svgTagEnd, currentPathIndex)
        if (pathEndIndex != -1) {
            val pathHeader = svgContent.substring(currentPathIndex, pathEndIndex)
            
            // 同时提取 'd' 和 'transform'
            val dValue = extractAttributeValue(pathHeader, "d")
            val transformValue = extractAttributeValue(pathHeader, "transform")

            if (dValue != null) {
                paths.add(SvgPath(dValue, transformValue))
            }

            searchStart = pathEndIndex + 1
        } else {
            break
        }
    }

    return SvgAttributes(viewBox, width, height, paths)
}
`;

  const androidCanvasCode = `
import android.content.Context
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.util.AttributeSet
import android.view.View
import androidx.core.graphics.PathParser
import java.util.regex.Pattern

// --- 数据类定义 ---
data class SvgPath(val d: String, val transform: String? = null)

data class SvgAttributes(
    val viewBox: String? = null,
    val width: String? = null,
    val height: String? = null,
    val paths: List<SvgPath> = emptyList()
)

/**
 * Android 自定义 View：支持 Path 绘制和基础 Transform (translate)
 */
class SvgIconView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var svgData: SvgAttributes? = null
    private val pathList = mutableListOf<Path>()
    
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = 0xFF333333.toInt()
    }

    // 用于解析 transform="translate(x, y)" 的正则
    // 匹配示例: translate(10, 20) 或 translate(10 20) 或 translate(-5)
    private val translatePattern = Pattern.compile("translate\\\\s*\\\\(\\\\s*([^,\\\\s)]+)[,\\\\s]*([^,\\\\s)]*)?\\\\s*\\\\)")

    fun setSvgData(data: SvgAttributes) {
        this.svgData = data
        this.pathList.clear()

        data.paths.forEach { svgPath ->
            try {
                val path = PathParser.createPathFromPathData(svgPath.d)
                if (path != null) {
                    // 如果存在 transform 属性，应用它
                    svgPath.transform?.let { t ->
                        applyTransformToPath(path, t)
                    }
                    pathList.add(path)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        invalidate()
    }
    
    /**
     * 解析并应用 Transform 到 Path 上
     * 注意：这里只演示了 translate 的支持。
     * 对于复杂的嵌套 transform (如 <g> 标签上的)，建议使用 Android 的 XmlPullParser 进行递归解析。
     */
    private fun applyTransformToPath(path: Path, transformStr: String) {
        val matrix = Matrix()
        val matcher = translatePattern.matcher(transformStr)
        
        if (matcher.find()) {
            val xStr = matcher.group(1) ?: "0"
            val yStr = matcher.group(2)
            
            val x = xStr.toFloatOrNull() ?: 0f
            val y = (if (!yStr.isNullOrBlank()) yStr else "0").toFloatOrNull() ?: 0f
            
            matrix.setTranslate(x, y)
            path.transform(matrix)
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val data = svgData ?: return
        if (pathList.isEmpty()) return

        val contentWidth = width - paddingLeft - paddingRight
        val contentHeight = height - paddingTop - paddingBottom
        if (contentWidth <= 0 || contentHeight <= 0) return

        // 1. 确定 ViewBox
        var vbX = 0f; var vbY = 0f; var vbW = 0f; var vbH = 0f
        var foundViewBox = false

        data.viewBox?.let { vb ->
            val parts = vb.trim().split(Regex("[\\s,]+")).mapNotNull { it.toFloatOrNull() }
            if (parts.size == 4) {
                vbX = parts[0]; vbY = parts[1]; vbW = parts[2]; vbH = parts[3]
                foundViewBox = true
            }
        }

        if (!foundViewBox) {
            vbW = data.width?.toFloatOrNull() ?: 100f
            vbH = data.height?.toFloatOrNull() ?: 100f
        }
        if (vbW <= 0f) vbW = 100f; if (vbH <= 0f) vbH = 100f

        // 2. Aspect Fit 缩放计算
        val scale = minOf(contentWidth / vbW, contentHeight / vbH)
        val drawW = vbW * scale
        val drawH = vbH * scale
        val offsetX = paddingLeft + (contentWidth - drawW) / 2f
        val offsetY = paddingTop + (contentHeight - drawH) / 2f

        canvas.save()
        canvas.translate(offsetX, offsetY)
        canvas.scale(scale, scale)
        canvas.translate(-vbX, -vbY)

        for (path in pathList) {
            canvas.drawPath(path, paint)
        }
        canvas.restore()
    }
}
`;

  const codeToDisplay = activeTab === 'parser' ? kotlinParserCode : androidCanvasCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      
      {/* File Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={() => setActiveTab('parser')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-r border-slate-700 transition-colors ${
            activeTab === 'parser' 
              ? 'bg-slate-800 text-emerald-400' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCode size={16} />
          ParserLogic.kt
        </button>
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-r border-slate-700 transition-colors ${
            activeTab === 'canvas' 
              ? 'bg-slate-800 text-blue-400' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ImageIcon size={16} />
          SvgIconView.kt (Android Canvas)
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400">
            {activeTab === 'parser' ? 'Fixed Logic + Transform Extraction' : 'View with Matrix Transform Support'}
        </span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-400"/> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy Code'}
        </button>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed text-slate-300 bg-slate-950">
        <pre className="whitespace-pre-wrap">{codeToDisplay}</pre>
      </div>
    </div>
  );
};
