import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/waste_categories.dart';

class WasteCategoryCard extends StatelessWidget {
  final String categoryKey;
  final double? confidencePercent;
  final bool showFullGuidance;

  const WasteCategoryCard({
    super.key,
    required this.categoryKey,
    this.confidencePercent,
    this.showFullGuidance = true,
  });

  @override
  Widget build(BuildContext context) {
    final info = WasteCategories.getInfo(categoryKey);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with category icon, name, and confidence pill
          Container(
            padding: const EdgeInsets.all(16),
            color: info.color.withValues(alpha: 0.08),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: info.color.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    info.icon,
                    color: info.color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        info.displayName,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (confidencePercent != null) ...[
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text(
                              'ResNet-18 Model: ${confidencePercent!.toStringAsFixed(1)}% match',
                              style: TextStyle(
                                fontSize: 12,
                                color: info.color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                if (info.isHazardous)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFF87171), width: 1),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 14, color: Color(0xFFB91C1C)),
                        SizedBox(width: 4),
                        Text(
                          'Hazardous',
                          style: TextStyle(
                            color: Color(0xFFB91C1C),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),

          if (showFullGuidance) ...[
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Safety guidance
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          info.safetyGuidance,
                          style: TextStyle(
                            fontSize: 13,
                            color: info.isHazardous ? const Color(0xFF991B1B) : AppColors.textSecondary,
                            fontWeight: info.isHazardous ? FontWeight.w600 : FontWeight.w400,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Recycling instruction
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.autorenew_rounded,
                        size: 16,
                        color: AppColors.emeraldPrimary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          info.recyclingInstructions,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
