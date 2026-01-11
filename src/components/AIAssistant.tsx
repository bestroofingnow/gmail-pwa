"use client";

import { useState } from "react";
import { EmailMessage } from "@/types/gmail";

interface AIAssistantProps {
  email: EmailMessage;
  onUseReply?: (reply: string) => void;
}

type Tone = "professional" | "friendly" | "brief";

export function AIAssistant({ email, onUseReply }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"security" | "summary" | "reply" | "analyze">("security");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [replyTone, setReplyTone] = useState<Tone>("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [analysis, setAnalysis] = useState<{
    category?: string;
    priority?: string;
    suggestedLabels?: string[];
    actionRequired?: boolean;
    actionSummary?: string;
    actions?: string[];
  } | null>(null);
  const [security, setSecurity] = useState<{
    riskLevel?: "safe" | "suspicious" | "dangerous";
    riskScore?: number;
    threats?: string[];
    recommendations?: string[];
    summary?: string;
    shouldOpen?: boolean;
  } | null>(null);

  const emailContext = {
    subject: email.subject,
    from: email.from,
    to: email.to,
    body: email.body,
    date: email.date,
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailContext),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Failed to summarize:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...emailContext,
          tone: replyTone,
          instructions: customInstructions || undefined,
        }),
      });
      const data = await res.json();
      setReply(data.reply);
    } catch (error) {
      console.error("Failed to generate reply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const [catRes, actRes] = await Promise.all([
        fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContext),
        }),
        fetch("/api/ai/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContext),
        }),
      ]);

      const catData = await catRes.json();
      const actData = await actRes.json();

      setAnalysis({
        ...catData,
        actions: actData.actions,
      });
    } catch (error) {
      console.error("Failed to analyze:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityScan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailContext),
      });
      const data = await res.json();
      setSecurity(data);
    } catch (error) {
      console.error("Failed to scan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  const riskColors = {
    safe: "bg-green-100 text-green-800 border-green-300",
    suspicious: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dangerous: "bg-red-100 text-red-800 border-red-300",
  };

  const riskIcons = {
    safe: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    suspicious: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    dangerous: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        AI Assistant (Llama 4)
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-red-50 text-red-700 border-b-2 border-red-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Security Scan
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "summary"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Summarize
            </button>
            <button
              onClick={() => setActiveTab("reply")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "reply"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Smart Reply
            </button>
            <button
              onClick={() => setActiveTab("analyze")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "analyze"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Analyze
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === "security" && (
              <div>
                {!security ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">Scan this email for phishing, scams, and other threats</p>
                    <button
                      onClick={handleSecurityScan}
                      disabled={isLoading}
                      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
                    >
                      {isLoading ? "Scanning..." : "Scan for Threats"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Risk Level Banner */}
                    <div className={`p-4 rounded-lg border-2 ${riskColors[security.riskLevel || "safe"]}`}>
                      <div className="flex items-center gap-3">
                        {riskIcons[security.riskLevel || "safe"]}
                        <div>
                          <h4 className="font-bold text-lg capitalize">{security.riskLevel}</h4>
                          <p className="text-sm">Risk Score: {security.riskScore}/100</p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{security.summary}</p>
                    </div>

                    {/* Threats */}
                    {security.threats && security.threats.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Threats Detected
                        </h5>
                        <ul className="space-y-2">
                          {security.threats.map((threat, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                              <span className="text-red-500">!</span>
                              {threat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {security.recommendations && security.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Recommendations
                        </h5>
                        <ul className="space-y-1">
                          {security.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-500">-</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => setSecurity(null)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Re-scan
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "summary" && (
              <div>
                {!summary ? (
                  <button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                  >
                    {isLoading ? "Summarizing..." : "Generate Summary"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{summary}</p>
                    </div>
                    <button
                      onClick={() => setSummary(null)}
                      className="text-sm text-purple-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reply" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <div className="flex gap-2">
                    {(["professional", "friendly", "brief"] as Tone[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setReplyTone(tone)}
                        className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                          replyTone === tone
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions (optional)
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Decline politely, Ask for more details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {!reply ? (
                  <button
                    onClick={handleGenerateReply}
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                  >
                    {isLoading ? "Generating..." : "Generate Reply"}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Suggested Reply</h4>
                      <pre className="text-gray-700 whitespace-pre-wrap font-sans">{reply}</pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUseReply?.(reply)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Use This Reply
                      </button>
                      <button
                        onClick={() => setReply(null)}
                        className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analyze" && (
              <div>
                {!analysis ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                  >
                    {isLoading ? "Analyzing..." : "Analyze Email"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase">Category</span>
                        <p className="font-medium capitalize">{analysis.category}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 uppercase">Priority</span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                            priorityColors[analysis.priority as keyof typeof priorityColors] ||
                            "bg-gray-100"
                          }`}
                        >
                          {analysis.priority}
                        </span>
                      </div>
                    </div>

                    {analysis.suggestedLabels && analysis.suggestedLabels.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Suggested Labels</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {analysis.suggestedLabels.map((label, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.actionRequired && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800 font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Action Required
                        </div>
                        {analysis.actionSummary && (
                          <p className="mt-1 text-sm text-yellow-700">{analysis.actionSummary}</p>
                        )}
                      </div>
                    )}

                    {analysis.actions && analysis.actions.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Action Items</span>
                        <ul className="mt-2 space-y-2">
                          {analysis.actions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs">
                                {i + 1}
                              </span>
                              <span className="text-sm text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => setAnalysis(null)}
                      className="text-sm text-purple-600 hover:underline"
                    >
                      Re-analyze
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
