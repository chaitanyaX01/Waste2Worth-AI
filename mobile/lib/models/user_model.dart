enum UserRole {
  citizen,
  collector,
  admin;

  static UserRole fromString(String? roleStr) {
    if (roleStr == null) return UserRole.citizen;
    switch (roleStr.toUpperCase()) {
      case 'COLLECTOR':
        return UserRole.collector;
      case 'ADMIN':
        return UserRole.admin;
      case 'CITIZEN':
      default:
        return UserRole.citizen;
    }
  }

  String get displayTitle {
    switch (this) {
      case UserRole.citizen:
        return 'Eco Citizen';
      case UserRole.collector:
        return 'Waste Collector';
      case UserRole.admin:
        return 'System Administrator';
    }
  }
}

class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final UserRole role;
  final int pointsBalance;
  final bool isActive;
  final DateTime? createdAt;
  final String? profileImageUrl;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    required this.pointsBalance,
    required this.isActive,
    this.createdAt,
    this.profileImageUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? json['user_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Citizen',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      role: UserRole.fromString(json['role']?.toString()),
      pointsBalance: json['points_balance'] is int
          ? json['points_balance']
          : int.tryParse(json['points_balance']?.toString() ?? '0') ?? 0,
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      profileImageUrl: json['profile_image_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.name.toUpperCase(),
      'points_balance': pointsBalance,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
      'profile_image_url': profileImageUrl,
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    UserRole? role,
    int? pointsBalance,
    bool? isActive,
    DateTime? createdAt,
    String? profileImageUrl,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      pointsBalance: pointsBalance ?? this.pointsBalance,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
    );
  }
}
