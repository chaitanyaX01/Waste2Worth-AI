import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/waste_report_model.dart';
import '../services/api_service.dart';

class ReportsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<WasteReportModel> _reports = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<WasteReportModel> get reports => _reports;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;

  // Filtered reports
  List<WasteReportModel> get pendingReports =>
      _reports.where((r) => r.status == ReportStatus.pending).toList();

  List<WasteReportModel> get activeReports => _reports
      .where((r) =>
          r.status == ReportStatus.verified ||
          r.status == ReportStatus.assigned ||
          r.status == ReportStatus.inProgress)
      .toList();

  List<WasteReportModel> get completedReports =>
      _reports.where((r) => r.status == ReportStatus.completed || r.status == ReportStatus.collected).toList();

  Future<void> fetchMyReports() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _reports = await _apiService.getMyReports();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<WasteReportModel?> submitReport({
    required File imageFile,
    required double latitude,
    required double longitude,
    String? address,
    String? description,
    String? predictedClass,
    double? confidence,
    Map<String, double>? classProbabilities,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newReport = await _apiService.submitWasteReport(
        imageFile: imageFile,
        latitude: latitude,
        longitude: longitude,
        address: address,
        description: description,
        predictedClass: predictedClass,
        confidence: confidence,
        classProbabilities: classProbabilities,
      );

      _reports.insert(0, newReport);
      _isSubmitting = false;
      notifyListeners();
      return newReport;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }
}
