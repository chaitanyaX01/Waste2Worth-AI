import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../models/task_model.dart';
import '../../providers/tasks_provider.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/waste_category_card.dart';

class TaskDetailScreen extends StatefulWidget {
  final CollectionTaskModel task;

  const TaskDetailScreen({super.key, required this.task});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _evidenceImage;
  String _evidenceType = 'AFTER';
  final _notesController = TextEditingController();
  bool _isActionLoading = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _startTask() async {
    setState(() => _isActionLoading = true);
    final prov = context.read<TasksProvider>();
    final ok = await prov.updateTaskStatus(
      taskId: widget.task.id,
      status: 'IN_PROGRESS',
      comment: 'Collector started travel and field collection.',
    );
    setState(() => _isActionLoading = false);
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task status updated to IN PROGRESS')),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _pickEvidence(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (picked != null) {
      setState(() => _evidenceImage = File(picked.path));
    }
  }

  Future<void> _uploadEvidenceAndComplete() async {
    if (_evidenceImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please capture an AFTER completion photograph as collection proof.'),
          backgroundColor: AppColors.rejected,
        ),
      );
      return;
    }

    setState(() => _isActionLoading = true);
    final prov = context.read<TasksProvider>();

    // 1. Upload evidence photo
    final uploaded = await prov.uploadEvidence(
      taskId: widget.task.id,
      imageFile: _evidenceImage!,
      evidenceType: _evidenceType,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : 'Cleanup completed successfully.',
    );

    if (uploaded) {
      // 2. Mark collected
      await prov.updateTaskStatus(
        taskId: widget.task.id,
        status: 'COLLECTED',
        comment: 'Waste collected and photographic evidence submitted for verification.',
      );

      setState(() => _isActionLoading = false);
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            icon: const Icon(Icons.check_circle_rounded, color: AppColors.completed, size: 48),
            title: const Text('Collection Submitted!'),
            content: const Text(
              'Evidence submitted. Municipal admin will review and award applicable cleanup EcoPoints (+50 pts) to participating citizens.',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                child: const Text('Done'),
              ),
            ],
          ),
        );
      }
    } else {
      setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final task = widget.task;
    final report = task.report;

    return Scaffold(
      appBar: AppBar(
        title: Text(report?.reportCode ?? 'Task Details'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and Priority Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.emeraldLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'STATUS: ${task.status.displayName.toUpperCase()}',
                    style: const TextStyle(
                      color: AppColors.emeraldDark,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
                Text(
                  'Priority: ${task.priority.displayName}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Citizen's Report Photograph
            if (report != null && report.imageUrl.isNotEmpty) ...[
              const Text('Reported Incident Photo', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  ApiConstants.resolveImageUrl(report.imageUrl),
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 140,
                    color: const Color(0xFFF1F5F9),
                    child: const Center(child: Icon(Icons.broken_image, size: 36, color: AppColors.textMuted)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Waste Category Safety Notice
            if (report?.predictedClass != null) ...[
              WasteCategoryCard(
                categoryKey: report!.predictedClass!,
                showFullGuidance: true,
              ),
              const SizedBox(height: 16),
            ],

            // Location & Landmarks Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Location Details', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const SizedBox(height: 10),
                    Text(
                      'GPS: ${report?.latitude.toStringAsFixed(6)}, ${report?.longitude.toStringAsFixed(6)}',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    if (report?.address != null) ...[
                      const SizedBox(height: 4),
                      Text(report!.address!, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    ],
                    if (report?.description != null) ...[
                      const SizedBox(height: 8),
                      Text('Notes: ${report!.description!}', style: const TextStyle(fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Action: If Assigned -> Start
            if (task.status == CollectionTaskStatus.assigned) ...[
              CustomButton(
                text: 'Accept & Start Collection',
                icon: Icons.play_arrow_rounded,
                isLoading: _isActionLoading,
                onPressed: _startTask,
              ),
            ],

            // Action: If In Progress -> Upload Evidence & Complete
            if (task.status == CollectionTaskStatus.inProgress) ...[
              const Text(
                'Collection Verification Evidence',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              const Text(
                'Photograph the clean area (AFTER cleanup) to verify resolution for municipal records and EcoPoints issuance.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 12),

              if (_evidenceImage != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: kIsWeb
                      ? Image.network(_evidenceImage!.path, height: 180, width: double.infinity, fit: BoxFit.cover)
                      : Image.file(_evidenceImage!, height: 180, width: double.infinity, fit: BoxFit.cover),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _pickEvidence(ImageSource.camera),
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Capture Proof'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _pickEvidence(ImageSource.gallery),
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Gallery'),
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 16),

              TextField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Field Completion Notes (Optional)',
                  hintText: 'e.g. 5 bags collected, sorted plastic bottles into municipal recovery vehicle.',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 20),

              CustomButton(
                text: 'Submit Cleanup & Verification Proof',
                icon: Icons.check_circle_outline,
                isLoading: _isActionLoading,
                onPressed: _uploadEvidenceAndComplete,
              ),
            ],

            // Existing Evidence List (if completed)
            if (task.evidence.isNotEmpty) ...[
              const SizedBox(height: 20),
              const Text('Submitted Evidence Photos', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 8),
              ...task.evidence.map((ev) {
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.image, color: AppColors.emeraldPrimary),
                    title: Text('${ev.evidenceType} Evidence Proof'),
                    subtitle: Text(ev.notes ?? 'No notes'),
                  ),
                );
              }),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
