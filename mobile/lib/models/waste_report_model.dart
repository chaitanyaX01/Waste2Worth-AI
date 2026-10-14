import 'prediction_model.dart';

enum ReportStatus {
  pending,
  verified,
  assigned,
  inProgress,
  collected,
  completed,
  rejected,
  cancelled;

  static ReportStatus fromString(String? val) {
    if (val == null) return ReportStatus.pending;
    switch (val.toUpperCase()) {
      case 'VERIFIED':
        return ReportStatus.verified;
      case 'ASSIGNED':
        return ReportStatus.assigned;
      case 'IN_PROGRESS':
        return ReportStatus.inProgress;
      case 'COLLECTED':
        return ReportStatus.collected;
      case 'COMPLETED':
        return ReportStatus.completed;
      case 'REJECTED':
        return ReportStatus.rejected;
      case 'CANCELLED':
        return ReportStatus.cancelled;
      case 'PENDING':
      default:
        return ReportStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case ReportStatus.pending:
        return 'Pending Review';
      case ReportStatus.verified:
        return 'Verified';
      case ReportStatus.assigned:
        return 'Collector Assigned';
      case ReportStatus.inProgress:
        return 'Collection Started';
      case ReportStatus.collected:
        return 'Waste Collected';
      case ReportStatus.completed:
        return 'Completed';
      case ReportStatus.rejected:
        return 'Declined';
      case ReportStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class WasteReportModel {
  final String id;
  final String reportCode;
  final String imageUrl;
  final String? description;
  final ReportStatus status;
  final double latitude;
  final double longitude;
  final String? address;
  final String? predictedClass;
  final double? confidence;
  final AIPredictionResult? aiPrediction;
  final DateTime createdAt;
  final DateTime? verifiedAt;
  final DateTime? completedAt;
  final String? collectionTaskId;
  final String? collectorName;

  WasteReportModel({
    required this.id,
    required this.reportCode,
    required this.imageUrl,
    this.description,
    required this.status,
    required this.latitude,
    required this.longitude,
    this.address,
    this.predictedClass,
    this.confidence,
    this.aiPrediction,
    required this.createdAt,
    this.verifiedAt,
    this.completedAt,
    this.collectionTaskId,
    this.collectorName,
  });

  factory WasteReportModel.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    final lat = location != null
        ? (location['latitude'] as num?)?.toDouble() ?? 0.0
        : (json['latitude'] as num?)?.toDouble() ?? 0.0;
    final lng = location != null
        ? (location['longitude'] as num?)?.toDouble() ?? 0.0
        : (json['longitude'] as num?)?.toDouble() ?? 0.0;
    final addr = location != null ? location['address']?.toString() : json['address']?.toString();

    final aiPredRaw = json['ai_prediction'] as Map<String, dynamic>?;
    AIPredictionResult? aiResult;
    String? predClass = json['predicted_class']?.toString();
    double? conf = (json['confidence'] as num?)?.toDouble();

    if (aiPredRaw != null) {
      aiResult = AIPredictionResult.fromJson(aiPredRaw);
      predClass ??= aiResult.predictedClass;
      conf ??= aiResult.confidence;
    }

    return WasteReportModel(
      id: json['id']?.toString() ?? '',
      reportCode: json['report_code']?.toString() ?? 'W2W-Report',
      imageUrl: json['image_url']?.toString() ?? '',
      description: json['description']?.toString(),
      status: ReportStatus.fromString(json['status']?.toString()),
      latitude: lat,
      longitude: lng,
      address: addr,
      predictedClass: predClass,
      confidence: conf,
      aiPrediction: aiResult,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      verifiedAt: json['verified_at'] != null
          ? DateTime.tryParse(json['verified_at'].toString())
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.tryParse(json['completed_at'].toString())
          : null,
      collectionTaskId: json['collection_task_id']?.toString(),
      collectorName: json['collector_name']?.toString(),
    );
  }
}
