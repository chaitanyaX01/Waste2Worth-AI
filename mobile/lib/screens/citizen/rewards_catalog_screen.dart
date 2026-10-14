import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/reward_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/rewards_provider.dart';
import '../../widgets/eco_points_badge.dart';

class RewardsCatalogScreen extends StatefulWidget {
  const RewardsCatalogScreen({super.key});

  @override
  State<RewardsCatalogScreen> createState() => _RewardsCatalogScreenState();
}

class _RewardsCatalogScreenState extends State<RewardsCatalogScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RewardsProvider>().fetchCatalogAndBadges();
    });
  }

  Future<void> _handleRedeem(RewardModel reward) async {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    if (user == null) return;

    if (user.pointsBalance < reward.pointsRequired) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Insufficient EcoPoints'),
          content: Text(
            'This reward requires ${reward.pointsRequired} points. Your balance is ${user.pointsBalance} points. Report more waste or participate in cleanups to earn additional points!',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Understood'),
            ),
          ],
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Redeem ${reward.name}?'),
        content: Text(
          'This will spend ${reward.pointsRequired} EcoPoints from your balance to issue a digital redemption coupon.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm Redemption'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final rewardsProv = context.read<RewardsProvider>();
      final result = await rewardsProv.redeemReward(reward.id);

      if (result != null && mounted) {
        // Refresh points balance
        await auth.refreshProfile();

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            icon: const Icon(Icons.celebration_rounded, color: AppColors.ecoGold, size: 48),
            title: const Text('Reward Redeemed!'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  result.message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        result.voucherCode,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 18),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: result.voucherCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Voucher code copied to clipboard!')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Remaining balance: ${result.remainingBalance} EcoPoints',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.emeraldDark),
                ),
              ],
            ),
            actions: [
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Awesome!'),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final rewardsProv = context.watch<RewardsProvider>();
    final user = auth.user;
    final rewards = rewardsProv.rewards;

    return Scaffold(
      appBar: AppBar(
        title: const Text('EcoPoints Rewards Catalog'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Center(
              child: EcoPointsBadge(points: user?.pointsBalance ?? 0),
            ),
          ),
        ],
      ),
      body: rewardsProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              itemCount: rewards.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = rewards[index];
                final canAfford = (user?.pointsBalance ?? 0) >= item.pointsRequired;

                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: canAfford ? AppColors.ecoGoldLight : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.card_giftcard_rounded,
                            color: canAfford ? AppColors.ecoGoldDark : AppColors.textMuted,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.description,
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.35),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${item.pointsRequired} EcoPoints',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.ecoGoldDark,
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: canAfford ? () => _handleRedeem(item) : null,
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                    ),
                                    child: Text(canAfford ? 'Redeem' : 'Need ${item.pointsRequired - (user?.pointsBalance ?? 0)} pts'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
