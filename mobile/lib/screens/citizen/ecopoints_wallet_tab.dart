import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/rewards_provider.dart';
import 'rewards_catalog_screen.dart';

class EcopointsWalletTab extends StatefulWidget {
  const EcopointsWalletTab({super.key});

  @override
  State<EcopointsWalletTab> createState() => _EcopointsWalletTabState();
}

class _EcopointsWalletTabState extends State<EcopointsWalletTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RewardsProvider>().fetchCatalogAndBadges();
      context.read<AuthProvider>().refreshProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final rewardsProv = context.watch<RewardsProvider>();
    final user = auth.user;
    final badges = rewardsProv.badges;

    return Scaffold(
      appBar: AppBar(
        title: const Text('EcoPoints Wallet & Rewards'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            auth.refreshProfile(),
            rewardsProv.fetchCatalogAndBadges(),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Golden Balance Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFCD34D), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.amber.withOpacity(0.18),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.stars_rounded, color: AppColors.ecoGoldDark, size: 24),
                            SizedBox(width: 8),
                            Text(
                              'CORE PRODUCT USP',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.ecoGoldDark,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFCD34D)),
                          ),
                          child: const Text(
                            'AUDITED LEDGER',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ecoGoldDark,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      '${user?.pointsBalance ?? 0}',
                      style: const TextStyle(
                        fontSize: 42,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF78350F),
                        letterSpacing: -1,
                      ),
                    ),
                    const Text(
                      'Verified EcoPoints Available for Civic Redemption',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ecoGoldDark,
                      ),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const RewardsCatalogScreen()),
                        );
                      },
                      icon: const Icon(Icons.redeem_rounded, size: 18),
                      label: const Text('Browse & Redeem Rewards'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF78350F),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Reward Rules Config
              const Text(
                'How EcoPoints Are Awarded',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 10),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildRuleRow(
                        points: '+10 pts',
                        title: 'Valid Waste Report Submitted',
                        desc: 'Awarded immediately upon filing an authentic geo-tagged incident.',
                      ),
                      const Divider(height: 20),
                      _buildRuleRow(
                        points: '+20 pts',
                        title: 'Municipal Verification Confirmation',
                        desc: 'Awarded when administration moderates and verifies report authenticity.',
                      ),
                      const Divider(height: 20),
                      _buildRuleRow(
                        points: '+50 pts',
                        title: 'Cleanup Completed & Documented',
                        desc: 'Awarded upon verified collection with before-and-after photographic evidence.',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Civic Badges
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Earned Civic Badges',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                  Text(
                    '${badges.where((b) => b.earned).length}/${badges.length} unlocked',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              if (rewardsProv.isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
              else
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: badges.map((badge) {
                    return Container(
                      width: (MediaQuery.of(context).size.width - 50) / 2,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: badge.earned ? Colors.white : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: badge.earned ? AppColors.emeraldPrimary.withOpacity(0.4) : AppColors.cardBorder,
                          width: badge.earned ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: badge.earned ? AppColors.emeraldLight : const Color(0xFFE2E8F0),
                                child: Icon(
                                  badge.earned ? Icons.military_tech : Icons.lock_outline,
                                  color: badge.earned ? AppColors.emeraldPrimary : AppColors.textMuted,
                                  size: 18,
                                ),
                              ),
                              if (badge.earned)
                                const Text(
                                  'EARNED',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.emeraldPrimary,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            badge.name,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: badge.earned ? AppColors.textPrimary : AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            badge.requirement,
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRuleRow({required String points, required String title, required String desc}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.emeraldLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            points,
            style: const TextStyle(
              color: AppColors.emeraldDark,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
