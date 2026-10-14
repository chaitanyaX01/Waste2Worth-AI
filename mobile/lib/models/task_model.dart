import 'waste_report_model.dart';

enum TaskPriority {
  low,
  medium,
  high,
  urgent;

  static TaskPriority fromString(String? val) {
    if (val == null) return TaskPriority.medium;
    switch (val.toUpperCase()) {
      case 'LOW':
        return TaskPriority.low;
      case 'HIGH':
        return TaskPriority.high;
      case 'URGENT':
        return TaskPriority.urgent;
      case 'MEDIUM':
      default:
        return TaskPriority.medium;
    }
  }

  String get displayName => name.toUpperCase();
}

enum CollectionTaskStatus {
  assigned,
  inProgress,
  collected,
  completed,
  cancelled;

  static CollectionTaskStatus fromString(String? val) {
    if (val == null) return CollectionTaskStatus.assigned;
    switch (val.toUpperCase()) {
      case 'IN_PROGRESS':
        return CollectionTaskStatus.inProgress;
      case 'COLLECTED':
        return CollectionTaskStatus.collected;
      case 'COMPLETED':
        return CollectionTaskStatus.completed;
      case 'CANCELLED':
        return CollectionTaskStatus.cancelled;
      case 'ASSIGNED':
      default:
        return CollectionTaskStatus.assigned;
    }
  }

  String get displayName {
    switch (this) {
      case CollectionTaskStatus.assigned:
        return 'Assigned';
      case CollectionTaskStatus.inProgress:
        return 'In Progress';
      case CollectionTaskStatus.collected:
        return 'Collected';
      case CollectionTaskStatus.completed:
        return 'Completed';
      case CollectionTaskStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class EvidenceModel {
  final String id;
  final String evidenceType; // BEFORE or AFTER
  final String imageUrl;
  final String? notes;
  final DateTime createdAt;

  EvidenceModel({
    required this.id,
    required this.evidenceType,
    required this.imageUrl,
    this.notes,
    required this.createdAt,
  });

  factory EvidenceModel.fromJson(Map<String, dynamic> json) {
    return EvidenceModel(
      id: json['id']?.toString() ?? '',
      evidenceType: json['evidence_type']?.toString() ?? 'BEFORE',
      imageUrl: json['image_url']?.toString() ?? '',
      notes: json['notes']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class CollectionTaskModel {
  final String id;
  final String reportId;
  final String? collectorId;
  final TaskPriority priority;
  final CollectionTaskStatus status;
  final WasteReportModel? report;
  final DateTime assignedAt;
  final DateTime? startedAt;
  final DateTime? collectedAt;
  final DateTime? completedAt;
  final List<EvidenceModel> evidence;

  CollectionTaskModel({
    required this.id,
    required this.reportId,
    this.collectorId,
    required this.priority,
    required this.status,
    this.report,
    required this.assignedAt,
    this.startedAt,
    this.collectedAt,
    this.completedAt,
    this.evidence = const [],
  });

  factory CollectionTaskModel.fromJson(Map<String, dynamic> json) {
    WasteReportModel? rep;
    if (json['report'] != null && json['report'] is Map<String, dynamic>) {
      rep = WasteReportModel.fromJson(json['report']);
    }

    final rawEvidence = json['evidence'] as List<dynamic>? ?? [];
    final parsedEvidence = rawEvidence
        .whereType<Map<String, dynamic>>()
        .map((e) => EvidenceModel.fromJson(e))
        .toList();

    return CollectionTaskModel(
      id: json['id']?.toString() ?? '',
      reportId: json['report_id']?.toString() ?? '',
      collectorId: json['collector_id']?.toString(),
      priority: TaskPriority.fromString(json['priority']?.toString()),
      status: CollectionTaskStatus.fromString(json['status']?.toString()),
      report: rep,
      assignedAt: json['assigned_at'] != null
          ? DateTime.tryParse(json['assigned_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      startedAt: json['started_at'] != null
          ? DateTime.tryParse(json['started_at'].toString())
          : null,
      collectedAt: json['collected_at'] != null
          ? DateTime.tryParse(json['collected_at'].toString())
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.tryParse(json['completed_at'].toString())
          : null,
      evidence: parsedEvidence,
    );
  }
}
