import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  void _showBackendUrlDialog(BuildContext context) {
    final controller = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend API Server URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'For Android Emulator use: http://10.0.2.2:8000\nFor physical phone use your PC local Wi-Fi IP (e.g. http://192.168.1.50:8000)',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              decoration: const InputDecoration(labelText: 'API Base URL'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newUrl = controller.text.trim();
              await ApiConstants.setBaseUrl(newUrl);
              if (context.mounted) {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Updated Backend URL to: ${ApiConstants.baseUrl}')),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          children: [
            // User Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.emeraldPrimary.withOpacity(0.15),
                      child: Text(
                        (user?.name.isNotEmpty == true) ? user!.name[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: AppColors.emeraldPrimary,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Citizen',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? '',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.emeraldLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              user?.role.displayTitle.toUpperCase() ?? 'CITIZEN',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.emeraldDark,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Profile Details List
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.phone_iphone_rounded, color: AppColors.emeraldPrimary),
                    title: const Text('Verified Mobile Phone', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(user?.phone ?? 'Not linked', style: const TextStyle(fontSize: 13)),
                    trailing: const Icon(Icons.verified, color: AppColors.emeraldPrimary, size: 20),
                  ),
                  const Divider(height: 1, indent: 56),
                  ListTile(
                    leading: const Icon(Icons.eco_rounded, color: AppColors.ecoGold),
                    title: const Text('EcoPoints Balance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text('${user?.pointsBalance ?? 0} verified reward points', style: const TextStyle(fontSize: 13)),
                  ),
                  const Divider(height: 1, indent: 56),
                  ListTile(
                    leading: const Icon(Icons.security_rounded, color: AppColors.textSecondary),
                    title: const Text('Account Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(user?.isActive == true ? 'Active & Good Standing' : 'Suspended', style: const TextStyle(fontSize: 13)),
                  ),
                  const Divider(height: 1, indent: 56),
                  ListTile(
                    leading: const Icon(Icons.settings_ethernet_rounded, color: AppColors.textSecondary),
                    title: const Text('Backend API Server Config', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    subtitle: Text(ApiConstants.baseUrl, style: const TextStyle(fontSize: 12)),
                    trailing: const Icon(Icons.edit, size: 18),
                    onTap: () => _showBackendUrlDialog(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            CustomButton(
              text: 'Sign Out',
              isOutlined: true,
              backgroundColor: AppColors.rejected,
              textColor: AppColors.rejected,
              icon: Icons.logout_rounded,
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sign Out'),
                    content: const Text('Are you sure you want to sign out of Waste2Worth?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.rejected),
                        onPressed: () {
                          Navigator.pop(ctx);
                          auth.logout();
                        },
                        child: const Text('Sign Out'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
