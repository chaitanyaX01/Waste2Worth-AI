import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/waste_categories.dart';
import '../../providers/auth_provider.dart';
import '../../providers/reports_provider.dart';
import '../../services/location_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/waste_category_card.dart';

class ReportWasteScreen extends StatefulWidget {
  final File? initialImage;
  final String? initialCategory;
  final double? initialConfidence;
  final Map<String, double>? initialProbabilities;

  const ReportWasteScreen({
    super.key,
    this.initialImage,
    this.initialCategory,
    this.initialConfidence,
    this.initialProbabilities,
  });

  @override
  State<ReportWasteScreen> createState() => _ReportWasteScreenState();
}

class _ReportWasteScreenState extends State<ReportWasteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descController = TextEditingController();
  final _addressController = TextEditingController();
  final _latController = TextEditingController(text: '37.7749');
  final _lngController = TextEditingController(text: '-122.4194');

  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  String _selectedCategory = 'plastic';
  double? _confidence;
  Map<String, double>? _probabilities;

  bool _isFetchingGps = false;
  String? _locationStatus;

  @override
  void initState() {
    super.initState();
    _imageFile = widget.initialImage;
    if (widget.initialCategory != null) {
      _selectedCategory = widget.initialCategory!;
    }
    _confidence = widget.initialConfidence;
    _probabilities = widget.initialProbabilities;

    _acquireGpsLocation();
  }

  @override
  void dispose() {
    _descController.dispose();
    _addressController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _acquireGpsLocation() async {
    setState(() {
      _isFetchingGps = true;
      _locationStatus = 'Acquiring GPS coordinates...';
    });

    try {
      final loc = await LocationService.getCurrentLocation();
      setState(() {
        _latController.text = loc.latitude.toStringAsFixed(6);
        _lngController.text = loc.longitude.toStringAsFixed(6);
        _locationStatus = 'GPS locked (${loc.accuracy != null ? "±${loc.accuracy!.toInt()}m" : "Active"})';
        _isFetchingGps = false;
      });
    } catch (e) {
      setState(() {
        _locationStatus = 'GPS unavailable: ${e.toString().replaceAll("Exception: ", "")}. Using default coords.';
        _isFetchingGps = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (picked != null) {
      setState(() {
        _imageFile = File(picked.path);
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please take or upload a waste photograph.'),
          backgroundColor: AppColors.rejected,
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final lat = double.tryParse(_latController.text) ?? 37.7749;
    final lng = double.tryParse(_lngController.text) ?? -122.4194;

    final prov = context.read<ReportsProvider>();
    final newReport = await prov.submitReport(
      imageFile: _imageFile!,
      latitude: lat,
      longitude: lng,
      address: _addressController.text.trim().isNotEmpty ? _addressController.text.trim() : null,
      description: _descController.text.trim().isNotEmpty ? _descController.text.trim() : null,
      predictedClass: _selectedCategory,
      confidence: _confidence,
      classProbabilities: _probabilities,
    );

    if (newReport != null && mounted) {
      // Refresh user balance in auth provider
      context.read<AuthProvider>().refreshProfile();

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.check_circle_rounded, color: AppColors.completed, size: 52),
          title: const Text('Waste Report Submitted!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Report Code: ${newReport.reportCode}',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.ecoGoldLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.eco, color: AppColors.ecoGoldDark, size: 18),
                    SizedBox(width: 6),
                    Text(
                      '+10 EcoPoints Earned!',
                      style: TextStyle(
                        color: AppColors.ecoGoldDark,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Your incident is queued for municipal collector verification and dispatch. You can track progress in the Activity tab.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                if (Navigator.canPop(context)) {
                  Navigator.pop(context);
                } else {
                  setState(() {
                    _imageFile = null;
                    _descController.clear();
                    _addressController.clear();
                  });
                }
              },
              child: const Text('Done'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<ReportsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('File Waste Incident Report'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo Attachment Section
              const Text(
                'Incident Photograph',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),

              if (_imageFile != null)
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: kIsWeb
                          ? Image.network(
                              _imageFile!.path,
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.cover,
                            )
                          : Image.file(
                              _imageFile!,
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.cover,
                            ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        child: IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white, size: 18),
                          onPressed: () => _pickImage(ImageSource.camera),
                        ),
                      ),
                    ),
                  ],
                )
              else
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.add_a_photo_outlined, size: 36, color: AppColors.textMuted),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton.icon(
                            onPressed: () => _pickImage(ImageSource.camera),
                            icon: const Icon(Icons.camera_alt, size: 16),
                            label: const Text('Camera'),
                          ),
                          const SizedBox(width: 12),
                          OutlinedButton.icon(
                            onPressed: () => _pickImage(ImageSource.gallery),
                            icon: const Icon(Icons.photo_library, size: 16),
                            label: const Text('Gallery'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 20),

              // Category Picker
              const Text(
                'Waste Category',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                initialValue: _selectedCategory,
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
              const SizedBox(height: 10),
              WasteCategoryCard(
                categoryKey: _selectedCategory,
                confidencePercent: _confidence != null ? _confidence! * 100 : null,
                showFullGuidance: false,
              ),
              const SizedBox(height: 20),

              // Description
              CustomTextField(
                controller: _descController,
                label: 'Description & Landmarks',
                hint: 'e.g. Broken cardboard boxes behind bus stop on corner of 4th St.',
                maxLines: 3,
              ),
              const SizedBox(height: 20),

              // Location Information
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Location Coordinates',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  TextButton.icon(
                    onPressed: _isFetchingGps ? null : _acquireGpsLocation,
                    icon: _isFetchingGps
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.my_location, size: 16),
                    label: const Text('Refresh GPS'),
                  ),
                ],
              ),
              if (_locationStatus != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    _locationStatus!,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _latController,
                      label: 'Latitude',
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        final val = double.tryParse(v ?? '');
                        if (val == null || val < -90 || val > 90) return 'Invalid lat';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CustomTextField(
                      controller: _lngController,
                      label: 'Longitude',
                      keyboardType: TextInputType.number,
                      validator: (v) {
                        final val = double.tryParse(v ?? '');
                        if (val == null || val < -180 || val > 180) return 'Invalid lng';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              CustomTextField(
                controller: _addressController,
                label: 'Street / Neighborhood Name (Optional)',
                hint: 'Market St & 4th St, Downtown',
                prefixIcon: Icons.location_on_outlined,
              ),
              const SizedBox(height: 24),

              if (prov.errorMessage != null) ...[
                Text(
                  prov.errorMessage!,
                  style: const TextStyle(color: AppColors.rejected, fontSize: 13),
                ),
                const SizedBox(height: 12),
              ],

              CustomButton(
                text: 'Submit Waste Report (+10 EcoPoints)',
                isLoading: prov.isSubmitting,
                onPressed: _handleSubmit,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
