import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class PredictionsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? _predictionData;
  bool _isLoading = false;
  String? _errorMessage;

  Map<String, dynamic>? get predictionData => _predictionData;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<dynamic> get highRiskHotspots {
    if (_predictionData == null) return [];
    return _predictionData!['high_risk_zones'] as List<dynamic>? ?? [];
  }

  String get scoringModel =>
      _predictionData?['scoring_model']?.toString() ??
      'Transparent Risk-Scoring Baseline';

  Future<void> fetchPredictiveAnalytics() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _predictionData = await _apiService.getPredictiveRiskData();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }
}
