import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  bool _isLoading = false;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  UserModel? get user => _authService.currentUser;
  bool get isAuthenticated => _authService.isLoggedIn;
  UserRole get currentRole => user?.role ?? UserRole.citizen;

  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.init();
    } catch (_) {
      // Ignored
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.login(email: email, password: password);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    String role = 'CITIZEN',
    String? employeeCode,
    String? serviceArea,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
        role: role,
        employeeCode: employeeCode,
        serviceArea: serviceArea,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyFirebaseToken({
    required String idToken,
    String? name,
    String? email,
    String? phone,
    String? otpCode,
    String? sessionInfo,
    String role = 'CITIZEN',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _authService.verifyFirebaseIdToken(
        idToken: idToken,
        name: name,
        email: email,
        phone: phone,
        otpCode: otpCode,
        sessionInfo: sessionInfo,
        preferredRole: role,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshProfile() async {
    try {
      await _authService.refreshProfile();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> logout() async {
    await _authService.logout();
    notifyListeners();
  }
}
