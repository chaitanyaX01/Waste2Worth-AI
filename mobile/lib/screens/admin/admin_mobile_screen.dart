import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/waste_report_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/status_pill.dart';

class AdminMobileScreen extends StatefulWidget {
  const AdminMobileScreen({super.key});

  @override
  State<AdminMobileScreen> createState() => _AdminMobileScreenState();
}

class _AdminMobileScreenState extends State<AdminMobileScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _stats;
  List<WasteReportModel> _pendingReports = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadAdminData();
  }

  Future<void> _loadAdminData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final statsData = await ApiService().getAdminDashboardStats();
      
      // Load pending reports
      final myReports = await ApiService().getMyReports();
      final pending = myReports.where((r) => r.status == ReportStatus.pending).toList();

      setState(() {
        _stats = statsData;
        _pendingReports = pending;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _moderateReport(WasteReportModel report, bool approve) async {
    try {
      await ApiService().verifyReport(
        reportId: report.id,
        status: approve ? 'VERIFIED' : 'REJECTED',
        comment: approve ? 'Verified authentic waste report (+20 pts to citizen).' : 'Report declined by moderation team.',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(approve ? 'Report verified & citizen awarded points!' : 'Report rejected.')),
      );
      await _loadAdminData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: AppColors.rejected),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Operations Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadAdminData,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAdminData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Admin Header
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppColors.emeraldPrimary,
                            child: Icon(Icons.admin_panel_settings, color: Colors.white),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.name ?? 'Municipal Admin',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'System Moderation, Dispatches & EcoPoints Ledger',
                                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Metrics Grid
                    const Text(
                      'Real System Telemetry',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 10),

                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.8,
                      children: [
                        _buildMetricCard(
                          label: 'Total Incidents',
                          value: '${_stats?['total_reports'] ?? 0}',
                          color: AppColors.emeraldPrimary,
                          icon: Icons.list_alt,
                        ),
                        _buildMetricCard(
                          label: 'Pending Moderation',
                          value: '${_stats?['pending_reports'] ?? 0}',
                          color: AppColors.pending,
                          icon: Icons.hourglass_top,
                        ),
                        _buildMetricCard(
                          label: 'Completed Cleanups',
                          value: '${_stats?['completed_reports'] ?? 0}',
                          color: AppColors.completed,
                          icon: Icons.check_circle_outline,
                        ),
                        _buildMetricCard(
                          label: 'EcoPoints Issued',
                          value: '${_stats?['total_points_issued'] ?? 0}',
                          color: AppColors.ecoGoldDark,
                          icon: Icons.eco,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Pending Moderation Queue
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Moderation Queue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                        Text(
                          '${_pendingReports.length} pending',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (_pendingReports.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(20),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: const Center(
                          child: Text(
                            'All reported incidents have been reviewed!',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _pendingReports.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _pendingReports[index];
                          return Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        item.reportCode,
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                      ),
                                      StatusPill(status: item.status),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Category: ${item.predictedClass?.toUpperCase() ?? "UNKNOWN"}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.emeraldDark),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.address ?? 'GPS: ${item.latitude.toStringAsFixed(4)}, ${item.longitude.toStringAsFixed(4)}',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () => _moderateReport(item, true),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.completed,
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                          ),
                                          child: const Text('Verify (+20 pts)'),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () => _moderateReport(item, false),
                                          style: OutlinedButton.styleFrom(
                                            foregroundColor: AppColors.rejected,
                                            side: const BorderSide(color: AppColors.rejected),
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                          ),
                                          child: const Text('Decline'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetricCard({required String label, required String value, required Color color, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color),
              ),
              Icon(icon, size: 20, color: color.withValues(alpha: 0.6)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
