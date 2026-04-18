# Refined Performance Tables (Publication Ready)

Measurement date context: April 2026  
Scope: Incident IDs 1-8

## Table 1. SOS Dispatch and Receipt Telemetry

| Incident ID | Coordinates (Lat, Long) | Dispatch Time (Local) | Receipt Time (Local) | Dispatch-to-Receipt Latency (s) | Data Quality       |
| ----------- | ----------------------- | --------------------- | -------------------- | ------------------------------: | ------------------ |
| 1           | 14.65700, 120.98490     | 2026-04-11 02:01:36   | 2026-04-11 02:01:38  |                               2 | Captured           |
| 2           | 14.73049, 121.13642     | 2026-04-14 10:00:16   | 2026-04-14 10:00:18  |                               2 | Captured           |
| 3           | 14.58885, 121.22538     | 2026-04-14 10:32:04   | 2026-04-14 10:32:06  |                               2 | Captured           |
| 4           | 14.61414, 121.25785     | 2026-04-14 10:46:32   | 2026-04-14 10:52:47  |                             375 | Captured (Delayed) |
| 5           | Null                    | 2026-04-14 10:46:32   | Timeout              |                         Timeout | Not Captured       |
| 6           | 14.63149, 121.21228     | 2026-04-14 10:48:37   | 2026-04-14 10:54:55  |                             378 | Captured (Delayed) |
| 7           | 14.66614, 120.95528     | 2026-04-14 10:54:53   | 2026-04-14 11:09:25  |                             872 | Captured (Delayed) |
| 8           | Null                    | 2026-04-14 11:02:52   | Timeout              |                         Timeout | Not Captured       |

Summary (captured rows only, n=6):

| Metric               |        Value |
| -------------------- | -----------: |
| Mean latency (s)     |       271.83 |
| Median latency (s)   |       188.50 |
| Min latency (s)      |            2 |
| Max latency (s)      |          872 |
| P95 latency (s)      |          872 |
| Capture success rate | 75.00% (6/8) |

## Table 2. Routing and WebSocket Delivery Latency

| Incident ID | OSRM Request Latency (ms) | WebSocket Propagation Delay (ms) | Data Quality |
| ----------- | ------------------------: | -------------------------------: | ------------ |
| 1           |                    205.40 |                             2014 | Captured     |
| 2           |                    293.48 |                             1862 | Captured     |
| 3           |                    515.73 |                             1984 | Captured     |
| 4           |                    240.24 |                             2118 | Captured     |
| 5           |                      Null |                             Null | Not Captured |
| 6           |                    236.10 |                             2004 | Captured     |
| 7           |                    407.89 |                             1976 | Captured     |
| 8           |                      Null |                             Null | Not Captured |

Summary (captured rows only, n=6):

| Metric               |    OSRM (ms) | WebSocket (ms) |
| -------------------- | -----------: | -------------: |
| Mean                 |       316.47 |           1993 |
| Median               |       266.86 |           1994 |
| Min                  |       205.40 |           1862 |
| Max                  |       515.73 |           2118 |
| P95                  |       515.73 |           2118 |
| Capture success rate | 75.00% (6/8) |   75.00% (6/8) |

## Table 3. Triage Recommendation Performance

| Incident ID | Triage API Response Time (ms) | Recommended Medical Facility | Priority Score | Data Quality |
| ----------- | ----------------------------: | ---------------------------- | -------------: | ------------ |
| 1           |                          1450 | Rizal Medical Center (RMC)   |           0.54 | Captured     |
| 2           |                          1070 | H VIII Hospital              |           0.68 | Captured     |
| 3           |                          1340 | RPHS - Antipolo Annex II     |           0.57 | Captured     |
| 4           |                          1090 | RPHS - Antipolo Annex III    |           0.57 | Captured     |
| 5           |                          Null | Null                         |           Null | Not Captured |
| 6           |                          1270 | RPHS - Antipolo Annex III    |           0.67 | Captured     |
| 7           |                          1290 | Rizal Medical Center (RMC)   |           0.52 | Captured     |
| 8           |                          Null | Null                         |           Null | Not Captured |

Summary (captured rows only, n=6):

| Metric               | Triage Response Time (ms) | Priority Score |
| -------------------- | ------------------------: | -------------: |
| Mean                 |                   1251.67 |          0.592 |
| Median               |                   1280.00 |          0.570 |
| Min                  |                      1070 |          0.520 |
| Max                  |                      1450 |          0.680 |
| P95                  |                      1450 |          0.680 |
| Capture success rate |              75.00% (6/8) |   75.00% (6/8) |

## Notes and Definitions

1. Null: no valid metric captured for that run.
2. Timeout: no receipt event observed within the observation window.
3. P95 used here is nearest-rank percentile due to small sample size.
4. All times should explicitly declare timezone in your final manuscript (for example, Local Time UTC+08:00).
5. Naming rationale:
   - OSRM Request Latency (ms): endpoint round-trip time for route request.
   - WebSocket Propagation Delay (ms): receive_time - incident_reported_time.
   - Triage API Response Time (ms): end-to-end recommendation call duration.

## Suggested Figure/Appendix Caption

"Latency and recommendation metrics for eight SOS incidents. Six incidents produced complete telemetry; two had missing/timeout observations. WebSocket propagation remained near 2.0 s for captured events, while dispatch-to-receipt latency showed high variance due to delayed/outlier incidents."
