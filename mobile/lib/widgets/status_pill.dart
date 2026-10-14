import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../models/waste_report_model.dart';

class StatusPill extends StatelessWidget {
  final ReportStatus status;

  const StatusPill({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    switch (status) {
      case ReportStatus.pending:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
        break;
      case ReportStatus.verified:
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        break;
      case ReportStatus.assigned:
      case ReportStatus.inProgress:
        bg = const Color(0xFFEDE9FE);
        fg = const Color(0xFF6D28D9);
        break;
      case ReportStatus.collected:
        bg = const Color(0xFFCFFAFE);
        fg = const Color(0xFF0E7490);
        break;
      case ReportStatus.completed:
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF047857);
        break;
      case ReportStatus.rejected:
      case ReportStatus.cancelled:
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFB91C1C);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}
