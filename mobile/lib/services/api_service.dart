import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../models/user_model.dart';
import '../models/prediction_model.dart';
import '../models/waste_report_model.dart';
import '../models/reward_model.dart';
import '../models/task_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _authToken;

  String? get authToken => _authToken;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('w2w_access_token');
  }

  Future<void> setAuthToken(String? token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString('w2w_access_token', token);
    } else {
      await prefs.remove('w2w_access_token');
    }
  }

  Map<String, String> _headers({bool isJson = true}) {
    final map = <String, String>{};
    if (isJson) {
      map['Content-Type'] = 'application/json';
      map['Accept'] = 'application/json';
    }
    if (_authToken != null) {
      map['Authorization'] = 'Bearer $_authToken';
    }
    return map;
  }

  // -------------------------------------------------------------
  // AI ResNet-18 Prediction (Direct image inference)
  // -------------------------------------------------------------
  Future<AIPredictionResult> classifyWasteImage(File imageFile) async {
    final uri = Uri.parse(ApiConstants.predictUrl);
    final request = http.MultipartRequest('POST', uri);

    final ext = imageFile.path.split('.').last.toLowerCase();
    final mimeSub = (ext == 'png') ? 'png' : (ext == 'webp' ? 'webp' : 'jpeg');

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        contentType: MediaType('image', mimeSub),
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = json.decode(response.body);
      return AIPredictionResult.fromJson(decoded);
    } else {
      throw _parseError(response);
    }
  }

  // -------------------------------------------------------------
  // Citizen Reports
  // -------------------------------------------------------------
  Future<WasteReportModel> submitWasteReport({
    required File imageFile,
    required double latitude,
    required double longitude,
    String? address,
    String? description,
    String? predictedClass,
    double? confidence,
    Map<String, double>? classProbabilities,
  }) async {
    final uri = Uri.parse(ApiConstants.citizenReportsUrl);
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_headers(isJson: false));

    final ext = imageFile.path.split('.').last.toLowerCase();
    final mimeSub = (ext == 'png') ? 'png' : 'jpeg';

    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        imageFile.path,
        contentType: MediaType('image', mimeSub),
      ),
    );

    request.fields['latitude'] = latitude.toString();
    request.fields['longitude'] = longitude.toString();
    if (address != null && address.isNotEmpty) {
      request.fields['address'] = address;
    }
    if (description != null && description.isNotEmpty) {
      request.fields['description'] = description;
    }
    if (predictedClass != null) {
      request.fields['predicted_class'] = predictedClass;
    }
    if (confidence != null) {
      request.fields['confidence'] = confidence.toString();
    }
    if (classProbabilities != null) {
      request.fields['class_probabilities_json'] = json.encode(classProbabilities);
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = json.decode(response.body);
      return WasteReportModel.fromJson(decoded);
    } else {
      throw _parseError(response);
    }
  }

  Future<List<WasteReportModel>> getMyReports() async {
    final response = await http.get(
      Uri.parse(ApiConstants.citizenReportsUrl),
      headers: _headers(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => WasteReportModel.fromJson(item)).toList();
    } else {
      throw _parseError(response);
    }
  }

  // -------------------------------------------------------------
  // Rewards & EcoPoints
  // -------------------------------------------------------------
  Future<List<RewardModel>> getRewardsCatalog() async {
    final response = await http.get(
      Uri.parse(ApiConstants.citizenRewardsUrl),
      headers: _headers(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => RewardModel.fromJson(item)).toList();
    } else {
      throw _parseError(response);
    }
  }

  Future<RedeemResult> redeemReward(String rewardId) async {
    final uri = Uri.parse('${ApiConstants.citizenRewardsUrl}/$rewardId/redeem');
    final response = await http.post(uri, headers: _headers());

    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      return RedeemResult.fromJson(decoded);
    } else {
      throw _parseError(response);
    }
  }

  Future<List<BadgeModel>> getCitizenBadges() async {
    final response = await http.get(
      Uri.parse(ApiConstants.citizenBadgesUrl),
      headers: _headers(),
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => BadgeModel.fromJson(item)).toList();
    } else {
      throw _parseError(response);
    }
  }

  // -------------------------------------------------------------
  // Collector Tasks
  // -------------------------------------------------------------
  Future<List<CollectionTaskModel>> getCollectorTasks({String? status}) async {
    var url = ApiConstants.collectorTasksUrl;
    if (status != null && status.isNotEmpty) {
      url += '?status_filter=$status';
    }
    final response = await http.get(Uri.parse(url), headers: _headers());

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => CollectionTaskModel.fromJson(item)).toList();
    } else {
      throw _parseError(response);
    }
  }

  Future<CollectionTaskModel> updateTaskStatus({
    required String taskId,
    required String status,
    String? comment,
  }) async {
    final uri = Uri.parse('${ApiConstants.collectorTasksUrl}/$taskId/status');
    final response = await http.patch(
      uri,
      headers: _headers(),
      body: json.encode({
        'status': status,
        if (comment != null) 'comment': comment,
      }),
    );

    if (response.statusCode == 200) {
      return CollectionTaskModel.fromJson(json.decode(response.body));
    } else {
      throw _parseError(response);
    }
  }

  Future<EvidenceModel> uploadCollectionEvidence({
    required String taskId,
    required File imageFile,
    required String evidenceType, // BEFORE or AFTER
    String? notes,
  }) async {
    final uri = Uri.parse('${ApiConstants.collectorTasksUrl}/$taskId/evidence');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_headers(isJson: false));

    request.files.add(
      await http.MultipartFile.fromPath('file', imageFile.path),
    );
    request.fields['evidence_type'] = evidenceType;
    if (notes != null) {
      request.fields['notes'] = notes;
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return EvidenceModel.fromJson(json.decode(response.body));
    } else {
      throw _parseError(response);
    }
  }

  // -------------------------------------------------------------
  // Admin Operations
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> getAdminDashboardStats() async {
    final response = await http.get(
      Uri.parse(ApiConstants.adminDashboardStatsUrl),
      headers: _headers(),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as Map<String, dynamic>;
    } else {
      throw _parseError(response);
    }
  }

  Future<WasteReportModel> verifyReport({
    required String reportId,
    required String status, // VERIFIED or REJECTED
    String? comment,
  }) async {
    final uri = Uri.parse('${ApiConstants.adminReportsUrl}/$reportId/verify');
    final response = await http.patch(
      uri,
      headers: _headers(),
      body: json.encode({
        'status': status,
        if (comment != null) 'comment': comment,
      }),
    );

    if (response.statusCode == 200) {
      return WasteReportModel.fromJson(json.decode(response.body));
    } else {
      throw _parseError(response);
    }
  }

  Future<CollectionTaskModel> assignCollector({
    required String reportId,
    required String collectorId,
    String priority = 'MEDIUM',
  }) async {
    final uri = Uri.parse('${ApiConstants.adminAssignTaskUrl}?report_id=$reportId');
    final response = await http.post(
      uri,
      headers: _headers(),
      body: json.encode({
        'collector_id': collectorId,
        'priority': priority,
      }),
    );

    if (response.statusCode == 200) {
      return CollectionTaskModel.fromJson(json.decode(response.body));
    } else {
      throw _parseError(response);
    }
  }

  // -------------------------------------------------------------
  // Predictive Waste Management & Hotspots
  // -------------------------------------------------------------
  Future<Map<String, dynamic>> getPredictiveRiskData() async {
    final response = await http.get(
      Uri.parse(ApiConstants.predictiveRiskUrl),
      headers: _headers(),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as Map<String, dynamic>;
    } else {
      // Fallback baseline for graceful degradation
      return {
        'status': 'baseline',
        'scoring_model': 'Accumulation Risk Heuristic v1.2',
        'risk_factors': [
          {'factor': 'Unresolved report backlog', 'weight': 0.40},
          {'factor': 'Repeated reports frequency (<500m)', 'weight': 0.30},
          {'factor': 'Hazardous category weighting', 'weight': 0.20},
          {'factor': 'Collection latency duration', 'weight': 0.10},
        ],
        'high_risk_zones': []
      };
    }
  }

  // Helper error parser
  Exception _parseError(http.Response response) {
    try {
      final decoded = json.decode(response.body);
      final detail = decoded['detail'] ?? decoded['message'] ?? response.body;
      return Exception(detail.toString());
    } catch (_) {
      return Exception('HTTP Error ${response.statusCode}: ${response.reasonPhrase}');
    }
  }
}
