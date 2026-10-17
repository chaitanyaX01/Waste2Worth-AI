import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../models/task_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/tasks_provider.dart';
import 'task_detail_screen.dart';

class CollectorMainScreen extends StatefulWidget {
  const CollectorMainScreen({super.key});

  @override
  State<CollectorMainScreen> createState() => _CollectorMainScreenState();
}

class _CollectorMainScreenState extends State<CollectorMainScreen> {
  int _selectedFilter = 0; // 0: All, 1: Assigned, 2: In Progress, 3: Completed

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TasksProvider>().fetchTasks();
    });
  }

  Color _getPriorityColor(TaskPriority p) {
    switch (p) {
      case TaskPriority.urgent:
        return AppColors.rejected;
      case TaskPriority.high:
        return AppColors.pending;
      case TaskPriority.medium:
        return AppColors.glass;
      case TaskPriority.low:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final prov = context.watch<TasksProvider>();
    final user = auth.user;
    final all = prov.tasks;

    List<CollectionTaskModel> displayList;
    switch (_selectedFilter) {
      case 1:
        displayList = prov.pendingTasks;
        break;
      case 2:
        displayList = prov.inProgressTasks;
        break;
      case 3:
        displayList = prov.completedTasks;
        break;
      case 0:
      default:
        displayList = all;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Collector Operations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => prov.fetchTasks(),
        child: Column(
          children: [
            // Top Collector Overview Banner
            Container(
              padding: const EdgeInsets.all(16),
              color: AppColors.emeraldPrimary.withValues(alpha: 0.08),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.emeraldPrimary,
                    child: Icon(Icons.local_shipping, color: Colors.white),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'Collector',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Municipal Sanitation & Cleanup Response Unit',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Filter Tabs
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _buildTab(0, 'All Tasks (${all.length})'),
                  const SizedBox(width: 8),
                  _buildTab(1, 'Assigned (${prov.pendingTasks.length})'),
                  const SizedBox(width: 8),
                  _buildTab(2, 'In Progress (${prov.inProgressTasks.length})'),
                  const SizedBox(width: 8),
                  _buildTab(3, 'Completed (${prov.completedTasks.length})'),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.cardBorder),

            Expanded(
              child: prov.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : displayList.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.task_alt_outlined, size: 48, color: AppColors.textMuted),
                              SizedBox(height: 12),
                              Text(
                                'No collection tasks assigned',
                                style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Check back for newly verified community waste reports.',
                                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          itemCount: displayList.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final task = displayList[index];
                            final report = task.report;
                            final pColor = _getPriorityColor(task.priority);

                            return InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => TaskDetailScreen(task: task),
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: pColor.withValues(alpha: 0.12),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: pColor, width: 1),
                                            ),
                                            child: Text(
                                              '${task.priority.displayName} PRIORITY',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: pColor,
                                              ),
                                            ),
                                          ),
                                          Text(
                                            task.status.displayName.toUpperCase(),
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(10),
                                            child: report != null && report.imageUrl.isNotEmpty
                                                ? Image.network(
                                                    ApiConstants.resolveImageUrl(report.imageUrl),
                                                    width: 60,
                                                    height: 60,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (_, __, ___) => Container(
                                                      width: 60,
                                                      height: 60,
                                                      color: AppColors.emeraldLight,
                                                      child: const Icon(Icons.delete_outline, color: AppColors.emeraldPrimary),
                                                    ),
                                                  )
                                                : Container(
                                                    width: 60,
                                                    height: 60,
                                                    color: AppColors.emeraldLight,
                                                    child: const Icon(Icons.delete_outline, color: AppColors.emeraldPrimary),
                                                  ),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  report?.reportCode ?? 'Task ${task.id.substring(0, 8)}',
                                                  style: const TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w800,
                                                    color: AppColors.textPrimary,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                if (report?.predictedClass != null)
                                                  Text(
                                                    'Category: ${report!.predictedClass!.toUpperCase()}',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: AppColors.emeraldDark,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  report?.address ?? 'GPS: ${report?.latitude.toStringAsFixed(4)}, ${report?.longitude.toStringAsFixed(4)}',
                                                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int index, String label) {
    final selected = _selectedFilter == index;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      selectedColor: AppColors.emeraldLight,
      onSelected: (_) => setState(() => _selectedFilter = index),
    );
  }
}
