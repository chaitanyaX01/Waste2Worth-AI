import 'package:shared_preferences/shared_preferences.dart';

class ApiConstants {
  // Default live production backend URL on Render
  static String get defaultBaseUrl {
    return 'https://waste2worth-backend-welr.onrender.com';
  }

  // Active base URL (persisted in SharedPreferences)
  static String baseUrl = defaultBaseUrl;

  static Future<void> loadSavedBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString('custom_backend_url');
      if (saved != null && saved.trim().isNotEmpty) {
        baseUrl = saved.trim();
      }
    } catch (_) {}
  }

  static Future<void> setBaseUrl(String newUrl) async {
    baseUrl = newUrl.trim();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_backend_url', baseUrl);
    } catch (_) {}
  }

  // Authentication endpoints
  static String get loginUrl => '$baseUrl/api/auth/login';
  static String get registerUrl => '$baseUrl/api/auth/register';
  static String get meUrl => '$baseUrl/api/auth/me';
  static String get firebaseVerifyUrl => '$baseUrl/api/auth/firebase-verify';
  static String get sendOtpUrl => '$baseUrl/api/auth/otp/send';
  static String get verifyOtpUrl => '$baseUrl/api/auth/otp/verify';

  // Verified Firebase Console Phone Auth Token
  static const String firebasePhoneVerificationToken =
      'AVweKog0UUoF6ut6NtnePgxjSfRCXCgskReNlBoP8KsWGD09izT5tLiOBOaiej6UMgAPHyUdlh-sdAxPOVsJDzomWBlxywm_ZQvRd9xgVydhy-mPRhPMOSQSuITLmBt7uxDBct6eSLr9fIbhhr_q544-Hw';

  // AI Inference endpoint
  static String get predictUrl => '$baseUrl/api/predict';

  // Citizen endpoints
  static String get citizenReportsUrl => '$baseUrl/api/citizen/reports';
  static String get citizenRewardsUrl => '$baseUrl/api/citizen/rewards';
  static String get citizenBadgesUrl => '$baseUrl/api/citizen/badges';
  static String get redeemRewardUrl => '$baseUrl/api/citizen/rewards';

  // Collector endpoints
  static String get collectorTasksUrl => '$baseUrl/api/collector/tasks';

  // Admin endpoints
  static String get adminDashboardStatsUrl => '$baseUrl/api/admin/dashboard/stats';
  static String get adminReportsUrl => '$baseUrl/api/admin/reports';
  static String get adminCollectorsUrl => '$baseUrl/api/admin/collectors';
  static String get adminAssignTaskUrl => '$baseUrl/api/admin/tasks/assign';

  // Predictive & Hotspot endpoints
  static String get predictiveRiskUrl => '$baseUrl/api/predictions/risk-forecast';
  static String get hotspotsUrl => '$baseUrl/api/predictions/hotspots';

  // Static uploads helper
  static String resolveImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    final cleanPath = path.startsWith('/') ? path : '/$path';
    return '$baseUrl$cleanPath';
  }
}
