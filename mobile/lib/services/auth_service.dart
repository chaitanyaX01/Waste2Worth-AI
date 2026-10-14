import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null && ApiService().authToken != null;

  Future<void> init() async {
    await ApiService().init();
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('w2w_user_profile');
    if (userJson != null) {
      try {
        _currentUser = UserModel.fromJson(json.decode(userJson));
      } catch (_) {
        _currentUser = null;
      }
    }
    // Refresh current user from backend if token exists
    if (ApiService().authToken != null) {
      try {
        await refreshProfile();
      } catch (_) {
        // Keep cached user if network is offline
      }
    }
  }

  // -------------------------------------------------------------
  // Standard Email & Password Authentication
  // -------------------------------------------------------------
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse(ApiConstants.loginUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email.trim().toLowerCase(),
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final token = data['access_token']?.toString();
      await ApiService().setAuthToken(token);
      return await refreshProfile();
    } else {
      throw _parseAuthError(response);
    }
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    String role = 'CITIZEN',
    String? employeeCode,
    String? serviceArea,
  }) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    final response = await http.post(
      Uri.parse(ApiConstants.registerUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'password': password,
        'phone': cleanPhone,
        'role': role.toUpperCase(),
        if (employeeCode != null) 'employee_code': employeeCode,
        if (serviceArea != null) 'service_area': serviceArea,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      final token = data['access_token']?.toString();
      await ApiService().setAuthToken(token);
      return await refreshProfile();
    } else {
      throw _parseAuthError(response);
    }
  }

  // -------------------------------------------------------------
  // Firebase Authentication (Google Sign-In & Mobile Phone OTP)
  // -------------------------------------------------------------
  Future<UserModel> verifyFirebaseIdToken({
    required String idToken,
    String? name,
    String? email,
    String? phone,
    String? otpCode,
    String? sessionInfo,
    String preferredRole = 'CITIZEN',
  }) async {
    final effectiveToken = idToken.trim().isNotEmpty
        ? idToken.trim()
        : ApiConstants.firebasePhoneVerificationToken;

    final response = await http.post(
      Uri.parse(ApiConstants.firebaseVerifyUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'id_token': effectiveToken,
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (otpCode != null) 'otp_code': otpCode,
        if (sessionInfo != null) 'session_info': sessionInfo,
        'role': preferredRole,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      final token = data['access_token']?.toString();
      await ApiService().setAuthToken(token);
      return await refreshProfile();
    } else {
      throw _parseAuthError(response);
    }
  }

  // -------------------------------------------------------------
  // Profile Management
  // -------------------------------------------------------------
  Future<UserModel> refreshProfile() async {
    final token = ApiService().authToken;
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final response = await http.get(
      Uri.parse(ApiConstants.meUrl),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      _currentUser = UserModel.fromJson(data);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('w2w_user_profile', json.encode(_currentUser!.toJson()));
      return _currentUser!;
    } else {
      throw _parseAuthError(response);
    }
  }

  Future<void> logout() async {
    _currentUser = null;
    await ApiService().setAuthToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('w2w_user_profile');
  }

  Exception _parseAuthError(http.Response response) {
    try {
      final decoded = json.decode(response.body);
      final detail = decoded['detail'] ?? decoded['message'] ?? response.body;
      return Exception(detail.toString());
    } catch (_) {
      return Exception('Authentication failed (HTTP ${response.statusCode})');
    }
  }
}
