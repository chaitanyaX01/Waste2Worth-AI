import 'package:flutter/material.dart';
import 'app_colors.dart';

class WasteCategoryInfo {
  final String key;
  final String displayName;
  final IconData icon;
  final Color color;
  final bool isHazardous;
  final String safetyGuidance;
  final String recyclingInstructions;

  const WasteCategoryInfo({
    required this.key,
    required this.displayName,
    required this.icon,
    required this.color,
    required this.isHazardous,
    required this.safetyGuidance,
    required this.recyclingInstructions,
  });
}

class WasteCategories {
  static const List<WasteCategoryInfo> all = [
    WasteCategoryInfo(
      key: 'cardboard',
      displayName: 'Cardboard',
      icon: Icons.inventory_2_outlined,
      color: AppColors.cardboard,
      isHazardous: false,
      safetyGuidance: 'Safe to handle. Keep dry and flatten boxes to optimize transport volume.',
      recyclingInstructions: 'Remove adhesive tape, collapse cardboard cartons, and place in brown paper recycling bin.',
    ),
    WasteCategoryInfo(
      key: 'e-waste',
      displayName: 'Electronic Waste',
      icon: Icons.devices_other_outlined,
      color: AppColors.ewaste,
      isHazardous: true,
      safetyGuidance: 'CAUTION: Contains heavy metals & lithium components. Do not puncture, disassemble, or incinerate. Authorized municipal collectors will safely recover components.',
      recyclingInstructions: 'Deposit at certified civic electronic recycling kiosks or request dedicated municipal e-waste pickup.',
    ),
    WasteCategoryInfo(
      key: 'glass',
      displayName: 'Glass',
      icon: Icons.wine_bar_outlined,
      color: AppColors.glass,
      isHazardous: false,
      safetyGuidance: 'Handle carefully to prevent breakage. Do not pick up sharp broken shards with bare hands.',
      recyclingInstructions: 'Rinse containers clean, remove non-glass caps, and segregate by color if requested locally.',
    ),
    WasteCategoryInfo(
      key: 'medical',
      displayName: 'Medical Waste',
      icon: Icons.medical_services_outlined,
      color: AppColors.medical,
      isHazardous: true,
      safetyGuidance: 'BIOHAZARD WARNING: High infection risk. DO NOT TOUCH or handle directly. Keep distance and notify municipal hazardous collection immediately.',
      recyclingInstructions: 'Dedicated bio-medical collection protocol required. Handled exclusively by authorized hazardous containment teams.',
    ),
    WasteCategoryInfo(
      key: 'metal',
      displayName: 'Metal',
      icon: Icons.build_circle_outlined,
      color: AppColors.metal,
      isHazardous: false,
      safetyGuidance: 'Check for sharp jagged edges on cans or sheet metal. Handle with caution.',
      recyclingInstructions: 'Rinse beverage and food cans. Separate aluminum and ferrous steel where facilities allow.',
    ),
    WasteCategoryInfo(
      key: 'paper',
      displayName: 'Paper',
      icon: Icons.description_outlined,
      color: AppColors.paper,
      isHazardous: false,
      safetyGuidance: 'Safe to handle. Keep clean and dry away from food contamination.',
      recyclingInstructions: 'Bundle newspapers, magazines, and office paper for clean pulping recycling.',
    ),
    WasteCategoryInfo(
      key: 'plastic',
      displayName: 'Plastic',
      icon: Icons.recycling_outlined,
      color: AppColors.plastic,
      isHazardous: false,
      safetyGuidance: 'Empty liquid contents. Avoid microplastic degradation in waterways.',
      recyclingInstructions: 'Check resin identification code (PETE, HDPE, PP). Rinse bottles and flatten before disposal.',
    ),
  ];

  static WasteCategoryInfo getInfo(String? categoryKey) {
    if (categoryKey == null) return all.first;
    final normalized = categoryKey.toLowerCase().trim();
    for (final info in all) {
      if (info.key.toLowerCase() == normalized ||
          info.displayName.toLowerCase() == normalized) {
        return info;
      }
    }
    return WasteCategoryInfo(
      key: normalized,
      displayName: normalized.toUpperCase(),
      icon: Icons.delete_outline,
      color: AppColors.emeraldPrimary,
      isHazardous: false,
      safetyGuidance: 'Exercise standard sanitation precautions.',
      recyclingInstructions: 'Segregate recyclable components where possible.',
    );
  }
}
