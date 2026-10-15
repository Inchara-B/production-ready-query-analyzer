
package io.queryanalyzer.example.controller;

import io.queryanalyzer.example.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final UserService userService;

    public AnalyticsController(UserService userService) {
        this.userService = userService;
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
