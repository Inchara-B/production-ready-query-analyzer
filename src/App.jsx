

import { useEffect, useState } from "react";

import "./App.css";



const API_BASE = "http://localhost:8081";



const navItems = [

  { id: "overview", icon: "▦", label: "Overview" },

  { id: "analysis", icon: "⌕", label: "Query Analysis" },

  { id: "performance", icon: "↗", label: "Performance" },

];



function formatMs(value) {

  const number = Number(value);

  return Number.isFinite(number) ? `${number.toFixed(2)} ms` : "—";

}



export default function App() {

  const [activePage, setActivePage] = useState("overview");

  const [comparison, setComparison] = useState(null);
  const [issues, setIssues] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  async function loadComparison() {

    setLoading(true);

    setError("");



    try {

      const response = await fetch(`${API_BASE}/api/analytics/comparison`);



      if (!response.ok) {

        throw new Error(`Backend returned HTTP ${response.status}`);

      }



      const data = await response.json();

      setComparison(data);

      // The comparison request has now completed, so the analyzer filter has
      // had a chance to store findings from the SQL executed during that request.
      const issuesResponse = await fetch(`${API_BASE}/api/analytics/issues`);
      if (issuesResponse.ok) {
        const issueData = await issuesResponse.json();
        // Keep only the repeated child-table queries from the lazy-loading path.
        // The starter also reports repeated benchmark executions and JOIN FETCH
        // statements; those alone are not evidence of an N+1 problem.
        const candidates = (Array.isArray(issueData) ? issueData : []).filter((issue) => {
          const sql = String(issue.sampleQuery ?? "").toLowerCase();
          const location = String(issue.location ?? "").toLowerCase();
          return sql.includes("from orders") &&
            sql.includes("user_id") &&
            sql.includes("?") &&
            location.includes("getalluserswithordersbad");
        });

        // The comparison endpoint runs repeatedly, so the analyzer may store
        // the same finding more than once. Display one latest finding per pattern.
        const uniqueFindings = new Map();
        for (const issue of candidates) {
          const key = `${String(issue.sampleQuery ?? "").replace(/\s+/g, " ").trim()}|${issue.location ?? ""}`;
          const existing = uniqueFindings.get(key);
          if (!existing || new Date(issue.timestamp ?? 0) > new Date(existing.timestamp ?? 0)) {
            uniqueFindings.set(key, issue);
          }
        }
        setIssues(Array.from(uniqueFindings.values()));
      }

    } catch {

      setError(

        "Could not load live performance data. Make sure the Spring Boot backend is running on port 8081."

      );

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    loadComparison();

  }, []);



  // Support the current average-time API fields and older response fields.
  const badTimeValue =
    comparison?.averageBadTimeMs ?? comparison?.badTimeMs;
  const goodTimeValue =
    comparison?.averageOptimizedTimeMs ?? comparison?.optimizedTimeMs;

  const badTime = Number(badTimeValue);
  const goodTime = Number(goodTimeValue);
  const hasTimings =
    badTimeValue != null &&
    goodTimeValue != null &&
    Number.isFinite(badTime) &&
    Number.isFinite(goodTime);


  const improvement =

    comparison?.improvementPercentage != null

      ? Number(comparison.improvementPercentage)

      : hasTimings && badTime > 0

        ? ((badTime - goodTime) / badTime) * 100

        : null;



  const pageTitles = {

    overview: ["Overview", "A clear view of your database query health."],

    analysis: ["Query Analysis", "Understand repeated queries and N+1 issues."],

    performance: ["Performance", "Compare query execution approaches."],

  };



  return (

    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">Q</div>

          <div>

            <h2>QueryAnalyzer</h2>

            <p>DATABASE INSIGHTS</p>

          </div>

        </div>



        <div className="nav-label">WORKSPACE</div>



        <nav className="navigation">

          {navItems.map((item) => (

            <button

              key={item.id}

              className={`nav-item ${

                activePage === item.id ? "active" : ""

              }`}

              onClick={() => setActivePage(item.id)}

            >

              <span className="nav-icon">{item.icon}</span>

              <span>{item.label}</span>

            </button>

          ))}

        </nav>



        <div className="sidebar-bottom">

          <div className="connection-dot" />

          <div>

            <strong>Local environment</strong>

            <span>Spring Boot API</span>

          </div>

        </div>

      </aside>



      <main className="main-area">

        <header className="topbar">

          <div>

            <span className="eyebrow">DATABASE MONITORING</span>

            <div className="topbar-title">Query Performance Workspace</div>

          </div>



          <div className="topbar-right">

            <span className="status-pill">

              <span className={`status-dot ${error ? "offline" : ""}`} />

              {error ? "API unavailable" : "Local dashboard"}

            </span>

            <button

              className="refresh-button"

              onClick={loadComparison}

              disabled={loading}

            >

              <span>{loading ? "↻" : "⟳"}</span>

              {loading ? "Refreshing" : "Refresh"}

            </button>

          </div>

        </header>



        <section className="page-heading">

          <div>

            <div className="eyebrow">QUERY PERFORMANCE MONITORING</div>

            <h1>{pageTitles[activePage][0]}</h1>

            <p>{pageTitles[activePage][1]}</p>

          </div>

          <div className="heading-symbol">⌘</div>

        </section>



        {error && (

          <div className="error-banner">

            <span>!</span>

            <div>

              <strong>Live data is unavailable</strong>

              <p>{error}</p>

            </div>

            <button onClick={loadComparison}>Retry</button>

          </div>

        )}



        <section className="metrics-grid">

          <MetricCard

            icon="◉"

            label="Analyzer"

            value="Active"

            detail="Query analysis workspace"

            tone="blue"

          />

          <MetricCard

            icon="!"

            label="Detected issue"

            value={issues.length > 0 ? "N+1" : "None"}

            detail={issues.length > 0 ? `${issues.length} real finding(s)` : "No stored findings yet"}

            tone="orange"

          />

          <MetricCard

            icon="↻"

            label="Repeated queries"

            value={issues.length > 0 ? String(issues[0].queryCount ?? "—") : "—"}

            detail="Queries in latest stored finding"

            tone="purple"

          />

          <MetricCard

            icon="↗"

            label="Optimization"

            value="JOIN FETCH"

            detail="Suggested query strategy"

            tone="green"

          />

        </section>



        {activePage === "overview" && (

          <Overview

            issues={issues}

            comparison={comparison}

            hasTimings={hasTimings}

            badTime={badTime}

            goodTime={goodTime}

            improvement={improvement}

            onNavigate={setActivePage}

          />

        )}



        {activePage === "analysis" && (

          <AnalysisPage issues={issues} onNavigate={setActivePage} />

        )}



        {activePage === "performance" && (

          <PerformancePage

            comparison={comparison}

            hasTimings={hasTimings}

            badTime={badTime}

            goodTime={goodTime}

            improvement={improvement}

            loading={loading}

            onRefresh={loadComparison}

          />

        )}



        <footer className="footer">

          <span>QueryAnalyzer</span>

          <span>Database performance insights · Local development</span>

        </footer>

      </main>

    </div>

  );

}



function MetricCard({ icon, label, value, detail, tone }) {

  return (

    <article className="metric-card">

      <div className={`metric-icon ${tone}`}>{icon}</div>

      <div className="metric-copy">

        <span className="metric-label">{label}</span>

        <strong className="metric-value">{value}</strong>

        <span className="metric-detail">{detail}</span>

      </div>

    </article>

  );

}



function Overview({

  issues,

  comparison,

  hasTimings,

  badTime,

  goodTime,

  improvement,

  onNavigate,

}) {

  return (

    <div className="content-grid">

      <section className="panel issue-panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">ANALYSIS REPORT</span>

            <h2>Query analysis</h2>

          </div>

          <span className="issue-badge">{issues.length > 0 ? "N+1 detected" : "No stored findings"}</span>

        </div>



        <div className="issue-box">

          <div className="issue-symbol">!</div>

          <div>

            <strong>{issues[0]?.description ?? "No N+1 finding returned by the analyzer"}</strong>

            <p>{issues[0] ? `Endpoint: ${issues[0].httpMethod ?? ""} ${issues[0].endpoint ?? ""}` : "Run the comparison and refresh to collect analyzer findings."}</p>

          </div>

          <span className="severity">{issues[0]?.severity ?? "—"}</span>

        </div>



        <div className="detail-list">

          <div>

            <span>Repeated queries</span>

            <strong>{issues[0]?.queryCount ?? "—"}</strong>

          </div>

          <div>

            <span>Recommended approach</span>

            <strong>{issues.length > 0 ? "JOIN FETCH" : "—"}</strong>

          </div>

          <div>

            <span>Relationship field</span>

            <strong>user_id</strong>

          </div>

        </div>



        <button

          className="text-button"

          onClick={() => onNavigate("analysis")}

        >

          Explore query analysis <span>→</span>

        </button>

      </section>



      <section className="panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">BACKEND ROUTES</span>

            <h2>API endpoints</h2>

          </div>

          <span className="framework-badge">Spring Boot</span>

        </div>



        <div className="endpoint-list">

          <Endpoint

            method="GET"

            path="/api/users"

            description="Example user query"

          />

          <Endpoint

            method="GET"

            path="/api/users/fixed"

            description="Optimized user query"

          />

          <Endpoint

            method="GET"

            path="/api/analytics/comparison"

            description="Compare query performance"

          />

        </div>



        <button

          className="text-button"

          onClick={() => onNavigate("performance")}

        >

          View performance results <span>→</span>

        </button>

      </section>



      <section className="panel performance-panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">EXECUTION COMPARISON</span>

            <h2>Query performance</h2>

          </div>

          <span className="live-label">API data</span>

        </div>



        <div className="comparison-row">

          <div>

            <span className="comparison-label">Lazy loading approach</span>

            <strong>{hasTimings ? formatMs(badTime) : "Not loaded"}</strong>

          </div>

          <div className="comparison-track">

            <div

              className="comparison-fill bad-fill"

              style={{

                width:

                  hasTimings && badTime > 0

                    ? `${Math.max(4, Math.min(100, (badTime / Math.max(badTime, goodTime, 0.01)) * 100))}%`

                    : "0%",

              }}

            />

          </div>

        </div>



        <div className="comparison-row">

          <div>

            <span className="comparison-label">JOIN FETCH approach</span>

            <strong>{hasTimings ? formatMs(goodTime) : "Not loaded"}</strong>

          </div>

          <div className="comparison-track">

            <div

              className="comparison-fill good-fill"

              style={{

                width:

                  hasTimings && Math.max(badTime, goodTime) > 0

                    ? `${Math.max(4, Math.min(100, (goodTime / Math.max(badTime, goodTime, 0.01)) * 100))}%`

                    : "0%",

              }}

            />

          </div>

        </div>



        <div className="performance-summary">

          <div>

            <span>Measured improvement</span>

            <strong>

              {improvement != null && Number.isFinite(improvement)

                ? `${improvement.toFixed(2)}%`

                : "—"}

            </strong>

          </div>

          <p>
            {issues.length > 0 ? "Findings are read from the backend analyzer storage." : "No N+1 findings are currently stored for the last 24 hours."}
          </p>

        </div>

      </section>



      <section className="panel tips-panel">

        <span className="eyebrow">RECOMMENDED ACTION</span>

        <h2>Reduce unnecessary database calls</h2>

        <p>

          The example analysis flags repeated orders queries while loading

          users. A fetch join can load the required association together,

          reducing repeated database round trips.

        </p>

        <div className="tip-code">JOIN FETCH users.orders</div>

        <button

          className="text-button"

          onClick={() => onNavigate("analysis")}

        >

          Understand the issue <span>→</span>

        </button>

      </section>

    </div>

  );

}



function Endpoint({ method, path, description }) {

  return (

    <div className="endpoint">

      <span className="method-badge">{method}</span>

      <div>

        <strong>{path}</strong>

        <p>{description}</p>

      </div>

      <span className="endpoint-arrow">↗</span>

    </div>

  );

}



function AnalysisPage({ issues, onNavigate }) {

  return (

    <div className="content-grid detail-page">

      <section className="panel wide-panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">DETECTED PATTERN</span>

            <h2>N+1 query problem</h2>

          </div>

          <span className="issue-badge">{issues.length > 0 ? `${issues.length} stored finding(s)` : "No stored findings"}</span>

        </div>



        <p className="body-copy">

          An N+1 problem occurs when an application first loads a list of

          records and then issues another query for a related collection

          for each record. This can create many database round trips.

        </p>



        <div className="code-comparison">

          <div className="code-card bad-code">

            <span className="code-label">BEFORE · LAZY LOADING</span>

            <h3>Repeated queries</h3>

            <p>1 query to load users</p>

            <p>+ additional orders queries</p>

            <strong>Potential N+1 pattern</strong>

          </div>

          <div className="code-card good-code">

            <span className="code-label">AFTER · FETCH JOIN</span>

            <h3>Fetch related data</h3>

            <p>Load users and required orders</p>

            <p>using a suitable fetch plan</p>

            <strong>Fewer round trips in this example</strong>

          </div>

        </div>



        <h3 className="subheading">Recent detector findings</h3>
        {issues.length === 0 ? (
          <p className="muted-note">No stored N+1 findings returned by the backend yet.</p>
        ) : (
          <div className="fix-list">
            {issues.map((issue) => (
              <div key={issue.id}>
                <span>!</span>
                <div>
                  <strong>{issue.severity} · {issue.endpoint}</strong>
                  <p>{issue.description}</p>
                  <p>Queries: {issue.queryCount} · {issue.executionTimeMs} ms</p>
                  {issue.sampleQuery && <code>{issue.sampleQuery}</code>}
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="subheading">Suggested fixes</h3>

        <div className="fix-list">

          <div><span>01</span><div><strong>JOIN FETCH</strong><p>Load the related collection in the query.</p></div></div>

          <div><span>02</span><div><strong>@EntityGraph</strong><p>Specify which relationships should be fetched.</p></div></div>

          <div><span>03</span><div><strong>@BatchSize</strong><p>Fetch related entities in batches where appropriate.</p></div></div>

        </div>



        <button

          className="primary-button"

          onClick={() => onNavigate("performance")}

        >

          View performance comparison →

        </button>

      </section>



      <section className="panel">

        <span className="eyebrow">ISSUE SUMMARY</span>

        <h2>What the analyzer found</h2>

        <div className="detail-list">

          <div><span>Query pattern</span><strong>N+1</strong></div>

          <div><span>Repeated query group</span><strong>orders</strong></div>

          <div><span>Relationship</span><strong>users → orders</strong></div>

          <div><span>Suggested fix</span><strong>JOIN FETCH</strong></div>

        </div>

        <p className="muted-note">

          {issues.length > 0 ? "These findings were returned by the backend analyzer storage. Review the endpoint, severity, and sample SQL below." : "No N+1 findings are currently stored. Refresh the dashboard to run the comparison and let the analyzer process the SQL queries."}

        </p>

      </section>

    </div>

  );

}



function PerformancePage({

  comparison,

  hasTimings,

  badTime,

  goodTime,

  improvement,

  loading,

  onRefresh,

}) {

  return (

    <div className="content-grid detail-page">

      <section className="panel wide-panel">

        <div className="panel-heading">

          <div>

            <span className="eyebrow">LIVE API COMPARISON</span>

            <h2>Execution timing</h2>

          </div>

          <button className="refresh-button" onClick={onRefresh} disabled={loading}>

            {loading ? "Refreshing…" : "↻ Refresh data"}

          </button>

        </div>



        {!comparison && (

          <div className="empty-state">

            <div className="empty-icon">◷</div>

            <h3>No performance data loaded</h3>

            <p>Start the backend and refresh to retrieve a comparison.</p>

          </div>

        )}



        {comparison && (

          <>

            <div className="timing-cards">

              <div className="timing-card">

                <span>Lazy loading approach</span>

                <strong>{formatMs(badTime)}</strong>

                <small>Average across {comparison.runs ?? 1} measured runs</small>

              </div>

              <div className="timing-card">

                <span>JOIN FETCH approach</span>

                <strong>{formatMs(goodTime)}</strong>

                <small>Average across {comparison.runs ?? 1} measured runs</small>

              </div>

              <div className="timing-card highlight-card">

                <span>Measured difference</span>

                <strong>

                  {improvement != null && Number.isFinite(improvement)

                    ? `${improvement.toFixed(2)}%`

                    : "—"}

                </strong>

                <small>Based on this response</small>

              </div>

            </div>



            <div className="detail-list">

              <div><span>Baseline approach</span><strong>{comparison.badApproach || "Lazy loading"}</strong></div>

              <div><span>Optimized approach</span><strong>{comparison.optimizedApproach || "JOIN FETCH"}</strong></div>

              <div><span>Time difference</span><strong>{hasTimings ? formatMs(badTime - goodTime) : "—"}</strong></div>

            </div>

          </>

        )}



        <div className="notice">

          <strong>Measurement note</strong>

          <p>

            This is a simple application-level timing comparison, not a controlled
              benchmark. Warm-up, caching, database state, and execution order
              can affect results. The displayed timings average the measured runs.

          </p>

        </div>

      </section>

    </div>

  );

}
