import 'package:flutter/foundation.dart';
import '../models/reward_model.dart';
import '../services/api_service.dart';

class RewardsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<RewardModel> _rewards = [];
  List<BadgeModel> _badges = [];
  bool _isLoading = false;
  bool _isRedeeming = false;
  String? _errorMessage;

  List<RewardModel> get rewards => _rewards;
  List<BadgeModel> get badges => _badges;
  bool get isLoading => _isLoading;
  bool get isRedeeming => _isRedeeming;
  String? get errorMessage => _errorMessage;

  Future<void> fetchCatalogAndBadges() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _apiService.getRewardsCatalog(),
        _apiService.getCitizenBadges(),
      ]);

      _rewards = results[0] as List<RewardModel>;
      _badges = results[1] as List<BadgeModel>;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<RedeemResult?> redeemReward(String rewardId) async {
    _isRedeeming = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _apiService.redeemReward(rewardId);
      _isRedeeming = false;
      notifyListeners();
      return result;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isRedeeming = false;
      notifyListeners();
      return null;
    }
  }
}
