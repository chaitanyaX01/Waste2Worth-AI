import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../models/waste_report_model.dart';
import '../../providers/reports_provider.dart';
import '../../widgets/status_pill.dart';
import '../../widgets/waste_category_card.dart';

class MyReportsTab extends StatefulWidget {
  const MyReportsTab({super.key});

  @override
  State<MyReportsTab> createState() => _MyReportsTabState();
}

class _MyReportsTabState extends State<MyReportsTab> {
  int _selectedFilter = 0; // 0: All, 1: Pending, 2: In Progress, 3: Completed

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().fetchMyReports();
    });
  }

  void _showReportDetail(WasteReportModel report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.cardBorder,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    report.reportCode,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  StatusPill(status: report.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Submitted on ${report.createdAt.toLocal().toString().split('.').first}',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),

              if (report.imageUrl.isNotEmpty) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    ApiConstants.resolveImageUrl(report.imageUrl),
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 160,
                      color: const Color(0xFFF1F5F9),
                      child: const Center(
                        child: Icon(Icons.broken_image_outlined, size: 40, color: AppColors.textMuted),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (report.predictedClass != null) ...[
                WasteCategoryCard(
                  categoryKey: report.predictedClass!,
                  confidencePercent: report.confidence != null ? report.confidence! * 100 : null,
                  showFullGuidance: true,
                ),
                const SizedBox(height: 16),
              ],

              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Incident Information', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 10),
                      _buildInfoRow('GPS Coordinates', '${report.latitude.toStringAsFixed(4)}, ${report.longitude.toStringAsFixed(4)}'),
                      if (report.address != null) ...[
                        const SizedBox(height: 8),
                        _buildInfoRow('Location', report.address!),
                      ],
                      if (report.description != null) ...[
                        const SizedBox(height: 8),
                        _buildInfoRow('Description', report.description!),
                      ],
                      if (report.collectorName != null) ...[
                        const SizedBox(height: 8),
                        _buildInfoRow('Assigned Collector', report.collectorName!),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<ReportsProvider>();
    final all = prov.reports;

    List<WasteReportModel> displayList;
    switch (_selectedFilter) {
      case 1:
        displayList = prov.pendingReports;
        break;
      case 2:
        displayList = prov.activeReports;
        break;
      case 3:
        displayList = prov.completedReports;
        break;
      case 0:
      default:
        displayList = all;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Waste Reports'),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip(0, 'All (${all.length})'),
                const SizedBox(width: 8),
                _buildFilterChip(1, 'Pending (${prov.pendingReports.length})'),
                const SizedBox(width: 8),
                _buildFilterChip(2, 'Active (${prov.activeReports.length})'),
                const SizedBox(width: 8),
                _buildFilterChip(3, 'Completed (${prov.completedReports.length})'),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.cardBorder),

          Expanded(
            child: prov.isLoading
                ? const Center(child: CircularProgressIndicator())
                : displayList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.inbox_outlined, size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            const Text(
                              'No reports in this view',
                              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _selectedFilter == 0 ? 'File your first report to earn EcoPoints.' : 'Check other tabs.',
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        itemCount: displayList.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = displayList[index];
                          return InkWell(
                            onTap: () => _showReportDetail(item),
                            borderRadius: BorderRadius.circular(16),
                            child: Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: item.imageUrl.isNotEmpty
                                          ? Image.network(
                                              ApiConstants.resolveImageUrl(item.imageUrl),
                                              width: 52,
                                              height: 52,
                                              fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => Container(
                                                width: 52,
                                                height: 52,
                                                color: AppColors.emeraldLight,
                                                child: const Icon(Icons.delete_outline, color: AppColors.emeraldPrimary),
                                              ),
                                            )
                                          : Container(
                                              width: 52,
                                              height: 52,
                                              color: AppColors.emeraldLight,
                                              child: const Icon(Icons.delete_outline, color: AppColors.emeraldPrimary),
                                            ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                item.reportCode,
                                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                              ),
                                              if (item.predictedClass != null) ...[
                                                const SizedBox(width: 6),
                                                Text(
                                                  '• ${item.predictedClass!.toUpperCase()}',
                                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            item.address ?? 'GPS: ${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}',
                                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    StatusPill(status: item.status),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final selected = _selectedFilter == index;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      selectedColor: AppColors.emeraldLight,
      onSelected: (_) => setState(() => _selectedFilter = index),
    );
  }
}
