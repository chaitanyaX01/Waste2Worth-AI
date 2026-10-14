import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/waste_categories.dart';
import '../../services/api_service.dart';
import '../../widgets/prediction_risk_gauge.dart';

class HotspotsMapScreen extends StatefulWidget {
  const HotspotsMapScreen({super.key});

  @override
  State<HotspotsMapScreen> createState() => _HotspotsMapScreenState();
}

class _HotspotsMapScreenState extends State<HotspotsMapScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _hotspots = [];
  String? _selectedCategory;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadHotspots();
  }

  Future<void> _loadHotspots() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final stats = await ApiService().getAdminDashboardStats();
      final rawHotspots = stats['hotspots'] as List<dynamic>? ?? [];

      final List<Map<String, dynamic>> parsed = [];
      for (final h in rawHotspots) {
        if (h is Map<String, dynamic>) {
          parsed.add(h);
        }
      }

      setState(() {
        _hotspots = parsed;
        _isLoading = false;
      });
    } catch (e) {
      // Fallback to predictive baseline hotspots
      try {
        final pred = await ApiService().getPredictiveRiskData();
        final zones = pred['high_risk_zones'] as List<dynamic>? ?? [];
        final List<Map<String, dynamic>> parsed = [];
        for (final z in zones) {
          if (z is Map<String, dynamic>) parsed.add(z);
        }
        setState(() {
          _hotspots = parsed;
          _isLoading = false;
        });
      } catch (_) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    var displayList = _hotspots;
    if (_selectedCategory != null) {
      displayList = displayList.where((h) {
        final cats = (h['dominant_category'] ?? h['category'] ?? '').toString().toLowerCase();
        return cats.contains(_selectedCategory!.toLowerCase());
      }).toList();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Waste Hotspot Identification'),
      ),
      body: Column(
        children: [
          // Header explanation banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: const Color(0xFFF1F5F9),
            child: const Row(
              children: [
                Icon(Icons.radar_rounded, size: 20, color: AppColors.emeraldPrimary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Identifies repeat waste reporting zones and clusters within ~100m to forecast municipal accumulation pressure.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                  ),
                ),
              ],
            ),
          ),

          // Category Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('All Categories'),
                  selected: _selectedCategory == null,
                  onSelected: (_) => setState(() => _selectedCategory = null),
                ),
                ...WasteCategories.all.map((c) {
                  return Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ChoiceChip(
                      label: Text(c.displayName),
                      selected: _selectedCategory == c.key,
                      onSelected: (_) => setState(() => _selectedCategory = c.key),
                    ),
                  );
                }),
              ],
            ),
          ),
          const Divider(height: 1, color: AppColors.cardBorder),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: AppColors.rejected),
                        ),
                      )
                    : displayList.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.location_off_outlined, size: 48, color: AppColors.textMuted),
                                const SizedBox(height: 12),
                                const Text(
                                  'No active accumulation hotspots',
                                  style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _selectedCategory != null ? 'Try selecting "All Categories".' : 'Submit reports to train hotspot clustering.',
                                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            itemCount: displayList.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final h = displayList[index];
                              final lat = (h['latitude'] as num?)?.toDouble() ?? 37.7749;
                              final lng = (h['longitude'] as num?)?.toDouble() ?? -122.4194;
                              final count = (h['report_count'] as num?)?.toInt() ?? (h['count'] as num?)?.toInt() ?? 1;
                              final cat = (h['dominant_category'] ?? h['primary_category'] ?? 'Mixed waste').toString();

                              // Calculate risk score based on frequency & hazardous category
                              double riskScore = (count * 20.0).clamp(10.0, 100.0);
                              if (cat.toLowerCase().contains('medical') || cat.toLowerCase().contains('e-waste')) {
                                riskScore = (riskScore + 25.0).clamp(0.0, 100.0);
                              }

                              return PredictionRiskGauge(
                                score: riskScore,
                                locationName: h['address']?.toString() ?? 'Sector GPS: ${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}',
                                primaryCategory: cat,
                                unresolvedReports: count,
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
