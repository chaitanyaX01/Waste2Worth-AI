import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class EcoPointsBadge extends StatelessWidget {
  final int points;
  final double fontSize;
  final bool isLarge;

  const EcoPointsBadge({
    super.key,
    required this.points,
    this.fontSize = 14,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLarge) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFCD34D), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.amber.withOpacity(0.12),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: AppColors.ecoGold,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.eco,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'EcoPoints Balance',
                  style: TextStyle(
                    color: AppColors.ecoGoldDark,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  '$points pts',
                  style: const TextStyle(
                    color: Color(0xFF78350F),
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.ecoGoldLight,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFCD34D), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.eco,
            color: AppColors.ecoGoldDark,
            size: 14,
          ),
          const SizedBox(width: 4),
          Text(
            '$points pts',
            style: TextStyle(
              color: AppColors.ecoGoldDark,
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
