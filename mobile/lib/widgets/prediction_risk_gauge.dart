import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class PredictionRiskGauge extends StatelessWidget {
  final double score; // 0.0 to 100.0
  final String locationName;
  final String? primaryCategory;
  final int unresolvedReports;

  const PredictionRiskGauge({
    super.key,
    required this.score,
    required this.locationName,
    this.primaryCategory,
    this.unresolvedReports = 0,
  });

  @override
  Widget build(BuildContext context) {
    Color riskColor;
    String riskLevel;
    if (score >= 70) {
      riskColor = AppColors.rejected;
      riskLevel = 'HIGH ACCUMULATION RISK';
    } else if (score >= 40) {
      riskColor = AppColors.pending;
      riskLevel = 'MODERATE PRESSURE';
    } else {
      riskColor = AppColors.completed;
      riskLevel = 'LOW ACCUMULATION RISK';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    locationName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: riskColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: riskColor, width: 1),
                  ),
                  child: Text(
                    riskLevel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: riskColor,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress Bar Gauge
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: (score / 100).clamp(0.0, 1.0),
                minHeight: 10,
                backgroundColor: AppColors.cardBorder,
                valueColor: AlwaysStoppedAnimation<Color>(riskColor),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Risk Score: ${score.toInt()}/100',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: riskColor,
                  ),
                ),
                if (unresolvedReports > 0)
                  Text(
                    '$unresolvedReports reports pending collection',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
