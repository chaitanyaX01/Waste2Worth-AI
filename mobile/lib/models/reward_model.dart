class RewardModel {
  final String id;
  final String name;
  final String description;
  final int pointsRequired;
  final bool isActive;

  RewardModel({
    required this.id,
    required this.name,
    required this.description,
    required this.pointsRequired,
    required this.isActive,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      pointsRequired: json['points_required'] is int
          ? json['points_required']
          : int.tryParse(json['points_required']?.toString() ?? '0') ?? 0,
      isActive: json['is_active'] ?? true,
    );
  }
}

class RewardTransactionModel {
  final String id;
  final int points;
  final String reason;
  final DateTime createdAt;
  final String? reportId;
  final String? taskId;

  RewardTransactionModel({
    required this.id,
    required this.points,
    required this.reason,
    required this.createdAt,
    this.reportId,
    this.taskId,
  });

  factory RewardTransactionModel.fromJson(Map<String, dynamic> json) {
    return RewardTransactionModel(
      id: json['id']?.toString() ?? '',
      points: json['points'] is int
          ? json['points']
          : int.tryParse(json['points']?.toString() ?? '0') ?? 0,
      reason: json['reason']?.toString() ?? 'EcoPoints Activity',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      reportId: json['report_id']?.toString(),
      taskId: json['task_id']?.toString(),
    );
  }
}

class BadgeModel {
  final String id;
  final String name;
  final String description;
  final String requirement;
  final String icon;
  final bool earned;
  final DateTime? earnedAt;

  BadgeModel({
    required this.id,
    required this.name,
    required this.description,
    required this.requirement,
    required this.icon,
    required this.earned,
    this.earnedAt,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      requirement: json['requirement']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'award',
      earned: json['earned'] ?? false,
      earnedAt: json['earned_at'] != null
          ? DateTime.tryParse(json['earned_at'].toString())
          : null,
    );
  }
}

class RedeemResult {
  final bool success;
  final String voucherCode;
  final int pointsSpent;
  final int remainingBalance;
  final String message;
  final String rewardName;

  RedeemResult({
    required this.success,
    required this.voucherCode,
    required this.pointsSpent,
    required this.remainingBalance,
    required this.message,
    required this.rewardName,
  });

  factory RedeemResult.fromJson(Map<String, dynamic> json) {
    return RedeemResult(
      success: json['success'] ?? true,
      voucherCode: json['voucher_code']?.toString() ?? 'W2W-VOUCHER',
      pointsSpent: json['points_spent'] is int
          ? json['points_spent']
          : int.tryParse(json['points_spent']?.toString() ?? '0') ?? 0,
      remainingBalance: json['remaining_balance'] is int
          ? json['remaining_balance']
          : int.tryParse(json['remaining_balance']?.toString() ?? '0') ?? 0,
      message: json['message']?.toString() ?? 'Reward successfully redeemed!',
      rewardName: json['reward_name']?.toString() ?? 'EcoReward',
    );
  }
}
