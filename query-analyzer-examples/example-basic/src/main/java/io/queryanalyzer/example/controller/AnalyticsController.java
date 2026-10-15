
package io.queryanalyzer.example.controller;

import io.queryanalyzer.example.service.UserService;
import io.queryanalyzer.core.model.IssueType;
import io.queryanalyzer.core.storage.IssueStorage;
import io.queryanalyzer.core.storage.model.StoredIssue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final UserService userService;
    private final IssueStorage issueStorage;

    public AnalyticsController(UserService userService, IssueStorage issueStorage) {
        this.userService = userService;
        this.issueStorage = issueStorage;
    }

    /** Returns real N+1 findings stored by the analyzer for recently executed requests. */
    @GetMapping("/issues")
    public List<Map<String, Object>> getRecentIssues() {
        return issueStorage.getRecent(Duration.ofHours(24)).stream()
                .filter(issue -> issue.getType() == IssueType.N_PLUS_ONE)
                .map(this::toIssueResponse)
                .toList();
    }

    private Map<String, Object> toIssueResponse(StoredIssue issue) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", issue.getId());
        item.put("timestamp", issue.getTimestamp());
        item.put("endpoint", issue.getEndpoint());
        item.put("httpMethod", issue.getHttpMethod());
        item.put("type", issue.getType().name());
        item.put("severity", issue.getSeverity().name());
        item.put("description", issue.getDescription());
        item.put("queryCount", issue.getQueryCount());
        item.put("executionTimeMs", issue.getExecutionTimeMs());
        item.put("sampleQuery", issue.getSampleQuery());
        item.put("location", issue.getLocation());
        return item;
    }

    @GetMapping("/comparison")
    public Map<String, Object> getComparison() {

        int runs = 10;
        long badTotal = 0;
        long goodTotal = 0;

        // Warm up both approaches before measurement
        userService.getAllUsersWithOrdersBad();
        userService.getAllUsersWithOrdersGood();

        // Measure each approach over multiple runs
        for (int i = 0; i < runs; i++) {

            long start = System.nanoTime();
            userService.getAllUsersWithOrdersBad();
            badTotal += System.nanoTime() - start;

            start = System.nanoTime();
            userService.getAllUsersWithOrdersGood();
            goodTotal += System.nanoTime() - start;
        }

        // Calculate average execution time in milliseconds
        double badAvgMs =
                badTotal / (double) runs / 1_000_000.0;

        double goodAvgMs =
                goodTotal / (double) runs / 1_000_000.0;

        // Calculate percentage improvement
        double improvement = badTotal > 0
                ? ((double) (badTotal - goodTotal) / badTotal) * 100
                : 0.0;

        // Prepare API response
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("feature", "Query Performance Comparison");
        result.put("runs", runs);

        result.put(
                "badApproach",
                "Lazy loading / potential N+1 queries"
        );

        result.put(
                "optimizedApproach",
                "JOIN FETCH"
        );

        result.put(
                "averageBadTimeMs",
                Math.round(badAvgMs * 100.0) / 100.0
        );

        result.put(
                "averageOptimizedTimeMs",
                Math.round(goodAvgMs * 100.0) / 100.0
        );

        result.put(
                "averageImprovementMs",
                Math.round((badAvgMs - goodAvgMs) * 100.0) / 100.0
        );

        result.put(
                "improvementPercentage",
                Math.round(improvement * 100.0) / 100.0
        );

        return result;
    }
}
