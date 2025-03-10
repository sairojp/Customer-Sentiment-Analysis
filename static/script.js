document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const feedbackText = document.getElementById("feedback-text")
  const analyzeBtn = document.getElementById("analyze-btn")
  const clearBtn = document.getElementById("clear-btn")
  const inputTab = document.getElementById("input-tab")
  const resultTab = document.getElementById("result-tab")
  const inputContent = document.getElementById("input-content")
  const resultContent = document.getElementById("result-content")
  const sentimentResult = document.getElementById("sentiment-result")
  const analyzeAnotherBtn = document.getElementById("analyze-another-btn")
  const historyCount = document.getElementById("history-count")
  const emptyHistory = document.getElementById("empty-history")
  const historyList = document.getElementById("history-list")
  const clearHistoryBtn = document.getElementById("clear-history-btn")

  // State
  let isAnalyzing = false
  let history = JSON.parse(localStorage.getItem("sentimentHistory") || "[]")

  // Initialize
  updateHistoryUI()
  updateButtonState()

  // Event Listeners
  feedbackText.addEventListener("input", updateButtonState)
  analyzeBtn.addEventListener("click", handleAnalyze)
  clearBtn.addEventListener("click", clearInput)
  analyzeAnotherBtn.addEventListener("click", showInputTab)
  clearHistoryBtn.addEventListener("click", clearHistory)

  // Functions
  function updateButtonState() {
    const hasText = feedbackText.value.trim().length > 0
    analyzeBtn.disabled = !hasText || isAnalyzing
    clearBtn.disabled = !hasText || isAnalyzing

    analyzeBtn.classList.toggle("opacity-50", !hasText || isAnalyzing)
    clearBtn.classList.toggle("opacity-50", !hasText || isAnalyzing)
  }

  function showInputTab() {
    inputTab.classList.add("border-primary", "text-primary")
    inputTab.classList.remove("border-transparent", "text-gray-500")
    resultTab.classList.remove("border-primary", "text-primary")
    resultTab.classList.add("border-transparent", "text-gray-500")

    inputContent.classList.remove("hidden")
    resultContent.classList.add("hidden")
  }

  function showResultTab() {
    resultTab.classList.add("border-primary", "text-primary")
    resultTab.classList.remove("border-transparent", "text-gray-500")
    resultTab.disabled = false
    inputTab.classList.remove("border-primary", "text-primary")
    inputTab.classList.add("border-transparent", "text-gray-500")

    resultContent.classList.remove("hidden")
    inputContent.classList.add("hidden")
  }

  async function handleAnalyze() {
    const text = feedbackText.value.trim()
    if (!text) return

    // Set analyzing state
    isAnalyzing = true
    analyzeBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Analyzing...
    `
    updateButtonState()

    try {
      const result = await analyzeSentiment(text)

      // Display result
      renderSentimentResult(result, text)
      showResultTab()

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        text,
        result,
        timestamp: new Date().toISOString(),
      }

      history.unshift(historyItem)
      if (history.length > 10) history = history.slice(0, 10) // Limit to 10 items
      localStorage.setItem("sentimentHistory", JSON.stringify(history))
      updateHistoryUI()
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      alert("An error occurred while analyzing the sentiment. Please try again.")
    } finally {
      // Reset analyzing state
      isAnalyzing = false
      analyzeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        Analyze Sentiment
      `
      updateButtonState()
    }
  }

  function clearInput() {
    feedbackText.value = ""
    updateButtonState()
  }

  function renderSentimentResult(result, text) {
    const { sentiment, confidence } = result

    // Binary sentiment (1 = positive, 0 = negative)
    const isPositive = sentiment === 1

    const sentimentIcon = isPositive
      ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'

    const sentimentColor = isPositive ? "bg-green-500" : "bg-red-500"
    const sentimentText = isPositive ? "Positive" : "Negative"
    const sentimentDescription = isPositive ? "The feedback is positive." : "The feedback is negative."

    // Extract some words as "keywords" (simplified)
    const keywords = text
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .filter((word, index, self) => self.indexOf(word) === index) // Remove duplicates
      .slice(0, 5)

    const keywordsHtml =
      keywords.length > 0
        ? `
        <div class="space-y-2">
          <h4 class="font-medium">Key Terms</h4>
          <div class="flex flex-wrap gap-2">
            ${keywords
              .map(
                (keyword) => `
              <span class="badge bg-gray-100 text-gray-800">${keyword}</span>
            `,
              )
              .join("")}
          </div>
        </div>
      `
        : ""

    sentimentResult.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center">
        ${sentimentIcon}
        <h3 class="mt-2 text-2xl font-semibold">${sentimentText} Sentiment</h3>
        <p class="text-gray-500">
          ${sentimentDescription}
        </p>
      </div>
      
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Sentiment Value</span>
          <span class="font-medium">${sentiment}</span>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Confidence</span>
            <span class="font-medium">${confidence}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="h-2.5 rounded-full ${sentimentColor}" style="width: ${confidence}%"></div>
          </div>
        </div>
        <p class="text-xs text-gray-500">
          ${isPositive ? "Positive sentiment (1)" : "Negative sentiment (0)"} with ${confidence}% confidence
        </p>
      </div>
      
      ${keywordsHtml}
      
      <div class="rounded-md bg-gray-100 p-4">
        <h4 class="mb-2 font-medium">Analyzed Text</h4>
        <p class="text-sm text-gray-600">${text}</p>
      </div>
    `
  }

  function updateHistoryUI() {
    if (history.length === 0) {
      historyCount.textContent = "Your analysis history will appear here"
      emptyHistory.classList.remove("hidden")
      historyList.classList.add("hidden")
      clearHistoryBtn.classList.add("hidden")
    } else {
      historyCount.textContent = `${history.length} previous ${history.length === 1 ? "analysis" : "analyses"}`
      emptyHistory.classList.add("hidden")
      historyList.classList.remove("hidden")
      clearHistoryBtn.classList.remove("hidden")

      renderHistoryList()
    }
  }

  function renderHistoryList() {
    historyList.innerHTML = ""

    history.forEach((item) => {
      const { text, result, timestamp } = item
      const isPositive = result.sentiment === 1

      const sentimentIcon = isPositive
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'

      // Truncate text if it's too long
      const truncatedText = text.length > 100 ? `${text.substring(0, 100)}...` : text

      // Format the timestamp
      const date = new Date(timestamp)
      const timeAgo = formatTimeAgo(date)

      const historyItem = document.createElement("div")
      historyItem.className = "card hover:bg-gray-50 cursor-pointer transition-colors"
      historyItem.innerHTML = `
        <div class="p-3">
          <div class="flex items-start gap-3">
            <div class="mt-1">${sentimentIcon}</div>
            <div class="flex-1 space-y-1">
              <p class="text-sm text-left line-clamp-2">${truncatedText}</p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  Confidence: ${result.confidence}%
                </span>
                <span class="text-xs text-gray-500">
                  ${timeAgo}
                </span>
              </div>
            </div>
          </div>
        </div>
      `

      historyItem.addEventListener("click", () => {
        feedbackText.value = text
        renderSentimentResult(result, text)
        showResultTab()
      })

      historyList.appendChild(historyItem)
    })
  }

  function clearHistory() {
    history = []
    localStorage.removeItem("sentimentHistory")
    updateHistoryUI()
  }

  function formatTimeAgo(date) {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // sentiment analysis function  API
  async function analyzeSentiment(text) {
    try {
      const response = await fetch("http://localhost:8000/predict/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }), // Send text in JSON format
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const result = await response.json()
      return {
        sentiment: result.sentiment,
        confidence: Number.parseFloat((result.confidence * 100).toFixed(1)), // Convert to percentage
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error)
      throw error // Re-throw to handle in the calling function
    }
  }
})

