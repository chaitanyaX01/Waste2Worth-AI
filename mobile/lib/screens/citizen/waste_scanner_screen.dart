import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/waste_categories.dart';
import '../../models/prediction_model.dart';
import '../../services/api_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/waste_category_card.dart';
import 'report_waste_screen.dart';

class WasteScannerScreen extends StatefulWidget {
  const WasteScannerScreen({super.key});

  @override
  State<WasteScannerScreen> createState() => _WasteScannerScreenState();
}

class _WasteScannerScreenState extends State<WasteScannerScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  bool _isAnalyzing = false;
  AIPredictionResult? _predictionResult;
  String? _correctedCategory;
  String? _errorMessage;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 85,
      );

      if (picked != null) {
        setState(() {
          _selectedImage = File(picked.path);
          _predictionResult = null;
          _correctedCategory = null;
          _errorMessage = null;
        });
        await _runClassification();
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Could not access camera or gallery: ${e.toString()}';
      });
    }
  }

  Future<void> _runClassification() async {
    if (_selectedImage == null) return;

    setState(() {
      _isAnalyzing = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService().classifyWasteImage(_selectedImage!);
      setState(() {
        _predictionResult = result;
        _correctedCategory = result.predictedClass;
        _isAnalyzing = false;
      });
    } catch (e) {
      setState(() {
        _isAnalyzing = false;
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Waste Scanner'),
        actions: [
          if (_selectedImage != null)
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: () => _pickImage(ImageSource.camera),
              tooltip: 'Scan New Item',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Disclaimer regarding ML model validation accuracy
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppColors.textSecondary),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'ResNet-18 model trained on 7 waste categories (val accuracy: 87.9%). Review classification and adjust if needed.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Image Preview or Empty Placeholder
            if (_selectedImage != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    kIsWeb
                        ? Image.network(
                            _selectedImage!.path,
                            width: double.infinity,
                            height: 240,
                            fit: BoxFit.cover,
                          )
                        : Image.file(
                            _selectedImage!,
                            width: double.infinity,
                            height: 240,
                            fit: BoxFit.cover,
                          ),
                    if (_isAnalyzing)
                      Container(
                        width: double.infinity,
                        height: 240,
                        color: Colors.black.withOpacity(0.5),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: Colors.white),
                            SizedBox(height: 12),
                            Text(
                              'Running ResNet-18 Inference...',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder, style: BorderStyle.solid),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: const BoxDecoration(
                        color: AppColors.emeraldLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.camera_alt_outlined,
                        size: 36,
                        color: AppColors.emeraldPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Capture or Select Waste Photograph',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'ResNet-18 will classify cardboard, e-waste, glass, medical, metal, paper, or plastic',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),

            // Camera / Gallery Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: const Text('Open Camera'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Photo Gallery'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            if (_errorMessage != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF87171)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFB91C1C), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Color(0xFFB91C1C),
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Results Section
            if (_predictionResult != null) ...[
              const Text(
                'Classification Result',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),

              WasteCategoryCard(
                categoryKey: _correctedCategory ?? _predictionResult!.predictedClass,
                confidencePercent: _predictionResult!.confidencePercent,
                showFullGuidance: true,
              ),
              const SizedBox(height: 16),

              // Manual Correction Dropdown
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Category Verification',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'If the AI model misclassified this item, adjust the category manually:',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        value: _correctedCategory,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        ),
                        items: WasteCategories.all.map((c) {
                          return DropdownMenuItem(
                            value: c.key,
                            child: Row(
                              children: [
                                Icon(c.icon, size: 18, color: c.color),
                                const SizedBox(width: 8),
                                Text(c.displayName),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _correctedCategory = val);
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Probabilities Breakdown
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ResNet-18 Probability Breakdown (7 Classes)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      ..._predictionResult!.allPredictions.entries.map((entry) {
                        final pct = (entry.value * 100).clamp(0.0, 100.0);
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    entry.key.toUpperCase(),
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    '${pct.toStringAsFixed(1)}%',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: (pct / 100).clamp(0.0, 1.0),
                                minHeight: 6,
                                backgroundColor: AppColors.cardBorder,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  entry.key.toLowerCase() == _predictionResult!.predictedClass.toLowerCase()
                                      ? AppColors.emeraldPrimary
                                      : AppColors.textMuted,
                                ),
                              ),
                            ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Button to proceed with report
              CustomButton(
                text: 'Submit as Waste Incident (+10 EcoPoints)',
                icon: Icons.send_rounded,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ReportWasteScreen(
                        initialImage: _selectedImage,
                        initialCategory: _correctedCategory ?? _predictionResult!.predictedClass,
                        initialConfidence: _predictionResult!.confidence,
                        initialProbabilities: _predictionResult!.allPredictions,
                      ),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
